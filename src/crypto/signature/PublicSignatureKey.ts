import {SignatureScheme} from "./SignatureScheme";
import {SignatureSchemeId} from "./SignatureSchemeId";

/**
 * Represents a public signature key adhering to a specific signature scheme.
 * This interface provides methods to verify digital signatures and fetch the raw public key.
 *
 * @interface PublicSignatureKey
 * @extends SignatureScheme
 *
 * @method verify
 *   Verifies the digital signature for the provided data.
 *   @param {Uint8Array} data - The original data to be verified.
 *   @param {Uint8Array} signature - The digital signature corresponding to the provided data.
 *   @returns {boolean} - Returns true if the signature is valid for the data, false otherwise.
 *
 * @method getPublicKeyAsBytes
 *   Retrieves the raw representation of the public key.
 *   This is useful for serialization, transmission, or other forms of key processing.
 *   @returns {Uint8Array} - The raw bytes of the public key.
 */
export interface PublicSignatureKey {
    getScheme(): SignatureScheme;

    verify(data: Uint8Array, signature: Uint8Array): Promise<boolean>;

    getPublicKeyAsBytes(): Promise<Uint8Array>;

    getSignatureSchemeId(): SignatureSchemeId;
}