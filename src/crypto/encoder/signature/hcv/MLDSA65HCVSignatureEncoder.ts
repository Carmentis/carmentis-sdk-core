import {NativeHCVSignatureEncoder} from "./NativeHCVSignatureEncoder";
import {PrivateSignatureKey} from "../../../signature/PrivateSignatureKey";
import {PublicSignatureKey} from "../../../signature/PublicSignatureKey";
import {MLDSA65PrivateSignatureKey, MLDSA65PublicSignatureKey} from "../../../signature/ml-dsa-65";

/**
 * HCV encoder for ML-DSA-65 signature keys.
 *
 * Handles the encoding of ML-DSA-65 (Module-Lattice-Based Digital Signature Algorithm)
 * post-quantum cryptography keys into HCV format.
 *
 * The generated HCV format is:
 * - SIG:MLDSA65:SK:<base64_private_key> for private keys
 * - SIG:MLDSA65:PK:<base64_public_key> for public keys
 *
 * ML-DSA-65 is a post-quantum signature scheme based on lattice cryptography,
 * designed to be secure against attacks by quantum computers.
 */
export class MLDSA65HCVSignatureEncoder extends NativeHCVSignatureEncoder {

    /**
     * Creates a new MLDSA65HCVSignatureEncoder instance.
     */
    constructor() {
        super(["MLDSA65"]);
    }

    /**
     * Checks if this encoder can handle the given private key.
     *
     * @param privateKey - The private key to check
     * @returns True if the key is a MLDSA65PrivateSignatureKey
     */
    async isAcceptingPrivateKeyEncodingRequest(privateKey: PrivateSignatureKey): Promise<boolean> {
        return privateKey instanceof MLDSA65PrivateSignatureKey;
    }

    /**
     * Checks if this encoder can handle the given public key.
     *
     * @param publicKey - The public key to check
     * @returns True if the key is a MLDSA65PublicSignatureKey
     */
    async isAcceptingPublicKeyEncodingRequest(publicKey: PublicSignatureKey): Promise<boolean> {
        return publicKey instanceof MLDSA65PublicSignatureKey;
    }
}
