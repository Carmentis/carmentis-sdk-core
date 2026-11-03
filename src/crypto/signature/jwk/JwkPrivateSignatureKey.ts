import {BasePrivateSignatureKey} from "../BasePrivateSignatureKey";
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
import {createJwkSigner, generateSignatureJwk, JwkGenerationOptions, JwkSigner} from "./JwkSignatureBackend";
import {JwkPublicSignatureKey} from "./JwkPublicSignatureKey";
import {decodeSignatureJwk, encodeSignatureJwk} from "./JwkBinaryEncoder";

/**
 * Private signature key backed by a JWK (RFC 7517).
 *
 * The key type and, where needed, the `alg` and `crv` members determine the primitive:
 * EC (ES256/ES384/ES512/ES256K), OKP (Ed25519/Ed448), RSA (RS256/RS384/RS512,
 * PS256/PS384/PS512) and AKP (ML-DSA-44/65/87) are all supported. Signing follows JOSE
 * semantics: the message is signed as-is, without the SHA-256 pre-hash the native
 * Carmentis signature keys apply, so the signatures interoperate with any JOSE library.
 *
 * The class behaves identically in Node.js and in browsers. It uses the Web Crypto API
 * for the algorithms both platforms implement natively, and the `@noble/*` packages for
 * the ones they do not (secp256k1, Ed25519, ML-DSA).
 */
export class JwkPrivateSignatureKey extends BasePrivateSignatureKey {
    private constructor(
        private readonly algorithm: JwkSignatureAlgorithm,
        private readonly privateJwk: SignatureJwk,
        private readonly publicJwk: SignatureJwk,
        private readonly signer: JwkSigner,
        private readonly scheme: JwkSignatureScheme,
    ) {
        super();
    }

    /**
     * Generates a fresh key pair and wraps its private half.
     *
     * @param {JwkSignatureAlgorithmName} alg - The JOSE algorithm to generate a key for.
     * @param {JwkGenerationOptions} options - Algorithm-specific options, such as the RSA modulus size.
     * @return {Promise<JwkPrivateSignatureKey>} The generated private key.
     */
    static async gen(
        alg: JwkSignatureAlgorithmName = "Ed25519",
        options: JwkGenerationOptions = {},
    ): Promise<JwkPrivateSignatureKey> {
        return JwkPrivateSignatureKey.fromJwk(await generateSignatureJwk(alg, options));
    }

    /**
     * Imports a private signature key from a JWK.
     *
     * Any JWK is accepted and trusted as provided: members beyond the key itself (`kid`,
     * `x5c`, `ext`, unknown members...) are preserved, and only reordered
     * lexicographically. Use {@link JwkFilter} to reduce a JWK beforehand.
     *
     * The declared usage is checked: `use`, if present, must be `sig`, and `key_ops`, if
     * present, must contain `sign`. Both may be absent.
     *
     * The public half is the same JWK, deprived of its private members only, with `sign`
     * replaced by `verify` in `key_ops`; no usage is added when none is declared.
     *
     * @param {SignatureJwk} jwk - The private JWK to import.
     * @return {Promise<JwkPrivateSignatureKey>} The imported private key.
     * @throws {Error} If the JWK is malformed, carries no private material, denotes an
     *                 unsupported algorithm, or declares a usage that does not allow signing.
     */
    static async fromJwk(jwk: SignatureJwk): Promise<JwkPrivateSignatureKey> {
        const algorithm = resolveJwkSignatureAlgorithm(jwk);
        // Fails when a public or private member of the key is missing.
        JwkFilter.toPrivateJwk(jwk, algorithm);

        const privateJwk = sortJwkMembers({...jwk});
        assertSignatureUsage(privateJwk, "sign");
        const publicJwk = sortJwkMembers({
            ...JwkFilter.stripPrivateMembers(jwk).jwk,
            ...JwkFilter.toPublicUsage(jwk),
        });
        const signer = await createJwkSigner(algorithm, JwkPrivateSignatureKey.toBackendJwk(algorithm, privateJwk));
        return new JwkPrivateSignatureKey(
            algorithm,
            privateJwk,
            publicJwk,
            signer,
            JwkSignatureScheme.forJwk(algorithm, publicJwk),
        );
    }

