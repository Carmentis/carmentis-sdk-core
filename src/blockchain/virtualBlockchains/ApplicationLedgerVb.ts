import {VirtualBlockchain} from "./VirtualBlockchain";
import {HKDF} from "../../crypto/kdf/HKDF";
import {Utils} from "../../utils/utils";

import {
    ActorNotInvitedError,
    ActorNotSubscribedError,
    CurrentActorNotFoundError,
    DecryptionError,
    MicroBlockNotFoundInVirtualBlockchainAtHeightError,
    NoSharedSecretError,
    ProofVerificationFailedError,
    ProtocolError,
    SectionNotFoundError,
} from "../../errors/carmentis-error";
import {Microblock} from "../microblock/Microblock";
import {
    AbstractPrivateDecryptionKey,
    AbstractPublicEncryptionKey
} from "../../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeInterface";
import {AES256GCMSymmetricEncryptionKey} from "../../crypto/encryption/symmetric-encryption/encryption-interface";
import {Logger} from "../../utils/Logger";
import {Crypto} from "../../crypto/crypto";
import {Assertion} from "../../utils/Assertion";
import {PublicSignatureKey} from "../../crypto/signature/PublicSignatureKey";
import {
    ApplicationLedgerMicroblockStructureChecker
} from "../structureCheckers/ApplicationLedgerMicroblockStructureChecker";

import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {Hash} from "../../entities/Hash";
import {Height} from "../../type/Height";
import {CryptoSchemeFactory} from "../../crypto/CryptoSchemeFactory";
import {SectionType} from "../../type/valibot/blockchain/section/SectionType";
import {IProvider} from "../../providers/IProvider";
import {ApplicationLedgerInternalState} from "../internalStates/ApplicationLedgerInternalState";
import {InternalStateUpdaterFactory} from "../internalStatesUpdater/InternalStateUpdaterFactory";
import {ICryptoKeyHandler} from "../../wallet/ICryptoKeyHandler";
import {SignatureSchemeId} from "../../crypto/signature/SignatureSchemeId";
import {PublicKeyEncryptionSchemeId} from "../../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeId";
import {ProtocolInternalState} from "../internalStates/ProtocolInternalState";
import {ApplicationLedgerChannelInvitationSection} from "../../type/valibot/blockchain/section/sections";
import {SeedEncoder} from "../../utils/SeedEncoder";
import {ProofDocumentVB} from "../../records/ProofDocumentVB";
import {ProofDocument} from "../../records/ProofDocument";
import {ProofWrapper, JsonData} from "../../records/types";
import {ImportedProof} from "../../type/types";
import {ProofRecord} from "../../records/ProofRecord";
import {OnChainRecord} from "../../records/OnChainRecord";

export class ApplicationLedgerVb extends VirtualBlockchain<ApplicationLedgerInternalState> {

    // ------------------------------------------
    // Static methods
    // ------------------------------------------
    static createApplicationLedgerVirtualBlockchain(provider: IProvider) {
        return new ApplicationLedgerVb(provider);
    }


    // ------------------------------------------
    // Instance implementation
    // ------------------------------------------

    /**
     * The draft mode allows to write unchecked microblock to the virtual blockchain
     * @private
     */
    private draftModeEnabled: boolean  = false;

    constructor(provider: IProvider, state: ApplicationLedgerInternalState = ApplicationLedgerInternalState.createInitialState()) {
        super(provider, VirtualBlockchainType.APP_LEDGER_VIRTUAL_BLOCKCHAIN, state )
    }

    async isAccountIdAllowedToWrite(accountId:Hash) {
        // when the virtual blockchain is empty, any account can write to it
        if (this.getHeight() === 0) return true;


        // otherwise, we check that the account ID is contained in the set of allowed writers.
        const owner = await this.getVirtualBlockchainOwnerId();
        const additionalWriters = this.internalState.getAdditionalAllowedWriters();
        const allowedWriters: Uint8Array[] = [
            owner.toBytes(),
            ...additionalWriters
        ]
        return allowedWriters.some(allowedWriter => Utils.binaryIsEqual(allowedWriter, accountId.toBytes()))
    }

    async getVirtualBlockchainState() {
        const height = this.getHeight();
        const lastMicroblockHash = height === 0 ?
            Utils.getNullHash() :
            (await this.getLastMicroblock()).getHash().toBytes();
        return {
            expirationDay: this.getExpirationDay(),
            height: height,
            internalState: this.internalState.toObject(),
            lastMicroblockHash: lastMicroblockHash,
            type: this.getType()
        };
    }


