import {SignatureScheme} from "../SignatureScheme";
import {SignatureSchemeId} from "../SignatureSchemeId";

/**
 * The `Secp256k1SignatureScheme` class implements the `SignatureScheme` interface and provides
 * functionality specific to the Secp256k1 elliptic curve cryptographic signature scheme.
 */
export class Secp256k1SignatureScheme implements SignatureScheme {
    private static SIGNATURE_SIZE = 65;


    getSignatureSchemeId(): number {
        return SignatureSchemeId.SECP256K1;
    }

    getSignatureSize(): number {
        return Secp256k1SignatureScheme.SIGNATURE_SIZE
    }

    expectedSeedSize() {
        return 32;
    }
}