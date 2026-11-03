import {BasePublicSignatureKey} from "../BasePublicSignatureKey";
import {
    assertSignatureUsage,
    JwkSignatureAlgorithm,
    JwkSignatureAlgorithmName,
    resolveJwkSignatureAlgorithm,
    SignatureJwk,
    sortJwkMembers,
} from "./JwkSignatureAlgorithm";
import {JwkFilter} from "./JwkFilter";
import {JwkSignatureScheme} from "./JwkSignatureScheme";
import {createJwkVerifier, JwkVerifier} from "./JwkSignatureBackend";
import {decodeSignatureJwk, encodeSignatureJwk} from "./JwkBinaryEncoder";

/**
 * Public signature key backed by a JWK (RFC 7517).
 *
 * The key type and, where needed, the `alg` and `crv` members determine the primitive:
 * EC (ES256/ES384/ES512/ES256K), OKP (Ed25519/Ed448), RSA (RS256/RS384/RS512,
 * PS256/PS384/PS512) and AKP (ML-DSA-44/65/87) are all supported. Verification follows
 * JOSE semantics: the message is verified as-is, without the SHA-256 pre-hash the native
 * Carmentis signature keys apply.
 *
 * The class behaves identically in Node.js and in browsers. It uses the Web Crypto API
 * for the algorithms both platforms implement natively, and the `@noble/*` packages for
 * the ones they do not (secp256k1, Ed25519, ML-DSA).
 */
export class JwkPublicSignatureKey extends BasePublicSignatureKey {
    private constructor(
        private readonly algorithm: JwkSignatureAlgorithm,
        private readonly publicJwk: SignatureJwk,
        private readonly verifier: JwkVerifier,
        private readonly scheme: JwkSignatureScheme,
    ) {
        super();
    }

    /**
     * Imports a public signature key from a JWK.
     *
     * Any JWK is accepted and trusted as provided: members beyond the key itself (`kid`,
     * `x5c`, `ext`, unknown members...) are preserved, and only reordered
     * lexicographically. Use {@link JwkFilter} to reduce a JWK beforehand.
     *
     * The declared usage is checked: `use`, if present, must be `sig`, and `key_ops`, if
     * present, must contain `verify`. Both may be absent.
     *
     * A private JWK is accepted as well, but its private members are removed, and a
     * `sign` operation of its `key_ops` becomes `verify`.
     *
     * @param {SignatureJwk} jwk - The JWK to import.
     * @return {Promise<JwkPublicSignatureKey>} The imported public key.
     * @throws {Error} If the JWK is malformed, denotes an unsupported algorithm, or declares
     *                 a usage that does not allow verifying.
     */
    static async fromJwk(jwk: SignatureJwk): Promise<JwkPublicSignatureKey> {
        const algorithm = resolveJwkSignatureAlgorithm(jwk);
        // Fails when a member of the public key is missing.
        JwkFilter.toPublicJwk(jwk, algorithm);

        const {jwk: withoutPrivate, stripped} = JwkFilter.stripPrivateMembers(jwk);
        const publicJwk = sortJwkMembers({
            ...withoutPrivate,
            ...(stripped ? JwkFilter.toPublicUsage(jwk) : {}),
        });
        assertSignatureUsage(publicJwk, "verify");

        const verifier = await createJwkVerifier(algorithm, JwkPublicSignatureKey.toBackendJwk(algorithm, publicJwk));
        return new JwkPublicSignatureKey(
            algorithm,
            publicJwk,
            verifier,
            JwkSignatureScheme.forJwk(algorithm, publicJwk),
        );
    }

    /**
     * Adapts the stored JWK to what the verification backends accept: Web Crypto imports
     * the key as extractable (to expose its raw bytes), which an `ext: false` member
     * forbids, and rejects an `alg` it does not know for the key, such as `EdDSA`.
     */
    private static toBackendJwk(algorithm: JwkSignatureAlgorithm, publicJwk: SignatureJwk): SignatureJwk {
        const backendJwk: SignatureJwk = {...publicJwk};
        if (backendJwk.ext !== undefined) backendJwk.ext = true;
        if (algorithm.kty === "EC" || algorithm.kty === "OKP") delete backendJwk.alg;
        return backendJwk;
    }

    /**
     * Imports a public signature key from the bytes {@link getPublicKeyAsBytes} returns.
     *
     * @param {Uint8Array} bytes - The CBOR encoding of a public JWK.
     * @return {Promise<JwkPublicSignatureKey>} The imported public key.
     * @throws {Error} If the payload is not CBOR, or does not hold a supported JWK.
     */
    static async fromBytes(bytes: Uint8Array): Promise<JwkPublicSignatureKey> {
        return JwkPublicSignatureKey.fromJwk(decodeSignatureJwk(bytes));
    }

    /**
     * Returns the JOSE `alg` identifier of the key.
     *
     * @return {JwkSignatureAlgorithmName} The JOSE algorithm identifier.
     */
    getAlgorithm(): JwkSignatureAlgorithmName {
        return this.algorithm.alg;
    }

    /**
     * Returns the public JWK of the key, as imported, with its members ordered
     * lexicographically.
     *
     * @return {SignatureJwk} A copy of the public JWK.
     */
    getPublicJwk(): SignatureJwk {
        return {...this.publicJwk};
    }

    /**
     * Returns the binary form of the public key: the CBOR encoding of its public JWK,
     * members ordered lexicographically.
     *
     * The JWK is serialised rather than the bare key material because the material alone
     * does not say which primitive it belongs to — `x` is a 32-byte string for both an
     * Ed25519 and a P-256 key. Encoding the JWK keeps the bytes self-describing, and
     * keeps them round-trippable through {@link fromBytes}.
     *
     * @return {Promise<Uint8Array>} The CBOR-encoded public JWK.
     */
    async getPublicKeyAsBytes(): Promise<Uint8Array> {
        return encodeSignatureJwk(this.publicJwk);
    }

    /**
     * Returns the bare public key material, outside of any JWK framing.
     *
     * The encoding depends on the key type: the uncompressed point for `EC`, the
     * public key itself for `OKP` and `AKP`, and the SPKI (RFC 5280
     * `SubjectPublicKeyInfo`) DER encoding for `RSA`, which has no shorter raw form.
     *
     * Unlike {@link getPublicKeyAsBytes}, these bytes carry no indication of the
     * algorithm they belong to, so they cannot be imported back on their own.
     *
     * @return {Uint8Array} The raw public key.
     */
    getRawPublicKeyBytes(): Uint8Array {
        return this.verifier.publicKeyBytes;
    }

    /**
     * Returns the signature scheme of the key.
     *
     * @return {JwkSignatureScheme} The signature scheme.
     */
    getScheme(): JwkSignatureScheme {
        return this.scheme;
    }

    /**
     * Verifies a detached signature over `data`.
     *
     * @param {Uint8Array} data - The signed message, verified as-is.
     * @param {Uint8Array} signature - The detached signature.
     * @return {Promise<boolean>} Whether the signature is valid.
     */
    async verify(data: Uint8Array, signature: Uint8Array): Promise<boolean> {
        try {
            return await this.verifier.verify(data, signature);
        } catch {
            // A malformed signature makes some backends throw where others return false.
            return false;
        }
    }
}
