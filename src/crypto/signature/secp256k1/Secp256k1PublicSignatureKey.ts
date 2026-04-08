import {BasePublicSignatureKey} from "../BasePublicSignatureKey";
import {sha256} from "@noble/hashes/sha2";
import {SignatureScheme} from "../SignatureScheme";
import {Secp256k1SignatureScheme} from "./Secp256k1SignatureScheme";
import {verify as verifySecp256k1} from "@noble/secp256k1";

/**
 * A class representing a Secp256k1 public signature key. This class is responsible for
 * handling the public key operations such as retrieving the raw public key and verifying
 * signatures against specified data.
 *
 * This class extends the Secp256k1SignatureScheme and implements the PublicSignatureKey interface.
 */
export class Secp256k1PublicSignatureKey extends BasePublicSignatureKey {

    constructor(private publicKey: Uint8Array) {
        super();
    }

    async getPublicKeyAsBytes(): Promise<Uint8Array> {
        return this.publicKey;
    }

    async verify(data: Uint8Array, signature: Uint8Array): Promise<boolean> {
        const msgHash = sha256(data);
        return verifySecp256k1(signature, msgHash, this.publicKey);
    }

    getScheme(): SignatureScheme {
        return new Secp256k1SignatureScheme();
    }
}