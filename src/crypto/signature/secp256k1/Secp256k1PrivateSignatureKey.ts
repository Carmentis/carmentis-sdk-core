import {etc, getPublicKey, PrivKey, sign as signSecp256k1, utils} from "@noble/secp256k1";
import {BasePrivateSignatureKey} from "../BasePrivateSignatureKey";
import {EncoderInterface} from "../../../utils/encoder";
import {PublicSignatureKey} from "../PublicSignatureKey";
import {Secp256k1PublicSignatureKey} from "./Secp256k1PublicSignatureKey";
import {sha256} from "@noble/hashes/sha2";
import {SignatureScheme} from "../SignatureScheme";
import {Secp256k1SignatureScheme} from "./Secp256k1SignatureScheme";

/**
 * Represents a private signature key using the Secp256k1 curve. This class extends
 * from `Secp256k1PublicSignatureKey` and implements the `PrivateSignatureKey` interface.
 * It provides functionality to generate a private key, derive its corresponding
 * public key, and sign data.
 *
 * Methods enable key generation, retrieving the associated public key,
 * and signing cryptographic hashes.
 */
export class Secp256k1PrivateSignatureKey extends BasePrivateSignatureKey {
    constructor(private privateKey: PrivKey) {
        super()
    }

    getPrivateKeyAsString(encoder: EncoderInterface<Uint8Array, string>): string {
        return encoder.encode(this.getPrivateKeyAsBytes())
    }

    /**
     * Generates and returns a new instance of Secp256k1PrivateSignatureKey
     * initialized with a randomly generated private key.
     *
     * @return {Secp256k1PrivateSignatureKey} A new Secp256k1PrivateSignatureKey object.
     */
    static gen(): Secp256k1PrivateSignatureKey {
        return new Secp256k1PrivateSignatureKey(utils.randomPrivateKey());
    }

    /**
     * Generates a Secp256k1 private signature key from a given seed.
     *
     * @param {Uint8Array} seed - The seed used to generate the private key.
     * @return {Secp256k1PrivateSignatureKey} The generated Secp256k1 private signature key.
     */
    static genFromSeed(seed: Uint8Array) {
        return new Secp256k1PrivateSignatureKey(etc.bytesToHex(seed))
    }

    async getPublicKey(): Promise<PublicSignatureKey> {
        if (this.privateKey instanceof Uint8Array) return new Secp256k1PublicSignatureKey(getPublicKey(this.privateKey));
        throw new Error("Invalid private key format: expected Uint8Array, got " + typeof this.privateKey + " instead.");
    }

    getPrivateKeyAsBytes(): Uint8Array {
        if (this.privateKey instanceof Uint8Array) return this.privateKey;
        throw new Error("Invalid private key format: expected Uint8Array, got " + typeof this.privateKey + " instead.");
    }

    async sign(data: Uint8Array): Promise<Uint8Array> {
        const msgHash = sha256(data);
        return signSecp256k1(msgHash, this.privateKey).toCompactRawBytes();
    }

    getScheme(): SignatureScheme {
        return new Secp256k1SignatureScheme();
    }
}