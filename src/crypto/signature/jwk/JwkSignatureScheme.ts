import {base64url} from "jose";
import {SignatureScheme} from "../SignatureScheme";
import {SignatureSchemeId} from "../SignatureSchemeId";
import {
    JwkSignatureAlgorithm,
    JwkSignatureAlgorithmName,
    requireJwkMember,
    SignatureJwk,
} from "./JwkSignatureAlgorithm";

/**
 * JOSE algorithms that are bit-for-bit interchangeable with a Carmentis signature scheme.
 *
 * The mapping is intentionally narrow. ML-DSA-65 qualifies because the JOSE and the
 * Carmentis flavours both sign the raw message and both expose the raw FIPS 204 public
 * key. The other algorithms do not:
 *
 * - `Ed25519` — {@link SignatureSchemeId.ED25519} signs `SHA-256(message)`, while JOSE
 *   EdDSA signs the message itself, so signatures do not cross-verify.
 * - `ES256K` — {@link SignatureSchemeId.SECP256K1} exposes a 33-byte compressed public
 *   key, while an EC JWK describes the 65-byte uncompressed point.
 * - `ES*`, `RS*`, `PS*` — no corresponding Carmentis scheme exists.
 */
const SIGNATURE_SCHEME_IDS: Partial<Record<JwkSignatureAlgorithmName, SignatureSchemeId>> = {
    "ML-DSA-65": SignatureSchemeId.ML_DSA_65,
};

/**
 * {@link SignatureScheme} describing the primitive denoted by a JWK.
 *
 * The instance is bound to a specific key because RSA signature sizes depend on the
 * modulus rather than on the algorithm alone.
 */
export class JwkSignatureScheme implements SignatureScheme {
    /**
     * Builds the scheme of a given key.
     *
     * @param {JwkSignatureAlgorithm} algorithm - The algorithm resolved from the JWK.
     * @param {SignatureJwk} jwk - The JWK the scheme describes; must expose its public members.
     * @return {JwkSignatureScheme} The signature scheme of that key.
     */
    static forJwk(algorithm: JwkSignatureAlgorithm, jwk: SignatureJwk): JwkSignatureScheme {
        // Only RSA leaves the signature size undefined: it equals the modulus size.
        const signatureSize = algorithm.signatureSize ?? base64url.decode(requireJwkMember(jwk, "n")).length;
        return new JwkSignatureScheme(algorithm, signatureSize);
    }

    constructor(
        private readonly algorithm: JwkSignatureAlgorithm,
        private readonly signatureSize: number,
    ) {
    }

    /**
     * Returns the full description of the resolved signature primitive.
     *
     * @return {JwkSignatureAlgorithm} The algorithm description.
     */
    getAlgorithm(): JwkSignatureAlgorithm {
        return this.algorithm;
    }

    /**
     * Returns the JOSE `alg` identifier of the scheme.
     *
     * @return {JwkSignatureAlgorithmName} The JOSE algorithm identifier.
     */
    getAlgorithmName(): JwkSignatureAlgorithmName {
        return this.algorithm.alg;
    }

    /**
     * Returns the Carmentis identifier of the scheme.
     *
     * Most JOSE algorithms have no Carmentis counterpart, and those that look like one
     * are not always compatible with it; see {@link SIGNATURE_SCHEME_IDS}. Such keys can
     * still sign and verify — they simply cannot be used where a scheme identifier has
     * to be recorded, such as on-chain signatures.
     *
     * @return {SignatureSchemeId} The Carmentis signature scheme identifier.
     * @throws {Error} If the algorithm has no equivalent Carmentis scheme.
     */
    getSignatureSchemeId(): SignatureSchemeId {
        return SignatureSchemeId.JWK;
        /*
        const schemeId = SIGNATURE_SCHEME_IDS[this.algorithm.alg];
        if (schemeId === undefined) {
            throw new Error(
                `The JOSE algorithm '${this.algorithm.alg}' has no equivalent Carmentis signature scheme; ` +
                "this key can sign and verify but cannot be used where a scheme identifier is required",
            );
        }
        return schemeId;

         */
    }

    /**
     * Returns the size in bytes of a detached signature produced by this key.
     *
     * @return {number} The signature size in bytes.
     */
    getSignatureSize(): number {
        return this.signatureSize;
    }

    /**
     * Returns the size in bytes of the seed the key is derived from.
     *
     * @return {number} The seed size in bytes.
     * @throws {Error} If the algorithm is not seed-based, which is the case of RSA.
     */
    expectedSeedSize(): number {
        if (this.algorithm.seedSize === undefined) {
            throw new Error(`${this.algorithm.alg} keys are not derived from a seed`);
        }
        return this.algorithm.seedSize;
    }
}