    async getVirtualBlockchainOwnerId() {
        const appId = this.internalState.getApplicationId();
        const applicationVb = await this.provider.loadApplicationVirtualBlockchain(appId);
        return applicationVb.getVirtualBlockchainOwnerId();
    }

    protected async updateInternalState(protocolState: ProtocolInternalState, state: ApplicationLedgerInternalState, microblock: Microblock) {
        const applicationLedgerInternalStateUpdaterVersion = protocolState.getApplicationLedgerInternalStateUpdaterVersion();
        const stateUpdater = InternalStateUpdaterFactory.createApplicationLedgerInternalStateUpdater(
            applicationLedgerInternalStateUpdaterVersion
        );
        return stateUpdater.updateState(this.provider, this.internalState, microblock);
    }
    
    protected checkMicroblockStructure(microblock:Microblock) {
        if (this.draftModeEnabled) return true;
        const checker = new ApplicationLedgerMicroblockStructureChecker();
        return checker.checkMicroblockStructure(microblock)
    }

    enableDraftMode() {
        this.draftModeEnabled = true;
    }
    disableDraftMode() {
        this.draftModeEnabled = false;
    }


    setInternalState(state: ApplicationLedgerInternalState) {
        this.internalState = state;
    }


    isActorDefined(name: string) {
        return this.internalState.isActorDefinedByName(name)
    }

    actorIsSubscribed(name: string) {
        const actor = this.getActor(name);
        return actor.subscribed;
    }

    getInternalState() {
        return this.internalState;
    }


    /**
     * Retrieves the public encryption key of an actor by its identifier.
     *
     * @param actorId The identifier of the actor.
     * @returns The public encryption key of the actor.
     */
    async getActorIdByPublicSignatureKey(publicKey: PublicSignatureKey): Promise<number> {
        const logger = Logger.getLogger([ApplicationLedgerVb.name]);

        const state = this.internalState;
        const publicKeyBytes = publicKey.getPublicKeyAsBytes();
        for (let actorId = 0; actorId < state.getNumberOfActors(); actorId++) {
            const actor = state.getActorById(actorId);
            logger.debug(`Search current actor id: loop index ${actorId}`)
            const isNotSubscribed = !actor.subscribed;
            if (isNotSubscribed) continue;

            try {
                // we search for the section describing the actor subscription
                const keyMicroblock = await this.getMicroblock(actor.signatureKeyHeight);
                for (const section of keyMicroblock.getAllSections()) {
                    // we search a section declaring an actor subscription
                    if (section.type !== SectionType.APP_LEDGER_ACTOR_SUBSCRIPTION) continue;

                    // we search a section focusing the current actor
                    const {actorId: actorFocusedByThisSection} = section;
                    const isFocusingActorInTheLoop = actorFocusedByThisSection === actorId;
                    if (!isFocusingActorInTheLoop) continue;

                    // we now ensure that the public signature key declared in the section and used by the current user are matching
                    const {signaturePublicKey} = section;
                    const isMatchingPublicKeys = Utils.binaryIsEqual(section.signaturePublicKey, await publicKeyBytes);
                    logger.debug(`Is public key matching for actor ${actor.name} (id ${actorId})? ${signaturePublicKey} and ${publicKeyBytes}: ${isMatchingPublicKeys}`);
                    if (!isMatchingPublicKeys) continue

                    logger.debug(`Matching public signature key: {actor.name} (id ${actorId})`, {actor})
                    return actorId;
                }
            } catch (e) {
                if (e instanceof MicroBlockNotFoundInVirtualBlockchainAtHeightError) {
                    // this case is okay for actors not being registered yet
                    logger.debug('{e}', {e})
                } else if (e instanceof SectionNotFoundError) {
                    // againt this error might occur if the user is not defined
                    logger.debug('{e}', {e})
                } else {
                    throw e;
                }
            }
        }

        logger.debug('Current actor not found')
        throw new CurrentActorNotFoundError();
    }

    /**
     * Retrieves the public encryption key of an actor by its identifier.
     *
     * @param actorId The identifier of the actor.
     * @returns The public encryption key of the actor.
     */
    async getPublicEncryptionKeyByActorId(actorId: number): Promise<AbstractPublicEncryptionKey> {
        // recover the actor's public encryption key from the virtual blockchain state
        // and ensure that the public encryption key is defined
        const actor = this.internalState.getActorById(actorId);
        const actorPublicKeyEncryptionHeightDefinition = actor.pkeKeyHeight;
        const isPkeDefined =
            typeof actorPublicKeyEncryptionHeightDefinition === 'number' &&
            actorPublicKeyEncryptionHeightDefinition !== 0;
        if (isPkeDefined) {
            // search the microblock containing the actor subscription (and the public encryption key definition)
            const microBlock = await this.getMicroblock(actorPublicKeyEncryptionHeightDefinition);
            for (const section of microBlock.getAllSections()) {
                // we search a section declaring an actor subscription for a specific actor id
                if (section.type !== SectionType.APP_LEDGER_ACTOR_SUBSCRIPTION) continue;
                const isMatchingActorId = section.actorId == actorId
                if (!isMatchingActorId) continue;


                // reconstruct the public encryption key
                const rawPkePublicKey = section.pkePublicKey;
                const pkeSchemeId = section.pkeSchemeId;
                return CryptoSchemeFactory.createPublicEncryptionKey(pkeSchemeId, rawPkePublicKey);
            }
        }
        const actorName = this.getActorNameById(actorId);
        throw new ActorNotSubscribedError(actorId, actorName)
    }

