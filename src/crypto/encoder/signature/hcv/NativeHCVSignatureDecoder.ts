import {BaseHCVSignatureDecoder} from "./BaseHCVSignatureDecoder";
import {PrivateSignatureKey} from "../../../signature/PrivateSignatureKey";
import {PublicSignatureKey} from "../../../signature/PublicSignatureKey";
import {HCVCodec} from "../../../../utils/HCVCodec";

/**
 * Abstract decoder for native (non-PKMS) signature keys stored in HCV format.
 *
 * This decoder handles keys where the raw cryptographic material is stored directly
 * in the encoded format, as opposed to keys stored in a key management service.
 *
 * Subclasses must implement the bootstrapping methods to create the appropriate
 * key objects from the decoded byte arrays.
 */
export abstract class NativeHCVSignatureDecoder extends BaseHCVSignatureDecoder {

    /**
     * Creates a private signature key instance from the raw key bytes.
     *
     * @param privateKeyBytes - The raw bytes of the private key
     * @returns A PrivateSignatureKey instance
     */
    protected abstract bootstrapPrivateKey(privateKeyBytes: Uint8Array): PrivateSignatureKey;

    /**
     * Creates a public signature key instance from the raw key bytes.
     *
     * @param publicKeyBytes - The raw bytes of the public key
     * @returns A PublicSignatureKey instance
     */
    protected abstract bootstrapPublicKey(publicKeyBytes: Uint8Array): PublicSignatureKey;

    /**
     * Decodes an HCV-encoded private key into a PrivateSignatureKey instance.
     * Extracts the base64-encoded key bytes and delegates to bootstrapPrivateKey.
     *
     * @param encodedPrivateKey - The HCV-encoded private key string
     * @returns The decoded PrivateSignatureKey
     */
    async decodePrivateKey(encodedPrivateKey: string): Promise<PrivateSignatureKey> {
        const result = HCVCodec.decode(encodedPrivateKey);
        const privateKeyBytes = this.bytesEncoder.decode(result.getValue());
        return this.bootstrapPrivateKey(privateKeyBytes)
    }

    /**
     * Decodes an HCV-encoded public key into a PublicSignatureKey instance.
     * Extracts the base64-encoded key bytes and delegates to bootstrapPublicKey.
     *
     * @param encodedPublicKey - The HCV-encoded public key string
     * @returns The decoded PublicSignatureKey
     */
    async decodePublicKey(encodedPublicKey: string): Promise<PublicSignatureKey> {
        const result = HCVCodec.decode(encodedPublicKey);
        const publicKeyBytes = this.bytesEncoder.decode(result.getValue());
        return this.bootstrapPublicKey(publicKeyBytes)
    }
}
