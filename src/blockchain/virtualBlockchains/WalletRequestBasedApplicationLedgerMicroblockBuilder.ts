import {ApplicationLedgerMicroblockBuilder} from "./ApplicationLedgerMicroblockBuilder";
import {ApplicationLedgerVb} from "./ApplicationLedgerVb";
import {
    AbstractPrivateDecryptionKey,
    AbstractPublicEncryptionKey
} from "../../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeInterface";
import {Microblock} from "../microblock/Microblock";
import {Utils} from "../../utils/utils";
import {ActorType} from "../../constants/ActorType";
import {Crypto} from "../../crypto/crypto";
import {DecryptionError, IllegalParameterError, SharedKeyDecryptionError} from "../../errors/carmentis-error";
import {PublicSignatureKey} from "../../crypto/signature/PublicSignatureKey";
import {Assertion} from "../../utils/Assertion";
import {Logger} from "../../utils/Logger";
import {HKDF} from "../../crypto/kdf/HKDF";
import {AES256GCMSymmetricEncryptionKey} from "../../crypto/encryption/symmetric-encryption/encryption-interface";
import {ICryptoKeyHandler} from "../../wallet/ICryptoKeyHandler";
import {PublicKeyEncryptionSchemeId} from "../../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeId";
import {SignatureSchemeId} from "../../crypto/signature/SignatureSchemeId";
import {SectionType} from "../../type/valibot/blockchain/section/SectionType";
import {Record} from "../../records/Record";
import {RecordByChannels} from "../../records/RecordByChannels";
import {MerkleRecord} from "../../records/MerkleRecord";
import {OnChainRecord} from "../../records/OnChainRecord";
import {
    ApplicationLedgerActorCreationSection,
    ApplicationLedgerActorSubscriptionSection,
    ApplicationLedgerChannelCreationSection,
    ApplicationLedgerChannelInvitationSection,
    ApplicationLedgerEndorsementRequestSection,
    ApplicationLedgerPrivateChannelDataSection,
    ApplicationLedgerPublicChannelDataSection,
    ApplicationLedgerSharedSecretSection,
    Section
} from "../../type/valibot/blockchain/section/sections";
import {Hash} from "../../entities/Hash";
import {
    AppLedgerMicroblockBuildRequest,
    AppLedgerMicroblockBuildRequestValidation
} from "../../type/AppLedgerStateUpdateRequest";
import {MaskPart} from "../../records/types";

export class WalletRequestBasedApplicationLedgerMicroblockBuilder extends ApplicationLedgerMicroblockBuilder {

    private logger = Logger.getLogger([WalletRequestBasedApplicationLedgerMicroblockBuilder.name]);
    static async createFromVirtualBlockchain(applicationId: Hash, vb: ApplicationLedgerVb) {
        const mb = await vb.createMicroblock();
        const builder = new WalletRequestBasedApplicationLedgerMicroblockBuilder(mb, vb)
        vb.setMicroblockSearchFailureFallback(builder);
        if (vb.isEmpty()) {
            const section: Section = {
                type: SectionType.APP_LEDGER_CREATION,
                applicationId: applicationId.toBytes()
            };
            mb.addSection(section)
            await builder.updateStateWithSection(section);
        }
        return builder;
    }

    private usedSignatureSchemeId: SignatureSchemeId = SignatureSchemeId.SECP256K1;
    private usedPkeSchemeId: PublicKeyEncryptionSchemeId = PublicKeyEncryptionSchemeId.ML_KEM_768_AES_256_GCM;

    constructor(
        mbUnderConstruction: Microblock,
        vb: ApplicationLedgerVb,
    ) {
        super(mbUnderConstruction, vb, vb.getProvider());
    }

    private get state() {
        return this.getInternalState()
    }

    private getActorPrivateSignatureKey(actorIdentity: ICryptoKeyHandler) {
        return actorIdentity.getPrivateSignatureKey(this.usedSignatureSchemeId);
    }

