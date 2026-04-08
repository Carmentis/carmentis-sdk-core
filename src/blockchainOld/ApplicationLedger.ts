export {}
/*
import {SCHEMAS, SECTIONS} from "../constants/constants";
import {ApplicationLedgerVb} from "./ApplicationLedgerVb";
import {SchemaValidator} from "../data/schemaValidator";
import {Crypto} from "../crypto/crypto";
import {Utils} from "../utils/utils";
import {Provider} from "../providers/Provider";
import {
    ImportedProof,
    Proof
} from "./types";
import {Microblock, Section} from "./Microblock";
import {Hash} from "../entities/Hash";
import {CMTSToken} from "../economics/currencies/token";
import {StateUpdateRequest} from "./StateUpdateRequest";
import {Height} from "../entities/Height";
import {
    ActorNotInvitedError,
    CurrentActorNotFoundError,
    DecryptionError, IllegalParameterError,
    NoSharedSecretError,
    ProofVerificationFailedError,
    ProtocolError, SharedKeyDecryptionError
} from "../errors/carmentis-error";


import {HKDF} from "../crypto/kdf/HKDF";
import {ActorType} from "../constants/ActorType";
import {PublicSignatureKey} from "../crypto/signature/PublicSignatureKey";
import {SignatureSchemeId} from "../crypto/signature/SignatureSchemeId";
import {PublicKeyEncryptionSchemeId} from "../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeId";
import {
    AbstractPrivateDecryptionKey,
    AbstractPublicEncryptionKey
} from "../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeInterface";
import {
    AES256GCMSymmetricEncryptionKey,
    SymmetricEncryptionKey
} from "../crypto/encryption/symmetric-encryption/encryption-interface";
import {CryptoSchemeFactory} from "../crypto/CryptoSchemeFactory";
import {MlKemPrivateDecryptionKey} from "../crypto/encryption/public-key-encryption/MlKemPrivateDecryptionKey";
import {VirtualBlockchain} from "./VirtualBlockchain";
import {ExpirationDate} from "../providers/ExpirationDate";
import {CryptoEncoderFactory} from "../crypto/CryptoEncoderFactory";
import {EncoderFactory} from "../utils/encoder";
import {Logger} from "../utils/Logger";
import {Assertion} from "../utils/Assertion";
import {ApplicationLedgerPrivateChannelSection, ApplicationLedgerPublicChannelSection} from "./sectionSchemas";

export class ApplicationLedger {
    private provider: Provider;
    private allowedSignatureSchemeIds: SignatureSchemeId[];
    private allowedPkeSchemeIds: PublicKeyEncryptionSchemeId[];
    vb: ApplicationLedgerVb;
    gasPrice: CMTSToken;

    constructor({provider}: { provider: Provider }) {
        this.vb = new ApplicationLedgerVb({provider});
        this.provider = provider
        this.gasPrice = CMTSToken.zero();
        this.provider = provider

        // by default, we allow all signature schemes and all PKE schemes, modeled by an empty list
        this.allowedSignatureSchemeIds = [];
        this.allowedPkeSchemeIds = [];
    }

    setAllowedSignatureSchemes(schemeIds: SignatureSchemeId[]) {
        this.allowedSignatureSchemeIds = schemeIds;
    }

    setAllowedPkeSchemes(schemeIds: PublicKeyEncryptionSchemeId[]) {
        this.allowedPkeSchemeIds = schemeIds;
    }

    getAllowedSignatureSchemes() {
        return this.allowedSignatureSchemeIds;
    }

    getAllowedPkeSchemes() {
        return this.allowedPkeSchemeIds;
    }

    isAllowedSignatureScheme(schemeId: SignatureSchemeId) {
        return this.allowedSignatureSchemeIds.includes(schemeId);
    }

    isAllowedPkeScheme(schemeId: PublicKeyEncryptionSchemeId) {
        return this.allowedPkeSchemeIds.includes(schemeId);
    }

    getVirtualBlockchainId() {
        return Hash.from(this.vb.getId());
    }

    async getGenesisSeed() {
        return this.vb.getGenesisSeed();
    }

    getActorIdFromActorName(actorName: string) {
        return this.vb.getActorIdFromActorName(actorName);
    }




    async _create(applicationId: string) {
        if (!this.provider.isKeyed()) {
            throw 'Cannot create an application ledger without a keyed provider.'
        }
        await this.vb.setAllowedSignatureSchemes({
            schemeIds: this.allowedSignatureSchemeIds
        });
        await this.vb.setAllowedPkeSchemes({
            schemeIds: this.allowedPkeSchemeIds
        });
    }

    async _load(identifier: Uint8Array) {
        await this.vb.load(identifier);
    }

    async _processJson(hostPrivateDecryptionKey: AbstractPrivateDecryptionKey, object: StateUpdateRequest) {
        const validator = new SchemaValidator(SCHEMAS.RECORD_DESCRIPTION);
        validator.validate(object);

        // if there's a reference to an existing VB, load it
        if (object.virtualBlockchainId) {
            await this.vb.load(Utils.binaryFromHexa(object.virtualBlockchainId));
        }


        // TODO: remove this method which is a pretty bad fix....
        // I did it this way because of the "height" field in this.vb which is increased when the first section is added
        // creating a side effect. Since this is conditional branch based on this.vb.height, it never happen
        const { isBuildingGenesisMicroBlock } = this.vb.startMicroBlockConstruction();
        if (isBuildingGenesisMicroBlock) {
            // genesis -> declare the signature scheme and the application
            await this.vb.setAllowedSignatureSchemes({
                schemeIds: this.allowedSignatureSchemeIds
            });
            await this.vb.addDeclaration({
                applicationId: Utils.binaryFromHexa(object.applicationId)
            });
        }

        // add the new actors
        for (const def of object.actors || []) {
            await this.vb.createActor({
                id: this.vb.getNumberOfActors(),
                type: ActorType.UNKNOWN,
                name: def.name
            });
        }

        // when creating the virtual blockchain application ledger, the author is automatically
        // subscribed (it should also be created above so it must be specified in the actors section).
        const authorName = object.author;
        const authorId = this.vb.getActorIdFromActorName(authorName);
        if (isBuildingGenesisMicroBlock) {
            const authorPublicSignatureKey = this.provider.getPrivateSignatureKey().getPublicKey();
            const authorPublicEncryptionKey = hostPrivateDecryptionKey.getPublicKey();
            await this.subscribeActor(
                authorName,
                authorPublicSignatureKey,
                authorPublicEncryptionKey
            );
        }

        // add the new channels
        for (const def of object.channels || []) {
            await this.vb.createChannel({
                id: this.vb.getNumberOfChannels(),
                isPrivate: !def.public,
                creatorId: authorId,
                name: def.name
            });
        }

        // initialize an IR object, set the channels and load the data
        const ir = this.vb.getChannelSpecializedIntermediateRepresentationInstance();
        ir.buildFromJson(object.data);

        // process field assignations
        for (const def of object.channelAssignations || []) {
            const channelId = this.vb.getChannelIdByChannelName(def.channelName);
            ir.setChannel(def.fieldPath, channelId);
        }

        // process actor assignations
        // Note: we do not verify that the guest is already in the channel, this is verified in the callback during
        // section verifications.
        for (const def of object.actorAssignations || []) {
            const channelName = def.channelName;
            const actorName = def.actorName;
            await this.inviteActorOnChannel(actorName, channelName, hostPrivateDecryptionKey)
        }

        // process hashable fields
        for (const def of object.hashableFields || []) {
            ir.setAsHashable(def.fieldPath);
        }

        // process maskable fields
        for (const def of object.maskableFields || []) {
            const list = def.maskedParts.map((obj: any) => [obj.position, obj.position + obj.length, obj.replacementString]);
            ir.setAsMaskable(def.fieldPath, list);
        }

        // process channel data
        ir.finalizeChannelData();

        const channelDataList = ir.exportToSectionFormat();
        for (const channelData of channelDataList) {
            const {isPrivate: isPrivateChannel, channelId} = channelData;
            if (isPrivateChannel) {
                const channelKey = await this.vb.getChannelKey(authorId, channelId, hostPrivateDecryptionKey);
                const channelSectionKey = this.vb.deriveChannelSectionKey(channelKey, this.vb.height, channelId);
                const channelSectionIv = this.vb.deriveChannelSectionIv(channelKey, this.vb.height, channelId);
                const encryptedData = Crypto.Aes.encryptGcm(channelSectionKey, channelData.data, channelSectionIv);
                await this.vb.addPrivateChannelData({
                    channelId: channelId,
                    merkleRootHash: Utils.binaryFromHexa(channelData.merkleRootHash),
                    encryptedData: encryptedData
                });
            } else {
                await this.vb.addPublicChannelData({
                    channelId,
                    data: channelData.data
                });
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
            const endorserId = this.vb.getActorIdFromActorName(object.endorser);
            const messageToShow = object.approvalMessage ?? "";
            await this.vb.addEndorsementRequest(endorserId, messageToShow)
        }
    }


    actorIsSubscribed(name: string) {
        const actor = this.vb.getActor(name);
        return actor.subscribed;
    }

    async getRecord<T = any>(height: Height, hostPrivateDecryptionKey?: AbstractPrivateDecryptionKey) {
        const ir = await this.getMicroblockIntermediateRepresentation(height, hostPrivateDecryptionKey);
        return ir.exportToJson() as T;
    }

    async getRecordAtFirstBlock(hostPrivateDecryptionKey: AbstractPrivateDecryptionKey) {
        return this.getRecord(1, hostPrivateDecryptionKey);
    }

   
    async exportProof(customInfo: {
        author: string
    }, hostPrivateDecryptionKey: AbstractPrivateDecryptionKey): Promise<Proof> {
        const proofs = [];

        for (let height = 1; height <= this.vb.height; height++) {
            const ir = await this.getMicroblockIntermediateRepresentation(height, hostPrivateDecryptionKey);

            proofs.push({
                height: height,
                data: ir.exportToProof()
            });
        }

        const info = {
            title: "Carmentis proof file - Visit www.carmentis.io for more information",
            date: new Date().toJSON(),
            author: customInfo.author,
            virtualBlockchainIdentifier: Utils.binaryToHexa(this.vb.identifier)
        };

        return {
            info,
            proofs
        };
    }





    setGasPrice(gasPrice: CMTSToken) {
        this.gasPrice = gasPrice;
    }

    getApplicationId() {
        return Hash.from(this.vb.getApplicationId());
    }

    getHeight(): number {
        return this.vb.height;
    }

    async publishUpdates(waitForAnchoring: boolean = true) {
        if (!this.provider.isKeyed()) {
            throw 'Cannot publish updates without keyed provider.'
        }
        const privateKey = this.provider.getPrivateSignatureKey();
        this.vb.setGasPrice(this.gasPrice);
        await this.vb.signAsAuthor(privateKey);
        return await this.vb.publish(waitForAnchoring);
    }



    async getCreatedActorsAtHeight(height: Height) {
        // TODO implement method to list created actors
    }

    async getAuthorSignature(height: Height) {
        // TODO implement method to get author signature
    }

    async getEndorserSignature(height: Height) {
        // TODO implement method to get endorser signature
    }

    async getAuthorPublicKey(height: Height) {
        // TODO implement method to get author public key
    }

    async getEndorserPublicKey(height: Height) {
        // TODO implement method to get endorser public key
    }

    async getActorPublicKeys(actorName: string) {

    }

    async getActorNameByPublicKey(publicKey: PublicSignatureKey) {
    }

    setExpirationDurationInDays(durationInDays: number) {
        this.vb.setExpirationDay(durationInDays);
    }


}

 */