    /**
     * Adapts the stored JWK to what the signing backends accept: Web Crypto imports the
     * key as extractable (to expose its raw bytes), which an `ext: false` member forbids,
     * and rejects an `alg` it does not know for the key, such as `EdDSA`.
     */
    private static toBackendJwk(algorithm: JwkSignatureAlgorithm, privateJwk: SignatureJwk): SignatureJwk {
        const backendJwk: SignatureJwk = {...privateJwk};
        if (backendJwk.ext !== undefined) backendJwk.ext = true;
        if (algorithm.kty === "EC" || algorithm.kty === "OKP") delete backendJwk.alg;
        return backendJwk;
    }

    /**
     * Imports a private signature key from the bytes {@link getPrivateKeyAsBytes} returns.
     *
     * @param {Uint8Array} bytes - The CBOR encoding of a private JWK.
     * @return {Promise<JwkPrivateSignatureKey>} The imported private key.
     * @throws {Error} If the payload is not CBOR, or does not hold a supported private JWK.
     */
    static async fromBytes(bytes: Uint8Array): Promise<JwkPrivateSignatureKey> {
        return JwkPrivateSignatureKey.fromJwk(decodeSignatureJwk(bytes));
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
     * Returns the private JWK of the key, as imported, with its members ordered
     * lexicographically.
     *
     * @return {SignatureJwk} A copy of the private JWK.
     */
    getPrivateJwk(): SignatureJwk {
        return {...this.privateJwk};
    }

    /**
     * Returns the public JWK of the key: the private JWK deprived of its private members
     * only, every other member being preserved.
     *
     * @return {SignatureJwk} A copy of the public JWK.
     */
    getPublicJwk(): SignatureJwk {
        return {...this.publicJwk};
    }

    /**
     * Returns the binary form of the private key: the CBOR encoding of its
     * private JWK, members ordered lexicographically.
     *
     * The JWK is serialised rather than the bare key material because the material alone
     * does not say which primitive it belongs to, and because an RSA private key is a set
     * of integers that no single scalar stands for. Encoding the JWK keeps the bytes
     * self-describing, and keeps them round-trippable through {@link fromBytes}.
     *
     * @return {Uint8Array} The CBOR-encoded private JWK.
     */
    getPrivateKeyAsBytes(): Uint8Array {
        return encodeSignatureJwk(this.privateJwk);
    }

    /**
     * Returns the bare private key material, outside of any JWK framing.
     *
     * The encoding depends on the key type: the private scalar `d` for `EC` and `OKP`,
     * the `priv` seed for `AKP`, and the PKCS#8 (RFC 5208 `PrivateKeyInfo`) DER encoding
     * for `RSA`, whose private key is a set of integers rather than a single scalar.
     *
     * Unlike {@link getPrivateKeyAsBytes}, these bytes carry no indication of the
     * algorithm they belong to, so they cannot be imported back on their own.
     *
     * @return {Uint8Array} The raw private key.
     */
    getRawPrivateKeyBytes(): Uint8Array {
        return this.signer.privateKeyBytes;
    }

    /**
     * Returns the public half of the key pair.
     *
     * @return {Promise<JwkPublicSignatureKey>} The matching public key.
     */
    async getPublicKey(): Promise<JwkPublicSignatureKey> {
        return JwkPublicSignatureKey.fromJwk(this.publicJwk);
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
     * Produces a detached signature over `data`.
     *
     * @param {Uint8Array} data - The message to sign, signed as-is.
     * @return {Promise<Uint8Array>} The detached signature.
     */
    async sign(data: Uint8Array): Promise<Uint8Array> {
        return this.signer.sign(data);
    }
}