    /**
     * Retrieves the public encryption key of an actor by its identifier.
     *
     * @param actorId The identifier of the actor.
     * @returns The public encryption key of the actor.
     */
    async getPublicSignatureKeyByActorId(actorId: number): Promise<PublicSignatureKey> {
        // recover the actor's public encryption key from the virtual blockchain state
        // and ensure that the public encryption key is defined
        const actor = this.internalState.getActorById(actorId);
        const actorPublicKeySigHeightDefinition = actor.signatureKeyHeight;
        const isSigKeyDefined =
            typeof actorPublicKeySigHeightDefinition === 'number' &&
            actorPublicKeySigHeightDefinition !== 0;
        if (isSigKeyDefined) {
            // search the microblock containing the actor subscription (and the public encryption key definition)
            const microBlock = await this.getMicroblock(actorPublicKeySigHeightDefinition);
            for (const section of microBlock.getAllSections()) {
                // we search a section declaring an actor subscription for a specific actor id
                if (section.type !== SectionType.APP_LEDGER_ACTOR_SUBSCRIPTION) continue;
                const isMatchingActorId = section.actorId == actorId
                if (!isMatchingActorId) continue;


                // reconstruct the public signature key
                const rawSigKey = section.signaturePublicKey;
                const schemeId = section.signatureSchemeId;
                return CryptoSchemeFactory.createPublicSignatureKey(schemeId, rawSigKey);
            }
        }
        throw new ProtocolError(`Actor ${actorId} has not subscribed to a public signature key.`)
    }

    /**
     * Retrieves an existing shared key between two peers, or undefined.
     */
    async getExistingSharedKey(hostId: number, guestId: number): Promise<Uint8Array | undefined> {
        // search the guest actor associated with the provided guest id
        const guestActor = this.internalState.getActorById(guestId);

        // we search in the state the height of the microblock where the (encrypted) shared key is declared
        const sharedSecretFromState = guestActor.sharedSecrets.find(
            (object) => object.peerActorId == hostId
        );

        // if no shared secret is defined, then return undefined
        if (sharedSecretFromState === undefined) {
            return undefined;
        }

        // search the section declaring the (encrypted) shared key in the microblock specified in the state.
        const microBlock = await this.getMicroblock(sharedSecretFromState.height);
        for (const section of microBlock.getAllSections()) {
            if (section.type !== SectionType.APP_LEDGER_SHARED_SECRET) continue;
            if (section.hostId !== hostId || section.guestId !== guestId) continue;
            return section.encryptedSharedKey;
        }


        // At this step, there is a shared secret section in the vb declaring
        // a shared secret between guest and host but no shared key is included in the section: very very bad!
        throw new NoSharedSecretError(guestId, hostId);
    }

    getChannelIdByChannelName(channelName: string) {
        return this.internalState.getChannelIdFromChannelName(channelName)
    }

    private getActorNameById(actorId: number) {
        const actor = this.internalState.getActorById(actorId);
        return actor.name;
    }

    getChannelNameById(channelId: number) {
        const channel = this.internalState.getChannelFromChannelId(channelId);
        return channel.name;
    }

    getActorIdFromActorName(name: string) {
        return this.internalState.getActorIdByName(name);
    }

    getActor(name: string) {
        return this.internalState.getActorByName(name);
    }

    getAllActors() {
        return this.internalState.getAllActors();
    }

    getAllChannels() {
        return this.internalState.getAllChannels();
    }

    async getOrganizationId(): Promise<Hash> {
        const applicationId = this.getApplicationId();
        const applicationVb = await this.provider.loadApplicationVirtualBlockchain(applicationId);
        const orgId = applicationVb.getOrganizationId();
        return orgId;
    }

    /**
     * Retrieves the application ID from the current state.
     *
     * @return {Hash} The application ID.
     */
    getApplicationId(): Hash {
        return this.internalState.getApplicationId();
    }

