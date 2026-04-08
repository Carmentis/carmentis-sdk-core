import {SignatureScheme} from "./SignatureScheme";
import {PublicSignatureKey} from "./PublicSignatureKey";

import {SignatureSchemeId} from "./SignatureSchemeId";

/**
 * Represents a private signature key utilized in cryptographic operations.
 *
 * This interface extends the `SignatureScheme` and provides functionality
 * to generate a corresponding public key and to sign data.
 */
export interface PrivateSignatureKey {
    getScheme(): SignatureScheme;
    getPublicKey(): Promise<PublicSignatureKey>;
    sign(data: Uint8Array): Promise<Uint8Array>;
    getPrivateKeyAsBytes(): Uint8Array;
    getSignatureSchemeId(): SignatureSchemeId;
}