    private getActorPrivateDecryptionKey(actorIdentity: ICryptoKeyHandler) {
        return actorIdentity.getPrivateDecryptionKey(this.usedPkeSchemeId);
    }

    async createMicroblockFromStateUpdateRequest(
        hostIdentity: ICryptoKeyHandler,
        request: AppLedgerMicroblockBuildRequest
    ) {
        const object = AppLedgerMicroblockBuildRequestValidation.validate(request);
        const hostPrivateDecryptionKey = await this.getActorPrivateDecryptionKey(hostIdentity);
        const hostPrivateSignatureKey = await this.getActorPrivateSignatureKey(hostIdentity);

        // add the new actors
        let freeActorId = this.state.getNumberOfActors();
        for (const def of object.actors || []) {
            console.log(this.state.getAllActors())
            const actorName = def.name;
            if (this.vb.isActorDefined(actorName)) {
                console.log(`Skipping actor creation: ${actorName} already created`)
            } else {
                await this.createActor(freeActorId, def.name)
                freeActorId = freeActorId + 1;
            }
        }

        // when creating the virtual blockchain application ledger, the author is automatically
        // subscribed (it should also be created above so it must be specified in the actors section).
        const authorName = object.author;
        const authorId = this.getActorIdFromActorName(authorName);
        const isBuildingGenesisMicroBlock = this.vb.isEmpty();
        if (isBuildingGenesisMicroBlock) {
            const authorPublicEncryptionKey = await hostPrivateDecryptionKey.getPublicKey();
            await this.subscribeActor(
                authorName,
                await hostPrivateSignatureKey.getPublicKey(),
                authorPublicEncryptionKey
            );
        }

        // add the new channels
        let freeChannelId = this.state.getNumberOfChannels();
        for (const def of object.channels || []) {
            const section: ApplicationLedgerChannelCreationSection = {
                type: SectionType.APP_LEDGER_CHANNEL_CREATION,
                id: freeChannelId,
                isPrivate: !def.public,
                creatorId: authorId,
                name: def.name
            }
            this.mbUnderConstruction.addSection(section);
            await this.updateStateWithSection(section);
            freeChannelId += 1;
        }

        // initialize a Record object from the JSON object
        const record = Record.fromObject(object.data);

        // process field assignations
        for (const def of object.channelAssignations || []) {
            const channelId = this.state.getChannelIdFromChannelName(def.channelName);
            record.setChannel(def.fieldPath, channelId);
        }

        // process actor assignations
        // Note: we do not verify that the guest is already in the channel, this is verified in the callback during
        // section verifications.
        for (const def of object.actorAssignations || []) {
            const channelName = def.channelName;
            const actorName = def.actorName;
            await this.inviteActorOnChannel(
                actorName,
                channelName,
                hostIdentity
            )
        }

        // process hashable fields
        for (const def of object.hashableFields || []) {
            record.setAsHashable(def.fieldPath);
        }

        // process maskable fields
        for (const def of object.maskableFields || []) {
            const list: MaskPart[] = def.maskedParts.map((obj: any) => ({
                start: obj.position,
                end: obj.position + obj.length,
                replacement: obj.replacementString
            }));
            record.setMaskByPositions(def.fieldPath, list);
        }

        // declare public channels
        const allChannels = this.state.getAllChannels();
        for (const index in allChannels) {
            const channelId = Number(index);
            if (!allChannels[channelId].isPrivate) {
                record.setChannelAsPublic(Number(channelId));
            }
        }

        // Record -> RecordByChannels -> MerkleRecord -> OnChainRecord
        const recordByChannels = RecordByChannels.fromRecord(record);
        const merkleRecord = MerkleRecord.fromRecordByChannels(recordByChannels);
        const onChainRecord = OnChainRecord.fromMerkleRecord(merkleRecord);

        // process channel data
        const channelIds = onChainRecord.getChannelIds();

        for (const channelId of channelIds) {
            const channelData = onChainRecord.getOnChainData(channelId);
            const {isPublic, merkleRootHash} = channelData;
            if (isPublic) {
                const section: ApplicationLedgerPublicChannelDataSection = {
                    type: SectionType.APP_LEDGER_PUBLIC_CHANNEL_DATA,
                    channelId: channelId,
                    data: channelData.data
                }
                this.mbUnderConstruction.addSection(section)
                await this.updateStateWithSection(section)
            } else {
                const logger = Logger.getLogger(["critical"]);
                const height = this.vb.getHeight() + 1; // we are constructing a microblock so the height should be incremented to consider this microblock
                const channelKey = await this.vb.getChannelKey(authorId, channelId, hostIdentity);
                const channelSectionKey = this.vb.deriveChannelSectionKey(channelKey, height, channelId);
                const channelSectionIv = this.vb.deriveChannelSectionIv(channelKey, height, channelId);
                logger.debug(`Channel key ${channelKey} at height ${height} and channel id ${channelId} -> Channel section key: ${channelSectionKey} (iv ${channelSectionIv}) `)
                const encryptedData = Crypto.Aes.encryptGcm(channelSectionKey, channelData.data, channelSectionIv);
                const section: ApplicationLedgerPrivateChannelDataSection = {
                    type: SectionType.APP_LEDGER_PRIVATE_CHANNEL_DATA,
                    channelId: channelId,
                    merkleRootHash: merkleRootHash,
                    encryptedData: encryptedData
                }
                this.mbUnderConstruction.addSection(section);
                await this.updateStateWithSection(section);
            }
        }

        // the endorser (the user approving the transaction) is optional, for instance during direct anchoring
        // request coming from the operator. In this case, the endorser is missing. Otherwise, when included,
        // we have to add a section declaring the message to show on the wallet.
        if (typeof object.endorser === 'string') {
            // we reject the request if the endorser is empty
            const endorserName = object.endorser;
            if (endorserName.trim().length === 0) throw new IllegalParameterError("Empty endorser provided: should be a non-empty string or undefined");

            // sometimes, there is no message to show (not provided by the application server). In this case,
            // we replace the message with an empty string.
            const endorserId = this.getActorIdFromActorName(object.endorser);
            const messageToShow = object.approvalMessage ?? "";
            const section: ApplicationLedgerEndorsementRequestSection = {
                type: SectionType.APP_LEDGER_ENDORSEMENT_REQUEST,
                message: messageToShow,
                endorserId

            }
            this.mbUnderConstruction.addSection(section);
            await this.updateStateWithSection(section)
        }

        return this.mbUnderConstruction
    }

