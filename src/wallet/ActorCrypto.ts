import {Utils} from "../utils/utils";
import {CryptoSchemeFactory} from "../crypto/CryptoSchemeFactory";
import {PublicKeyEncryptionSchemeId} from "../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeId";
import {BinaryToStringEncoderInterface} from "../utils/BinaryToStringEncoderInterface";
import {SignatureSchemeId} from "../crypto/signature/SignatureSchemeId";
import {SeedEncoder} from "../utils/SeedEncoder";
import {ICryptoKeyHandler} from "./ICryptoKeyHandler";

export class ActorCrypto implements ICryptoKeyHandler {
    private signatureSchemeId: SignatureSchemeId = SignatureSchemeId.SECP256K1;
    private pkeSchemeId: PublicKeyEncryptionSchemeId = PublicKeyEncryptionSchemeId.ML_KEM_768_AES_256_GCM;

    constructor(private readonly actorSeed: Uint8Array) {}

    static createFromAccountSeedAndVbSeed(accountSeed: Uint8Array, vbSeed: Uint8Array) {
        const actorSeed = Utils.binaryFrom(accountSeed, vbSeed);
        return new ActorCrypto(actorSeed);
    }

    static parseFromString(seed: string,  encoder: BinaryToStringEncoderInterface = new SeedEncoder()): ActorCrypto {
        return new ActorCrypto(encoder.decode(seed));
    }

    encode( encoder: BinaryToStringEncoderInterface = new SeedEncoder()): string {
        return encoder.encode(this.actorSeed);
    }

    getSeedAsBytes(): Uint8Array {
        return this.actorSeed
    }

    async getPrivateSignatureKey(schemeId: SignatureSchemeId = this.signatureSchemeId) {
        const kdf = CryptoSchemeFactory.createDefaultKDF();
        const info = this.encoderStringAsBytes("SIG");
        const seed = kdf.deriveKeyNoSalt(
            this.actorSeed,
            info,
            32
        );
        return CryptoSchemeFactory.createPrivateSignatureKey( schemeId, seed );
    }

    async getPublicSignatureKey(schemeId: SignatureSchemeId = this.signatureSchemeId) {
        const privateKey = await this.getPrivateSignatureKey(schemeId);
        return privateKey.getPublicKey();
    }

    getPrivateDecryptionKey(schemeId: PublicKeyEncryptionSchemeId = this.pkeSchemeId) {
        const kdf = CryptoSchemeFactory.createDefaultKDF();
        const info = this.encoderStringAsBytes("PKE");
        const seed = kdf.deriveKeyNoSalt(
            this.actorSeed,
            info,
            64
        );
        return CryptoSchemeFactory.createPrivateDecryptionKey( schemeId, seed );
    }

    async getPublicEncryptionKey(schemeId: PublicKeyEncryptionSchemeId = this.pkeSchemeId) {
        const privateDecryptionKey = await this.getPrivateDecryptionKey(schemeId);
        return privateDecryptionKey.getPublicKey();
    }

    private encoderStringAsBytes(data: string): Uint8Array {
        const encoder = new TextEncoder();
        return encoder.encode(data);
    }

    getSignatureSchemeId(): SignatureSchemeId {
        return this.signatureSchemeId;
    }

    setSignatureSchemeId(schemeId: SignatureSchemeId): void {
        this.signatureSchemeId = schemeId;
    }

    getPkeSchemeId(): PublicKeyEncryptionSchemeId {
        return this.pkeSchemeId;
    }

    setPkeSchemeId(schemeId: PublicKeyEncryptionSchemeId): void {
        this.pkeSchemeId = schemeId;
    }

}