import {NativeHCVSignatureDecoder} from "./NativeHCVSignatureDecoder";
import {PrivateSignatureKey} from "../../../signature/PrivateSignatureKey";
import {PublicSignatureKey} from "../../../signature/PublicSignatureKey";
import {MLDSA65PrivateSignatureKey, MLDSA65PublicSignatureKey} from "../../../signature/ml-dsa-65";

/**
 * HCV decoder for ML-DSA-65 signature keys.
 *
 * Handles the decoding of ML-DSA-65 (Module-Lattice-Based Digital Signature Algorithm)
 * post-quantum cryptography keys stored in HCV format.
 * The expected HCV format is: SIG:MLDSA65:SK:<base64_private_key> for private keys
 * and SIG:MLDSA65:PK:<base64_public_key> for public keys.
 *
 * ML-DSA-65 is a post-quantum signature scheme based on lattice cryptography.
 */
export class MLDSA65HCVSignatureDecoder extends NativeHCVSignatureDecoder {

    private static ML_DSA65_SIGNATURE_KEY = "MLDSA65";

    /**
     * Creates a new MLDSA65HCVSignatureDecoder instance.
     */
    constructor() {
        super([MLDSA65HCVSignatureDecoder.ML_DSA65_SIGNATURE_KEY]);
    }

    protected bootstrapPrivateKey(privateKeyBytes: Uint8Array): PrivateSignatureKey {
        return new MLDSA65PrivateSignatureKey(privateKeyBytes);
    }

    protected bootstrapPublicKey(publicKeyBytes: Uint8Array): PublicSignatureKey {
        return new MLDSA65PublicSignatureKey(publicKeyBytes);
    }
}
