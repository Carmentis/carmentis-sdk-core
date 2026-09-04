import {BasePrivateSignatureKey} from "../BasePrivateSignatureKey";
import {
    extractPrivateJwk,
    extractPublicJwk,
    JwkSignatureAlgorithm,
    JwkSignatureAlgorithmName,
    resolveJwkSignatureAlgorithm,
    SignatureJwk,
} from "./JwkSignatureAlgorithm";
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
     * Any JWK is accepted, whatever it carries beyond the key itself. Only the members
     * that model the key are retained; see {@link extractPrivateJwk} for what that means
     * and for the list of what is dropped.
     *
     * @param {SignatureJwk} jwk - The private JWK to import.
     * @return {Promise<JwkPrivateSignatureKey>} The imported private key.
     * @throws {Error} If the JWK is malformed, carries no private material, or denotes an
     *                 unsupported algorithm.
     */
    static async fromJwk(jwk: SignatureJwk): Promise<JwkPrivateSignatureKey> {
        const algorithm = resolveJwkSignatureAlgorithm(jwk);
        const privateJwk = extractPrivateJwk(jwk, algorithm);
        const publicJwk = extractPublicJwk(jwk, algorithm);
        const signer = await createJwkSigner(algorithm, privateJwk);
        return new JwkPrivateSignatureKey(
            algorithm,
            privateJwk,
            publicJwk,
            signer,
            JwkSignatureScheme.forJwk(algorithm, publicJwk),
        );
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
     * Returns the canonical private JWK of the key.
     *
     * The JWK holds the members that model the key and nothing else, ordered
     * lexicographically, so that two keys imported from different JWKs of the same
     * cryptographic key expose the exact same JWK here.
     *
     * @return {SignatureJwk} A copy of the canonical private JWK.
     */
    getPrivateJwk(): SignatureJwk {
        return {...this.privateJwk};
    }

    /**
     * Returns the canonical public JWK of the key, stripped of every private component.
     *
     * @return {SignatureJwk} A copy of the canonical public JWK.
     */
    getPublicJwk(): SignatureJwk {
        return {...this.publicJwk};
    }

    /**
     * Returns the binary form of the private key: the CBOR encoding of its canonical
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