    /**
     * Retrieves the total number of channels currently available.
     *
     * @return {number} The number of channels.
     */
    getNumberOfChannels(): number {
        return this.internalState.getNumberOfChannels();
    }

    /**
     * Retrieves a channel object by its unique identifier.
     *
     * @param {number} channelId - The unique identifier of the channel
     */
    getChannelById(channelId: number) {
        return this.internalState.getChannelFromChannelId(channelId);
    }

    /**
     * Retrieves the total number of actors currently present in the state.
     *
     * @return {number} The number of actors.
     */
    getNumberOfActors(): number {
        return this.internalState.getNumberOfActors()
    }

    private async getMicroblockMerkleRecord(height: number, hostIdentity?: ICryptoKeyHandler) {
        const microblock = await this.getMicroblock(height);
        const listOfChannels: { channelId: number, isPublic: boolean, merkleRootHash: Uint8Array, data: Uint8Array }[] = [];

        // we load the public channels that should be always accessible
        for (const section of microblock.getAllSections()) {
            if (section.type !== SectionType.APP_LEDGER_PUBLIC_CHANNEL_DATA) continue;
            const {channelId, data} = section;
            listOfChannels.push({
                channelId: channelId,
                isPublic: true,
                merkleRootHash: Utils.getNullHash(),
                data: data
            });
        }

        // we now load private channels that might be protected (encrypted)
        const logger = Logger.getLogger([ApplicationLedgerVb.name]);
        if ( hostIdentity !== undefined ) {
            const hostPrivateSignatureKey = await hostIdentity.getPrivateSignatureKey(SignatureSchemeId.SECP256K1);
            const hostPublicSignatureKey = await hostPrivateSignatureKey.getPublicKey();

            // we attempt to identify the current actor
            let currentActorId: number | undefined;
            try {
                currentActorId = await this.getActorIdByPublicSignatureKey(hostPublicSignatureKey)
            } catch (e) {
                if (e instanceof CurrentActorNotFoundError) {
                    // This case occurs when the current actor is not found in the application ledger
                    // which happen when an external actor attempts to read the content of the application ledger.
                    const logger = Logger.getLogger([ApplicationLedgerVb.name]);
                    logger.debug("Unabled to recover private channels: {e}", {e})
                } else {
                    throw e;
                }
            }

            // if the current actor is found, then we attempt to decrypt the private channels
            if (typeof currentActorId === 'number') {
                for (const section of microblock.getAllSections()) {
                    // we only focus on private channel data sections
                    if (section.type !== SectionType.APP_LEDGER_PRIVATE_CHANNEL_DATA) continue;
                    const {channelId, encryptedData, merkleRootHash} = section;
                    try {
                        const channelKey = await this.getChannelKey(currentActorId, channelId, hostIdentity);
                        const channelSectionKey = this.deriveChannelSectionKey(channelKey, height, channelId);
                        const channelSectionIv = this.deriveChannelSectionIv(channelKey, height, channelId);
                        logger.debug(`Channel key ${channelKey} at height ${height} and channel id ${channelId} -> Channel section key: ${channelSectionKey} (iv ${channelSectionIv}) `)
                        const data = Crypto.Aes.decryptGcm(channelSectionKey, encryptedData, channelSectionIv);

                        logger.debug(`Allowed to access private channel {channelName} (channel id={channelId})`, () => ({
                            channelName: this.getChannelNameById(channelId),
                            channelId
                        }))

                        listOfChannels.push({
                            channelId: channelId,
                            isPublic: false,
                            merkleRootHash: merkleRootHash,
                            data: data
                        });
                    } catch (e) {
                        if (e instanceof DecryptionError || e instanceof ActorNotInvitedError) {
                            //console.warn(`Not allowed to access channel ${channelId}`)
                            logger.debug(`Access to private channel {channelName} forbidden (channel id={channelId}): {e}`, () => ({
                                e,
                                channelName: this.getChannelNameById(channelId),
                                channelId
                            }))
                        } else {
                            throw e;
                        }
                    }
                }
            }
        } else {
            console.warn("No private channel loaded: no private decryption key provided.")
        }

        // import the channels to an OnChainRecord, then export a MerkleRecord
        const onChainRecord = new OnChainRecord();
        for (const channel of listOfChannels) {
            onChainRecord.addOnChainData(channel.channelId, channel.isPublic, channel.merkleRootHash, channel.data);
        }
        const merkleRecord = onChainRecord.toMerkleRecord(false);
        return merkleRecord;
    }

    deriveChannelSectionKey(channelKey: Uint8Array, height: number, channelId: number) {
        return this.deriveChannelSectionMaterial(channelKey, "CHANNEL_SECTION_KEY", height, channelId, 32);
    }

