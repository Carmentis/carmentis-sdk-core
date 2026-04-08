import {BaseHCVSignatureDecoder} from "./BaseHCVSignatureDecoder";
import {PrivateSignatureKey} from "../../../signature/PrivateSignatureKey";
import {PublicSignatureKey} from "../../../signature/PublicSignatureKey";
import {HCVCodec} from "../../../../utils/HCVCodec";
import {
    PkmsSecp256k1PrivateSignatureKey,
    PkmsSecp256k1PublicSignatureKey
} from "../../../signature/pkms/PkmsSecp256k1PrivateSignatureKey";

/**
 * HCV decoder for PKMS (Public Key Management Service) Secp256k1 signature keys.
 *
 * Handles the decoding of Secp256k1 keys managed by a PKMS service.
 * Unlike native key storage, PKMS keys store only a key identifier (keyId) for private keys,
 * while the actual cryptographic material is stored securely in the PKMS service.
 *
 * The expected HCV format is:
 * - SIG:PKMS:SECP256K1:SK:<keyId> for private keys
 * - SIG:PKMS:SECP256K1:PK:<base64_public_key> for public keys
 */
export class PkmsSecp256k1SignatureDecoder extends BaseHCVSignatureDecoder {

    private static label = [
        "PKMS",
        "SECP256K1",
    ];

    /**
     * Creates a new PkmsSecp256k1SignatureDecoder instance.
     */
    constructor() {
        super(PkmsSecp256k1SignatureDecoder.label);
    }

    /**
     * Decodes a PKMS private key from HCV format.
     * Extracts the key identifier that references the key stored in the PKMS service.
     *
     * @param encodedPrivateKey - The HCV-encoded PKMS key identifier
     * @returns A PkmsSecp256k1PrivateSignatureKey instance containing the key ID
     */
    async decodePrivateKey(encodedPrivateKey: string): Promise<PrivateSignatureKey> {
        const result = HCVCodec.decode(encodedPrivateKey);
        const pkmsKeyId = result.getValue()
        return new PkmsSecp256k1PrivateSignatureKey(pkmsKeyId);
    }

    /**
     * Decodes a PKMS public key from HCV format.
     * The public key is stored as base64-encoded bytes in the HCV format.
     *
     * @param encodedPublicKey - The HCV-encoded public key
     * @returns A PkmsSecp256k1PublicSignatureKey instance
     */
    async decodePublicKey(encodedPublicKey: string): Promise<PublicSignatureKey> {
        const result = HCVCodec.decode(encodedPublicKey);
        const publicKeyBytes = this.bytesEncoder.decode(result.getValue());
        return new PkmsSecp256k1PublicSignatureKey(publicKeyBytes);
    }
}
