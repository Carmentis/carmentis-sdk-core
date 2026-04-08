import {getPublicKey, Bytes, sign as signEd25519, utils} from "@noble/ed25519";
import {BasePrivateSignatureKey} from "../BasePrivateSignatureKey";
import {EncoderInterface} from "../../../utils/encoder";
import {PublicSignatureKey} from "../PublicSignatureKey";
import {Ed25519PublicSignatureKey} from "./Ed25519PublicSignatureKey";
import {sha256} from "@noble/hashes/sha2";
import {SignatureScheme} from "../SignatureScheme";
import {Ed25519SignatureScheme} from "./Ed25519SignatureScheme";

/**
 * Represents a private signature key using the Ed25519 curve. This class extends
 * from `Ed25519PublicSignatureKey` and implements the `PrivateSignatureKey` interface.
 * It provides functionality to generate a private key, derive its corresponding
 * public key, and sign data.
 *
 * Methods enable key generation, retrieving the associated public key,
 * and signing cryptographic hashes.
 */
export class Ed25519PrivateSignatureKey extends BasePrivateSignatureKey {
    constructor(private privateKey: Bytes) {
        super()
    }

    getPrivateKeyAsString(encoder: EncoderInterface<Uint8Array, string>): string {
        return encoder.encode(this.getPrivateKeyAsBytes())
    }

    /**
     * Generates and returns a new instance of Ed25519PrivateSignatureKey
     * initialized with a randomly generated private key.
     *
     * @return {Ed25519PrivateSignatureKey} A new Ed25519PrivateSignatureKey object.
     */
    static gen(): Ed25519PrivateSignatureKey {
        return new Ed25519PrivateSignatureKey(utils.randomSecretKey());
    }

    /**
     * Generates a Ed25519 private signature key from a given seed.
     *
     * @param {Uint8Array} seed - The seed used to generate the private key.
     * @return {Ed25519PrivateSignatureKey} The generated Ed25519 private signature key.
     */
    static genFromSeed(seed: Uint8Array) {
        return new Ed25519PrivateSignatureKey(seed);
    }

    async getPublicKey(): Promise<PublicSignatureKey> {
        if (this.privateKey instanceof Uint8Array) return new Ed25519PublicSignatureKey(getPublicKey(this.privateKey));
        throw new Error("Invalid private key format: expected Uint8Array, got " + typeof this.privateKey + " instead.");
    }

    getPrivateKeyAsBytes(): Uint8Array {
        if (this.privateKey instanceof Uint8Array) return this.privateKey;
        throw new Error("Invalid private key format: expected Uint8Array, got " + typeof this.privateKey + " instead.");
    }

    async sign(data: Uint8Array): Promise<Uint8Array> {
        const msgHash = sha256(data);
        return signEd25519(msgHash, this.privateKey);
    }

    getScheme(): SignatureScheme {
        return new Ed25519SignatureScheme();
    }
}