    deriveChannelSectionIv(channelKey: Uint8Array, height: number, channelId: number) {
        return this.deriveChannelSectionMaterial(channelKey, "CHANNEL_SECTION_IV", height, channelId, 12);
    }

    deriveChannelSectionMaterial(channelKey: Uint8Array, prefix: string, height: number, channelId: number, keyLength: number) {
        const salt = new Uint8Array();
        const encoder = new TextEncoder;

        const info = Utils.binaryFrom(
            encoder.encode(prefix),
            channelId,
            new Uint8Array(Utils.intToByteArray(height, 6))
        );

        const hkdf = new HKDF();

        return hkdf.deriveKey(channelKey, salt, info, keyLength);
    }

    /**
     *
     * @param actorId
     * @param channelId
     * @param actorPrivateDecryptionKey
     *
     * @throws ActorNotInvitedError Occurs when no invitation of the actor has been found.
     * @throws NoSharedSecretError Occurs when no shared secret key has been found.
     * @throws DecryptionError Occurs when one of the encrypted channel key or encrypted shared key cannot be decrypted.
     */
    async getChannelKey(actorId: number, channelId: number, hostIdentity: ICryptoKeyHandler) {
        // defensive programming
        Assertion.assert(typeof actorId === 'number', 'Expected actor id with type number')
        Assertion.assert(typeof channelId === 'number', `Expected channel id of type number: got ${typeof channelId}`)


        // if the actor id is the creator of the channel, then we have to derive the channel key locally...
        const state = this.internalState;
        const creatorId = state.getChannelCreatorIdFromChannelId(channelId);
        const actorPrivateDecryptionKey = await hostIdentity.getPrivateDecryptionKey(PublicKeyEncryptionSchemeId.ML_KEM_768_AES_256_GCM);
        if (creatorId === actorId) {
            const usedSeed = hostIdentity.getSeedAsBytes();
            const channelKey = await this.deriveChannelKey(
                usedSeed,
                channelId
            );
            return channelKey;
        }

        // ... otherwise we have to obtain the (encryption of the) channel key from an invitation section.
        const channelKey = await this.getChannelKeyFromInvitation(actorId, channelId, actorPrivateDecryptionKey);
        return channelKey;
    }

    /**
     * Returns a channel key derived directly from the private key of the current actor.
     * @param channelId
     */
    async deriveChannelKey(seed: Uint8Array, channelId: number) {
        const genesisSeed = await this.getGenesisSeed();
        const encoder = new TextEncoder;
        const info = Utils.binaryFrom(encoder.encode("CHANNEL_KEY"));
        const inputKeyMaterial = Utils.binaryFrom(
            seed,
            encoder.encode("GENESIS_SEED"),
            genesisSeed.toBytes(),
            encoder.encode("CHANNEL_ID"),
            Utils.binaryFrom(channelId)
        );
        const hkdf = new HKDF();
        return hkdf.deriveKeyNoSalt(inputKeyMaterial, info, 32);
    }