    async createActor(actorId: number, actorName: string) {
        console.log(`Creating actor ${actorName} (id ${actorId})`)
        const section: ApplicationLedgerActorCreationSection = {
            type: SectionType.APP_LEDGER_ACTOR_CREATION,
            id: actorId,
            actorType: ActorType.UNKNOWN,
            name: actorName
        }
        this.mbUnderConstruction.addSection(section)
        await this.updateStateWithSection(section);
    }

    async inviteActorOnChannel(actorName: string, channelName: string, hostIdentity: ICryptoKeyHandler) {
        console.log("Inviting actor " + actorName + " on channel " + channelName)
        const channelId = this.state.getChannelIdFromChannelName(channelName);
        const actorId = this.getActorIdFromActorName(actorName);
        const hostPrivateSignatureKey = await this.getActorPrivateSignatureKey(hostIdentity);
        const hostId = await this.vb.getActorIdByPublicSignatureKey(await hostPrivateSignatureKey.getPublicKey());
        Assertion.assert(typeof channelId === 'number', `Expected channel id of type number: got ${typeof channelId} for channel ${channelName}`)
        const guestId = actorId; // the guest is the actor assigned to the channel

        // to invite an actor on channel, we first need to known if the actor is already in the channel.
        // If yes, then we have nothing to do.
        if (await this.vb.isActorInChannel(channelId, guestId)) return;

        // we first have to ensure that the host is able to recover the channel key
        const channelKey = await this.vb.getChannelKey(hostId, channelId, hostIdentity);

        // if the host is already able to recover the channel key, then we do not need to create an invitation
        const guestPublicEncryptionKey = await this.vb.getPublicEncryptionKeyByActorId(guestId);
        const encryptedChannelKey = await guestPublicEncryptionKey.encrypt(channelKey);

        // we log the result
        const logger = Logger.getLogger([ApplicationLedgerVb.name]);
        logger.info(`Actor {guestName} invited to channel ${channelName}`, () => ({
            guestName: actorName,
        }))
        logger.debug(`Channel key for channel ${channelName}: ${channelKey}`)

        // we create the section containing the encrypted channel key (that can only be decrypted by the host and the guest)
        const section: ApplicationLedgerChannelInvitationSection = {
            type: SectionType.APP_LEDGER_CHANNEL_INVITATION,
            channelId,
            hostId,
            guestId,
            encryptedChannelKey,
        }
        this.mbUnderConstruction.addSection(section)
        await this.updateStateWithSection(section);

        /*
        // if the guestId equals the hostId, it is likely a misuse of the record. In this case, we do not do anything
        // because the author is already in the channel by definition (no need to create a shared key, ...).
        if (hostId === guestId) return
         */

        /*
        // To invite the actor in the channel, we first retrieve or generate a symmetric encryption key used to establish
        // secure communication between both peers. The key is then used to encrypt the channel key and put in a dedicated
        // section of the microblock.
        const hostGuestEncryptedSharedKey =
            await this.vb.getExistingSharedKey(hostId, guestId) ||
            await this.vb.getExistingSharedKey(guestId, hostId);

         */

        /*
        // if we have found the (encrypted) shared secret key, then we *attempt* to decrypt it, otherwise
        // there is no shared secret key and then we create a new one
        let hostGuestSharedKey: AES256GCMSymmetricEncryptionKey;
        const hostPrivateDecryptionKey = await this.getActorPrivateDecryptionKey(actorIdentity);
        if (hostGuestEncryptedSharedKey !== undefined) {
            console.log("Found existing shared key, attempting to decrypt it")
            try {
                hostGuestSharedKey = AES256GCMSymmetricEncryptionKey.createFromBytes(
                    await hostPrivateDecryptionKey.decrypt(hostGuestEncryptedSharedKey)
                );
            } catch (e) {
                if (e instanceof DecryptionError) {
                    throw new SharedKeyDecryptionError("Cannot decrypt the shared key with the provided decryption key: Have you provided the valid one?")
                } else {
                    throw e;
                }
            }
        } else {
            console.log("No existing shared key found, creating a new one")
            hostGuestSharedKey = await this.createSharedKey(hostPrivateDecryptionKey, hostId, guestId);
        }

         */
    }

