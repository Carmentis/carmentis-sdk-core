import {NativeHCVSignatureEncoder} from "./NativeHCVSignatureEncoder";
import {PrivateSignatureKey} from "../../../signature/PrivateSignatureKey";
import {PublicSignatureKey} from "../../../signature/PublicSignatureKey";
import {Secp256k1PublicSignatureKey} from "../../../signature/secp256k1/Secp256k1PublicSignatureKey";
import {Secp256k1PrivateSignatureKey} from "../../../signature/secp256k1/Secp256k1PrivateSignatureKey";

/**
 * HCV encoder for Secp256k1 signature keys.
 *
 * Handles the encoding of Secp256k1 elliptic curve cryptography keys into HCV format.
 * The generated HCV format is:
 * - SIG:SECP256K1:SK:<base64_private_key> for private keys
 * - SIG:SECP256K1:PK:<base64_public_key> for public keys
 */
export class Secp256k1HCVSignatureEncoder extends NativeHCVSignatureEncoder {

    /**
     * Creates a new Secp256k1HCVSignatureEncoder instance.
     */
    constructor() {
        super(["SECP256K1"]);
    }

    /**
     * Checks if this encoder can handle the given private key.
     *
     * @param privateKey - The private key to check
     * @returns True if the key is a Secp256k1PrivateSignatureKey
     */
    async isAcceptingPrivateKeyEncodingRequest(privateKey: PrivateSignatureKey): Promise<boolean> {
        return privateKey instanceof Secp256k1PrivateSignatureKey;
    }

    /**
     * Checks if this encoder can handle the given public key.
     *
     * @param publicKey - The public key to check
     * @returns True if the key is a Secp256k1PublicSignatureKey
     */
    async isAcceptingPublicKeyEncodingRequest(publicKey: PublicSignatureKey): Promise<boolean> {
        return publicKey instanceof Secp256k1PublicSignatureKey;
    }
}
