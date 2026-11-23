import {JwkPublicSignatureKey} from "../crypto/signature/jwk/JwkPublicSignatureKey";
import {
    assertSignatureUsage,
    JwkSignatureAlgorithm,
    resolveJwkSignatureAlgorithm,
    SignatureJwk,
    sortJwkMembers,
} from "../crypto/signature/jwk/JwkSignatureAlgorithm";
import {JwkSignatureScheme} from "../crypto/signature/jwk/JwkSignatureScheme";
import {createJwkVerifier, JwkVerifier} from "../crypto/signature/jwk/JwkSignatureBackend";
import {JwkFilter} from "../crypto/signature/jwk/JwkFilter";
import {KmsKeyReference} from "./KmsTypes";

/**
 * Public half of a KMS-managed key. It is a plain JWK public key: verification is local,
 * and the scheme is the JWK one. It remembers which KMS key it belongs to.
 */
export class KmsPublicSignatureKey extends JwkPublicSignatureKey {
    protected constructor(
        algorithm: JwkSignatureAlgorithm,
        publicJwk: SignatureJwk,
        verifier: JwkVerifier,
        scheme: JwkSignatureScheme,
        private readonly reference: KmsKeyReference,
    ) {
        super(algorithm, publicJwk, verifier, scheme);
    }

    static async fromKmsJwk(jwk: SignatureJwk, reference: KmsKeyReference): Promise<KmsPublicSignatureKey> {
        const algorithm = resolveJwkSignatureAlgorithm(jwk);
        JwkFilter.toPublicJwk(jwk, algorithm);
        const publicJwk = sortJwkMembers({...JwkFilter.stripPrivateMembers(jwk).jwk});
        assertSignatureUsage(publicJwk, "verify");
        const verifier = await createJwkVerifier(algorithm, KmsPublicSignatureKey.toBackendJwk(algorithm, publicJwk));
        return new KmsPublicSignatureKey(
            algorithm, publicJwk, verifier, JwkSignatureScheme.forJwk(algorithm, publicJwk), reference);
    }

    /** The KMS userspace and key this public key belongs to. */
    getKmsReference(): KmsKeyReference {
        return {...this.reference};
    }
}