    private async createSharedKey(hostPrivateDecryptionKey: AbstractPrivateDecryptionKey, hostId: number, guestId: number) {
        const {
            encryptedSharedKey,
            hostGuestSharedKey
        } = await this.generateSharedKeyAndEncryptedSharedKey(hostPrivateDecryptionKey, guestId);

        // we create the section containing the shared secret key
        const section: ApplicationLedgerSharedSecretSection = {
            type: SectionType.APP_LEDGER_SHARED_SECRET,
            hostId,
            guestId,
            encryptedSharedKey,
        }
        this.mbUnderConstruction.addSection(section)
        await this.updateStateWithSection(section);

        return hostGuestSharedKey;
    }

    /**
     * TODO: SHOULD NOT DERIVE FROM THE PRIVATE DECRYPTION KEY BUT FROM A DEDICATED SEED
     * @param hostPrivateDecryptionKey
     * @param vbGenesisSeed
     * @param guestId
     * @private
     */
    private static deriveHostGuestSharedKey(hostPrivateDecryptionKey: AbstractPrivateDecryptionKey, vbGenesisSeed: Uint8Array, guestId: number) {
        const hostPrivateDecryptionKeyBytes = hostPrivateDecryptionKey.getRawPrivateKey();
        const encoder = new TextEncoder;
        const info = Utils.binaryFrom(encoder.encode("SHARED_SECRET"), guestId);
        const hkdf = new HKDF();
        const keyMaterial = Utils.binaryFrom(hostPrivateDecryptionKeyBytes, vbGenesisSeed)
        const hostGuestSharedKeyBytes = hkdf.deriveKeyNoSalt(keyMaterial, info, 32);
        const hostGuestSharedKey = AES256GCMSymmetricEncryptionKey.createFromBytes(hostGuestSharedKeyBytes);
        return hostGuestSharedKey;
    }