    /**
     * Returns a channel key from an invitation obtained directly from a microblock.
     *
     * An invitation contains, in particular, contains the encryption of a channel key that should be decrypted
     * by a shared key, encrypted using the public key of the actor id.
     *
     * @param actorId
     * @param channelId
     * @param actorPrivateDecryptionKey The (asymmetric) decryption key used to decrypt the shared key, later used to decrypt the channel key.
     * @private
     *
     * @throws ActorNotInvitedError Occurs when no invitation of the actor has been found.
     * @throws NoSharedSecretError Occurs when no shared secret key has been found.
     * @throws DecryptionError Occurs when one of the encrypted channel key or encrypted shared key cannot be decrypted.
     */
    private async getChannelKeyFromInvitation(
        actorId: number,
        channelId: number,
        actorPrivateDecryptionKey: AbstractPrivateDecryptionKey
    ) {
        Assertion.assert(typeof actorId === 'number', `actorId should be a number, got ${typeof actorId}`)
        Assertion.assert(typeof channelId === 'number', `channelId should be a number, got ${typeof actorId}`)

        // look for an invitation of actorId to channelId and extract the encrypted channel key
        const actor = this.internalState.getActorById(actorId);
        const actorOnChannelInvitation = actor.invitations.find(
            (invitation) => invitation.channelId == channelId
        );

        // if there is no invitation, then the actor is not allowed, easy
        if (!actorOnChannelInvitation) {
            const actor = this.internalState.getActorById(actorId);
            const actorName = actor.name;
            const channel = this.internalState.getChannelFromChannelId(channelId);
            const channelName = channel.name;
            throw new ActorNotInvitedError(actorName, channelName);
        }

        // we search for the channel invitation
        const invitationMicroblock = await this.getMicroblock(actorOnChannelInvitation.height);
        let invitationSection: ApplicationLedgerChannelInvitationSection | undefined;
        for (const section of invitationMicroblock.getAllSections()) {
            if (section.type !== SectionType.APP_LEDGER_CHANNEL_INVITATION) continue;
            if (section.guestId !== actorId || section.channelId !== channelId) continue;
            invitationSection = section;
            /*
            const invitationSection = invitationMicroblock.getSection<ApplicationLedgerChannelInvitationSection>((section: Section<ApplicationLedgerChannelInvitationSection>) =>
                section.type == SECTIONS.APP_LEDGER_CHANNEL_INVITATION &&
                section.object.channelId == channelId &&
                section.object.guestId == actorId
            );

             */
        }
        // raise an error if the actor is not invited to the channel
        if (invitationSection === undefined) throw new ActorNotInvitedError(actorId, channelId);
        const encryptedChannelKey = invitationSection.encryptedChannelKey;
        return await actorPrivateDecryptionKey.decrypt(encryptedChannelKey);
        /*


        // look for the shared secret between actorId and hostId
        const hostId = invitationSection.hostId;

        const sharedSecret = actor.sharedSecrets.find(
            (sharedSecret) => sharedSecret.peerActorId == hostId
        );
        if (!sharedSecret) {
            throw new NoSharedSecretError(actorId, hostId);
        }

        const sharedSecretMicroblock = await this.getMicroblock(sharedSecret.height);
        for (const section of sharedSecretMicroblock.getAllSections()) {
            if (section.type !== SectionType.APP_LEDGER_SHARED_SECRET) continue;
            if (section.hostId !== hostId || section.guestId !== actorId) continue;
            const encryptedSharedKey = section.encryptedSharedKey;
            const hostGuestSharedKey = AES256GCMSymmetricEncryptionKey.createFromBytes(
                await actorPrivateDecryptionKey.decrypt(encryptedSharedKey)
            );
            const channelKey = hostGuestSharedKey.decrypt(encryptedChannelKey);
            return channelKey;

        }
        // at this point, no shared key has been found
        throw new NoSharedSecretError(actorId, hostId);

         */

    }

    /**
     * Returns an instance of an intermediate representation defining only the channels.
     */
/*
    getChannelSpecializedIntermediateRepresentationInstance() {
        const ir = new IntermediateRepresentation;

        const numberOfChannels = this.internalState.getNumberOfChannels();

        for (let channelId = 0; channelId < numberOfChannels; channelId++) {
            const channel = this.internalState.getChannelFromChannelId(channelId);

            if (channel.isPrivate) {
                ir.addPrivateChannel(channelId);
            } else {
                ir.addPublicChannel(channelId);
            }
        }
        return ir;
    }
*/
    /**
     * Exports a proof containing intermediate representations for all microblocks up to the current height of the virtual blockchain.
     *
     * @param {Object} customInfo - Custom information to include in the proof.
     * @param hostPrivateSignatureKey
     * @param hostPrivateDecryptionKey
     * @param {string} customInfo.author - The author of the proof file.
     * @return {Promise<Object>} A promise that resolves to an object containing metadata and the exported proof data.
     * @return {Object} return.info - Metadata about the proof.
     * @return {string} return.info.title - A title describing the proof file.
     * @return {string} return.info.date - The date the proof was created, in ISO format.
     * @return {string} return.info.author - The author of the proof file.
     * @return {string} return.info.virtualBlockchainIdentifier - The identifier of the virtual blockchain.
     * @return {Array<Object>} return.proofs - An array of exported proof data for each microblock.
     * @return {number} return.proofs[].height - The height of the microblock.
     * @return {Object} return.proofs[].data - The proof data for the corresponding microblock.
     */
    async exportProof(
        customInfo: { author: string },
        hostIdentity: ICryptoKeyHandler
    ): Promise<ProofWrapper> {
        const proofDocumentVB = new ProofDocumentVB();
        proofDocumentVB.setIdentifier(Utils.binaryToHexa(this.getIdentifier().toBytes()))

        for (let height = 1; height <= this.getHeight(); height++) {
            const merkleRecord = await this.getMicroblockMerkleRecord(height, hostIdentity);
            console.log(`Merkle record at height ${height}:`, merkleRecord)
            const proofRecord = ProofRecord.fromMerkleRecord(merkleRecord);
            console.log(`Proof record at height ${height}:`, proofRecord)
            const proofChannels = proofRecord.toProofChannels();
            console.log(`Proof channels at height ${height}:`, proofChannels)
            proofDocumentVB.addMicroblock(height, proofChannels);
        }

        const proofDocument = new ProofDocument();
        proofDocument.setAuthor(customInfo.author);
        proofDocument.addVirtualBlockchain(proofDocumentVB);

        return proofDocument.getObject();
    }

