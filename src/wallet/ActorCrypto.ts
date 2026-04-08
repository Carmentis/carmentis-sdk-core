import {Utils} from "../utils/utils";
import {CryptoSchemeFactory} from "../crypto/CryptoSchemeFactory";
import {PublicKeyEncryptionSchemeId} from "../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeId";
import {BinaryToStringEncoderInterface} from "../utils/BinaryToStringEncoderInterface";
import {SignatureSchemeId} from "../crypto/signature/SignatureSchemeId";
import {SeedEncoder} from "../utils/SeedEncoder";
import {ICryptoKeyHandler} from "./ICryptoKeyHandler";

export class ActorCrypto implements ICryptoKeyHandler {
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

    async getPrivateSignatureKey(schemeId: SignatureSchemeId) {
        const kdf = CryptoSchemeFactory.createDefaultKDF();
        const info = this.encoderStringAsBytes("SIG");
        const seed = kdf.deriveKeyNoSalt(
            this.actorSeed,
            info,
            32
        );
        return CryptoSchemeFactory.createPrivateSignatureKey( schemeId, seed );
    }

    async getPublicSignatureKey(schemeId: SignatureSchemeId) {
        const privateKey = await this.getPrivateSignatureKey(schemeId);
        return privateKey.getPublicKey();
    }

    getPrivateDecryptionKey(schemeId: PublicKeyEncryptionSchemeId) {
        const kdf = CryptoSchemeFactory.createDefaultKDF();
        const info = this.encoderStringAsBytes("PKE");
        const seed = kdf.deriveKeyNoSalt(
            this.actorSeed,
            info,
            64
        );
        return CryptoSchemeFactory.createPrivateDecryptionKey( schemeId, seed );
    }

    async getPublicEncryptionKey(schemeId: PublicKeyEncryptionSchemeId) {
        const privateDecryptionKey = await this.getPrivateDecryptionKey(schemeId);
        return privateDecryptionKey.getPublicKey();
    }

    private encoderStringAsBytes(data: string): Uint8Array {
        const encoder = new TextEncoder();
        return encoder.encode(data);
    }
}