    private async generateSharedKeyAndEncryptedSharedKey(hostPrivateDecryptionKey: AbstractPrivateDecryptionKey, guestId: number) {
        const vbGenesisSeed = await this.getGenesisSeed();
        const hostGuestSharedKey = WalletRequestBasedApplicationLedgerMicroblockBuilder.deriveHostGuestSharedKey(hostPrivateDecryptionKey, vbGenesisSeed.toBytes(), guestId);

        // we encrypt the shared key with the guest's public key
        const guestPublicEncryptionKey = await this.vb.getPublicEncryptionKeyByActorId(guestId);
        const encryptedSharedKey = await guestPublicEncryptionKey.encrypt(hostGuestSharedKey.getRawSecretKey());
        return {encryptedSharedKey, hostGuestSharedKey}
    }

    private async getGenesisSeed() {
        if (this.vb.isEmpty()) {
            return this.mbUnderConstruction.getPreviousHash();
        } else {
            return await this.vb.getGenesisSeed();
        }
    }

    /**
     * Subscribes an actor in the application ledger.
     *
     * A subscription is used to associate public keys to an actor name (or identifier).
     *
     * In contrast with the actor creation declaring a new actor without associating a signature and encryption public
     * key, the actor subscription associates the signature and the encryption public keys an actor.
     * Be aware that the subscribed actor should be already defined!
     *
     *
     * @param actorName The name of the actor subscribed on the application ledger.
     * @param actorPublicSignatureKey  The public signature key of the actor.
     * @param actorPublicEncryptionKey The public encryption key of the actor.
     *
     * @returns
     */
    async subscribeActor(
        actorName: string,
        actorPublicSignatureKey: PublicSignatureKey,
        actorPublicEncryptionKey: AbstractPublicEncryptionKey,
    ) {
        console.debug(`Subscribing ${actorName}`)

        // if the actor currently do not exist, create it
        if (!this.vb.isActorDefined(actorName)) {
            console.log(`It appears that ${actorName} does not exist: create it`)
            const freeActorId = this.vb.getNumberOfActors();
            await this.createActor(freeActorId, actorName);
        }

        // The actor type is currently not used in the protocol
        const unknownActorType = ActorType.UNKNOWN;

        // The organization id is currently not used in the protocol.
        // Initially, it has been designed to handle the case where a user from another organization is added to an external vb.
        const actorId = this.getActorIdFromActorName(actorName);
        const nullOrganizationId = Utils.getNullHash();
        const section: ApplicationLedgerActorSubscriptionSection = {
            type: SectionType.APP_LEDGER_ACTOR_SUBSCRIPTION,
            actorId,
            actorType: unknownActorType,
            organizationId: nullOrganizationId,
            signatureSchemeId: actorPublicSignatureKey.getSignatureSchemeId(),
            signaturePublicKey: await actorPublicSignatureKey.getPublicKeyAsBytes(),
            pkeSchemeId: actorPublicEncryptionKey.getSchemeId(),
            pkePublicKey: await actorPublicEncryptionKey.getRawPublicKey(),
        }
        this.mbUnderConstruction.addSection(section);
        await this.updateStateWithSection(section);
    }

    private getActorIdFromActorName(actorName: string) {
        return this.state.getActorIdByName(actorName);
    }
}