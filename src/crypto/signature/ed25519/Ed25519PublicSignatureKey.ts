import {BasePublicSignatureKey} from "../BasePublicSignatureKey";
import {sha256} from "@noble/hashes/sha2";
import {SignatureScheme} from "../SignatureScheme";
import {Ed25519SignatureScheme} from "./Ed25519SignatureScheme";
import {verify as verifyEd25519} from "@noble/ed25519";

/**
 * A class representing a Ed25519 public signature key. This class is responsible for
 * handling the public key operations such as retrieving the raw public key and verifying
 * signatures against specified data.
 *
 * This class extends the Ed25519SignatureScheme and implements the PublicSignatureKey interface.
 */
export class Ed25519PublicSignatureKey extends BasePublicSignatureKey {

    constructor(private publicKey: Uint8Array) {
        super();
    }

    async getPublicKeyAsBytes(): Promise<Uint8Array> {
        return this.publicKey;
    }

    async verify(data: Uint8Array, signature: Uint8Array): Promise<boolean> {
        const msgHash = sha256(data);
        return verifyEd25519(signature, msgHash, this.publicKey);
    }

    getScheme(): SignatureScheme {
        return new Ed25519SignatureScheme();
    }
}