    /**
     *
     * @param proofObject
     * @param hostPrivateSignatureKey
     * @param hostPrivateDecryptionKey
     * @throws ProofVerificationFailedError Occurs when the provided proof is not verified.
     */
    async importProof(
        proofWrapper: ProofWrapper,
    ): Promise<ImportedProof[]> {
        const data: ImportedProof[] = [];
        const proofDocument = ProofDocument.fromObject(proofWrapper);
        const proofVirtualBlockchain = proofDocument.getSingleVirtualBlockchainOrFail();
        const proofMicroblocks = proofVirtualBlockchain.getMicroblocks();

        for (const proofMicroblock of proofMicroblocks) {
            // get the microblock at the expected height, extract all channel data sections
            // and store their channel IDs and Merkle root hashes in listOfChannels
            const height = proofMicroblock.height;
            const onChainMicroblock = await this.getMicroblock(height);
            const listOfChannels: { channelId: number, merkleRootHash: Uint8Array }[] = [];

            for (const section of onChainMicroblock.getAllSections()) {
                if (section.type === SectionType.APP_LEDGER_PUBLIC_CHANNEL_DATA) {
                    const {channelId} = section;
                    listOfChannels.push({
                        channelId,
                        merkleRootHash: Utils.getNullHash(),
                    });
                }
                else if (section.type === SectionType.APP_LEDGER_PRIVATE_CHANNEL_DATA) {
                    const {channelId, merkleRootHash} = section;
                    listOfChannels.push({
                        channelId,
                        merkleRootHash,
                    });
                }
            }

            // extract the channels from the proof microblock and compare all Merkle root hashes
            console.log("ProofMicroblock.channels=", proofMicroblock.channels)
            const proofRecord = ProofRecord.fromProofChannels(proofMicroblock.channels);

            for (const channel of listOfChannels) {
                const computedMerkleRootHash = proofRecord.getRootHashAsBinary(channel.channelId);
                if (!Utils.binaryIsEqual(channel.merkleRootHash, computedMerkleRootHash)) {
                    console.log(computedMerkleRootHash, channel)
                    const computedHash = Utils.binaryToHexa(computedMerkleRootHash);
                    const onChainHash = Utils.binaryToHexa(channel.merkleRootHash);
                    throw new ProofVerificationFailedError(channel.channelId, computedHash, onChainHash);
                }
            }

            data.push({
                height,
                data: proofRecord.toJson()
            });
        }

        return data;
    }

    /**
     * Retrieves a record by fetching the microblock intermediate representation
     * and exporting it to JSON.
     *
     * @param {Height} height - The height at which the record is to be fetched.
     * @param hostPrivateSignatureKey
     * @param {AbstractPrivateDecryptionKey} [hostPrivateDecryptionKey] - Optional private decryption key for the host.
     * @return {Promise<T>} A promise that resolves with the exported record in JSON format.
     */
    async getRecord(
        height: Height,
        hostIdentity?: ICryptoKeyHandler
    ): Promise<JsonData> {
        const merkleRecord = await this.getMicroblockMerkleRecord(height, hostIdentity);
        const proofRecord = ProofRecord.fromMerkleRecord(merkleRecord);
        return proofRecord.toJson();
    }

    /**
     Section callbacks
     */

