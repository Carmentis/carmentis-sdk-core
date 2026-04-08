import {SignatureScheme} from "../SignatureScheme";
import {SignatureSchemeId} from "../SignatureSchemeId";

/**
 * The `Ed25519SignatureScheme` class implements the `SignatureScheme` interface and provides
 * functionality specific to the Ed25519 elliptic curve cryptographic signature scheme.
 */
export class Ed25519SignatureScheme implements SignatureScheme {
    private static SIGNATURE_SIZE = 65;


    getSignatureSchemeId(): number {
        return SignatureSchemeId.ED25519;
    }

    getSignatureSize(): number {
        return Ed25519SignatureScheme.SIGNATURE_SIZE
    }

    expectedSeedSize() {
        return 32;
    }
}