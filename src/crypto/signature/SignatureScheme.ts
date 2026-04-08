import {SignatureSchemeId} from "./SignatureSchemeId";

/**
 * Represents a cryptographic signature scheme with methods to retrieve
 * identifying information and utilities for encoding public keys.
 */
export interface SignatureScheme {
    getSignatureSchemeId(): SignatureSchemeId;
    expectedSeedSize(): number;
    getSignatureSize(): number;
}