    /*
    async allowedSignatureSchemesCallback(microblock: any, section: any) {
        this.getState().allowedSignatureSchemeIds = section.object.schemeIds;
    }

    async allowedPkeSchemesCallback(microblock: any, section: any) {
        this.getState().allowedPkeSchemeIds = section.object.schemeIds;
    }

    async declarationCallback(microblock: Microblock, section: Section<ApplicationLedgerDeclarationSection>) {
        this.getState().applicationId = section.object.applicationId;
    }

    async actorCreationCallback(microblock: Microblock, section: Section<ApplicationLedgerActorCreationSection>) {
        const state = this.getState();

        if (section.object.id != state.actors.length) {
            throw new InvalidActorError(section.object.id, state.actors.length);
        }
        if (state.actors.some((obj: any) => obj.name == section.object.name)) {
            throw new ActorAlreadyDefinedError(section.object.name);
        }
        state.actors.push({
            name: section.object.name,
            subscribed: false,
            signatureKeyHeight: 0,
            pkeKeyHeight: 0,
            sharedSecrets: [],
            invitations: []
        });
    }

    async actorSubscriptionCallback(microblock: any, section: any) {
        const state = this.getState();
        const actor = state.actors[section.object.actorId]; // I have remove - 1 because it causes invalid actorId

        if (actor === undefined) {
            throw new CannotSubscribeError(section.object.actorId);
        }
        if (actor.subscribed) {
            throw new AlreadySubscribedError(section.object.actorId);
        }

        // we check that the provided public signature scheme is allowed
        const checkedSignatureSchemeId = section.object.signatureSchemeId;
        const allowedSignatureSchemeIds = state.allowedSignatureSchemeIds;
        const isAllowingAllSignatureSchemes = allowedSignatureSchemeIds.length == 0;
        const isExplicitlyAllowedSignatureScheme = allowedSignatureSchemeIds.includes(checkedSignatureSchemeId);
        const isNotAllowedSignatureScheme = !isAllowingAllSignatureSchemes && !isExplicitlyAllowedSignatureScheme;
        if (isNotAllowedSignatureScheme) {
            throw new NotAllowedSignatureSchemeError(section.object.signatureSchemeId);
        }

        // we check that the provided public key encryption scheme is allowed
        const checkedPkeSchemeId = section.object.pkeSchemeId;
        const allowedPkeSchemeIds = state.allowedPkeSchemeIds;
        const isAllowingAllPkeSchemes = allowedPkeSchemeIds.length == 0;
        const isExplicitlyAllowedPkeScheme = allowedPkeSchemeIds.includes(checkedPkeSchemeId);
        const isNotAllowedPkeScheme = !isAllowingAllPkeSchemes && !isExplicitlyAllowedPkeScheme;
        if (isNotAllowedPkeScheme) {
            throw new NotAllowedPkeSchemeError(section.object.pkeSchemeId);
        }

        actor.subscribed = true;
        actor.signatureKeyHeight = microblock.header.height;
        actor.pkeKeyHeight = microblock.header.height;
    }

    async channelCreationCallback(microblock: any, section: any) {
        const state = this.getState();
        if (section.object.id != state.channels.length) {
            throw new InvalidChannelError(section.object.id);
        }
        if (state.channels.some((obj: any) => obj.name == section.object.name)) {
            throw new ChannelAlreadyDefinedError(section.object.name);
        }
        state.channels.push({
            name: section.object.name,
            isPrivate: section.object.isPrivate,
            creatorId: section.object.creatorId
        });
    }

    async sharedSecretCallback(microblock: Microblock, section: Section<ApplicationLedgerSharedKeySection>) {
        // TODO: check that there is no shared secret yet
        // TODO: check that there host and guest already exists
        // Here

        // we update the local state with the shared secret section
        const { hostId, guestId } = section.object;
        const state = this.getState();

        // update first the actor
        const hostActor = state.actors[hostId];
        hostActor.sharedSecrets.push({
            height: microblock.getHeight(), peerActorId: guestId
        });

        // then update the guest
        const guestActor = state.actors[guestId];
        guestActor.sharedSecrets.push({
            height: microblock.getHeight(), peerActorId: hostId
        })
    }

    async invitationCallback(microblock: Microblock, section: Section<ApplicationLedgerChannelInvitationSection>) {
        // TODO: check that the actor is not already in the channel
        // Here

        // we update the local state with the invitation section
        const {guestId, channelId} = section.object;
        const state = this.getState();
        const guestActor = state.actors[guestId];
        guestActor.invitations.push({
            channelId,
            height: microblock.getHeight()
        })
        const logger = Logger.getLogger();
        logger.debug("Updated state after channel invitation callback: {state}", {state: this.localState})
    }

    async publicChannelDataCallback(microblock: Microblock, section: any) {
        if (!this.getState().channels[section.object.channelId]) {
            throw `invalid channel ID ${section.object.channelId}`;
        }
    }

    async privateChannelDataCallback(microblock: Microblock, section: any) {
        if (!this.getState().channels[section.object.channelId]) {
            throw `invalid channel ID ${section.object.channelId}`;
        }
    }

    async endorserSignatureCallback(microblock: Microblock, section: any) {
    }

    async authorSignatureCallback(microblock: Microblock, section: any) {
        const application = new Application({provider: this.provider});
        await application._load(this.getState().applicationId);
        const publicKey = await application.getOrganizationPublicKey();
        const feesPayerAccount = await this.provider.getAccountHashByPublicKey(publicKey);
        microblock.setFeesPayerAccount(feesPayerAccount);
    }

     */


    async isActorInChannel(channelId: number, actorId: number) {
        const actor = this.internalState.getActorById(actorId);
        return actor.invitations.some(invitation => invitation.channelId == channelId);
    }
}
