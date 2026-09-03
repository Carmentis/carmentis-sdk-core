/**
 * JWK (RFC 7517) signature algorithm resolution and canonicalisation.
 *
 * A JWK does not carry an explicit description of the primitive to use: it has to be
 * derived from the `kty` member, completed by `crv` for elliptic-curve families and by
 * `alg` for RSA and ML-DSA. This module centralises that derivation so that
 * {@link JwkPrivateSignatureKey} and {@link JwkPublicSignatureKey} agree on it.
 *
 * It also reduces an incoming JWK to its canonical form: the lexicographically ordered
 * set of members that are strictly necessary to model the key. Any other member is
 * accepted on import and then dropped, so that two JWKs describing the same key always
 * produce the same canonical form and, in turn, the same serialised bytes.
 */

/**
 * Key types that can carry a signature key.
 *
 * - `EC`  : elliptic curve, RFC 7518 (ES256/ES384/ES512) and RFC 8812 (ES256K).
 * - `OKP` : octet key pair, RFC 8037 (Ed25519, Ed448).
 * - `RSA` : RFC 7518 (RS256/RS384/RS512, PS256/PS384/PS512).
 * - `AKP` : algorithm key pair, RFC 9836 (ML-DSA-44/65/87).
 */
export type JwkSignatureKeyType = "EC" | "OKP" | "RSA" | "AKP";

/** JOSE `alg` identifiers supported by the JWK signature keys. */
export type JwkSignatureAlgorithmName =
    | "ES256" | "ES384" | "ES512" | "ES256K"
    | "Ed25519" | "Ed448"
    | "RS256" | "RS384" | "RS512"
    | "PS256" | "PS384" | "PS512"
    | "ML-DSA-44" | "ML-DSA-65" | "ML-DSA-87";

/**
 * Implementation actually performing sign/verify for a given algorithm.
 *
 * `webcrypto` is used for everything every browser and every supported Node.js version
 * implements natively. The remaining algorithms are delegated to the `@noble/*` packages
 * already bundled with the SDK, because their Web Crypto counterparts are either absent
 * (secp256k1) or still experimental and unavailable in browsers (ML-DSA).
 */
export type JwkSignatureBackend = "webcrypto" | "ed25519" | "secp256k1" | "ml-dsa";

/**
 * A JWK that may hold signature key material.
 *
 * Extends the DOM `JsonWebKey` with the AKP members of RFC 9836, which the standard
 * library type does not know about, and with the certificate members of RFC 7517.
 *
 * The members beyond the key material itself are declared for the sake of the JWKs
 * handed to {@link extractPublicJwk} and {@link extractPrivateJwk}, which tolerate them
 * on input; none of them survives into the canonical form those functions return.
 */
export interface SignatureJwk extends JsonWebKey {
    /** Key identifier (RFC 7517 §4.5). */
    kid?: string;
    /** AKP public key, base64url-encoded (RFC 9836). */
    pub?: string;
    /** AKP private key seed, base64url-encoded (RFC 9836). */
    priv?: string;

    /** Certificate usage (RFC 7517 §4.6). */
    x5u?: string;

    /** Certificate chain (RFC 7517 §4.7). */
    x5c?: string[];

    /** Certificate SHA-1 Thumbprint (RFC 7517 §4.8). */
    x5t?: string;

    /** Certificate SHA-256 Thumbprint (RFC 7517 §4.9). */
    "x5t#S256"?: string;
}

/**
 * Fully resolved description of the signature primitive denoted by a JWK.
 */
export interface JwkSignatureAlgorithm {
    /** Canonical JOSE `alg` identifier. */
    readonly alg: JwkSignatureAlgorithmName;
    /** Key type the algorithm applies to. */
    readonly kty: JwkSignatureKeyType;
    /** Curve name, for `EC` and `OKP` keys only. */
    readonly crv?: string;
    /** Implementation performing sign/verify. */
    readonly backend: JwkSignatureBackend;
    /** Parameters for `SubtleCrypto.importKey`; only set when `backend` is `webcrypto`. */
    readonly keyAlgorithm?: EcKeyImportParams | RsaHashedImportParams | Algorithm;
    /** Parameters for `SubtleCrypto.sign`/`verify`; only set when `backend` is `webcrypto`. */
    readonly signAlgorithm?: EcdsaParams | RsaPssParams | Algorithm;
    /**
     * Size in bytes of the private scalar or seed the key is built from,
     * or `undefined` for algorithms that have none (RSA).
     */
    readonly seedSize?: number;
    /**
     * Size in bytes of a detached signature, or `undefined` when it depends on the
     * key size rather than on the algorithm (RSA, where it equals the modulus size).
     */
    readonly signatureSize?: number;
}

/** Signing curves of the `EC` key type, with their JOSE algorithm, field size and digest. */
const EC_CURVES: Record<string, { alg: JwkSignatureAlgorithmName; fieldSize: number; hash: string }> = {
    "P-256": {alg: "ES256", fieldSize: 32, hash: "SHA-256"},
    "P-384": {alg: "ES384", fieldSize: 48, hash: "SHA-384"},
    "P-521": {alg: "ES512", fieldSize: 66, hash: "SHA-512"},
    "secp256k1": {alg: "ES256K", fieldSize: 32, hash: "SHA-256"},
};

/** Signing curves of the `OKP` key type, with their seed and signature sizes. */
const OKP_CURVES: Record<string, { alg: JwkSignatureAlgorithmName; seedSize: number; signatureSize: number }> = {
    "Ed25519": {alg: "Ed25519", seedSize: 32, signatureSize: 64},
    "Ed448": {alg: "Ed448", seedSize: 57, signatureSize: 114},
};

/** Signature sizes of the ML-DSA parameter sets, in bytes (FIPS 204). */
const ML_DSA_SIGNATURE_SIZES: Record<string, number> = {
    "ML-DSA-44": 2420,
    "ML-DSA-65": 3309,
    "ML-DSA-87": 4627,
};

/** JWK members carrying public key material, per key type. */
const PUBLIC_MEMBERS: Record<JwkSignatureKeyType, readonly string[]> = {
    EC: ["crv", "x", "y"],
    OKP: ["crv", "x"],
    RSA: ["n", "e"],
    AKP: ["pub"],
};

/**
 * JWK members carrying private key material, per key type.
 *
 * The RSA list keeps the CRT parameters even though `n`, `e` and `d` already determine
 * the key: `SubtleCrypto.importKey` rejects a private RSA JWK that omits them, and `oth`
 * is the only record that a key is multi-prime.
 */
const PRIVATE_MEMBERS: Record<JwkSignatureKeyType, readonly string[]> = {
    EC: ["d"],
    OKP: ["d"],
    RSA: ["d", "p", "q", "dp", "dq", "qi", "oth"],
    AKP: ["priv"],
};

/** Members of {@link PRIVATE_MEMBERS} without which the key cannot sign. */
const REQUIRED_PRIVATE_MEMBERS: Record<JwkSignatureKeyType, readonly string[]> = {
    EC: ["d"],
    OKP: ["d"],
    RSA: ["d"],
    AKP: ["priv"],
};

/**
 * Key types whose canonical form keeps the `alg` member.
 *
 * `alg` is only retained where the key material does not already imply the primitive.
 * An `RSA` key needs it to tell RS* from PS* and to pick the digest, and an `AKP` key
 * needs it to name the ML-DSA parameter set. `EC` and `OKP` keys do not: RFC 7518 and
 * RFC 8037 bind exactly one algorithm to each signing curve, so `crv` says everything
 * `alg` would, and keeping it would only add a second spelling of the same fact — one
 * that `EdDSA` versus `Ed25519` shows is not even unique.
 */
const ALG_DEPENDENT_KEY_TYPES: ReadonlySet<JwkSignatureKeyType> = new Set(["RSA", "AKP"]);

/**
 * Resolves the signature primitive denoted by a JWK.
 *
 * Only the members that define the primitive are looked at. The ones that merely
 * describe the key handle the JWK came from — `use`, `key_ops` and `ext` — are ignored,
 * including when they contradict a signing usage: this class hierarchy is the caller's
 * statement of intent, and a JWK is accepted whatever its declared usage.
 *
 * @param {SignatureJwk} jwk - The JWK to inspect. It may be either a public or a private key.
 * @return {JwkSignatureAlgorithm} The resolved algorithm description.
 * @throws {Error} If the JWK is malformed, is not a signature key, or uses an unsupported algorithm.
 */
export function resolveJwkSignatureAlgorithm(jwk: SignatureJwk): JwkSignatureAlgorithm {
    if (!jwk || typeof jwk !== "object") throw new Error("Cannot import JWK: not an object");
    if (!jwk.kty) throw new Error("Cannot import JWK: missing 'kty' member");

    switch (jwk.kty) {
        case "EC":
            return resolveEcAlgorithm(jwk);
        case "OKP":
            return resolveOkpAlgorithm(jwk);
        case "RSA":
            return resolveRsaAlgorithm(jwk);
        case "AKP":
            return resolveAkpAlgorithm(jwk);
        case "oct":
            throw new Error(
                "Cannot import JWK: 'oct' keys are symmetric (HMAC) and have no public counterpart, " +
                "which the private/public signature key pair requires",
            );
        default:
            throw new Error(`Cannot import JWK: unsupported key type '${jwk.kty}'`);
    }
}

/**
 * Resolves an `EC` JWK (RFC 7518 ES256/ES384/ES512, RFC 8812 ES256K).
 *
 * @param {SignatureJwk} jwk - The elliptic-curve JWK.
 * @return {JwkSignatureAlgorithm} The resolved algorithm description.
 */
function resolveEcAlgorithm(jwk: SignatureJwk): JwkSignatureAlgorithm {
    if (!jwk.crv) throw new Error("Cannot import EC JWK: missing 'crv' member");
    const curve = EC_CURVES[jwk.crv];
    if (!curve) {
        throw new Error(
            `Cannot import EC JWK: unsupported curve '${jwk.crv}', expected one of ${Object.keys(EC_CURVES).join(", ")}`,
        );
    }
    assertDeclaredAlgorithm(jwk, [curve.alg]);

    // secp256k1 is not part of the Web Crypto curve registry, so it is delegated to @noble.
    if (jwk.crv === "secp256k1") {
        return {
            alg: curve.alg,
            kty: "EC",
            crv: jwk.crv,
            backend: "secp256k1",
            seedSize: curve.fieldSize,
            signatureSize: 2 * curve.fieldSize,
        };
    }

    return {
        alg: curve.alg,
        kty: "EC",
        crv: jwk.crv,
        backend: "webcrypto",
        keyAlgorithm: {name: "ECDSA", namedCurve: jwk.crv},
        signAlgorithm: {name: "ECDSA", hash: curve.hash},
        seedSize: curve.fieldSize,
        // JOSE ECDSA signatures are the raw R||S concatenation, not a DER structure.
        signatureSize: 2 * curve.fieldSize,
    };
}

/**
 * Resolves an `OKP` JWK (RFC 8037 Ed25519/Ed448).
 *
 * @param {SignatureJwk} jwk - The octet key pair JWK.
 * @return {JwkSignatureAlgorithm} The resolved algorithm description.
 */
function resolveOkpAlgorithm(jwk: SignatureJwk): JwkSignatureAlgorithm {
    if (!jwk.crv) throw new Error("Cannot import OKP JWK: missing 'crv' member");
    const curve = OKP_CURVES[jwk.crv];
    if (!curve) {
        throw new Error(
            `Cannot import OKP JWK: curve '${jwk.crv}' cannot sign, expected one of ${Object.keys(OKP_CURVES).join(", ")}`,
        );
    }
    // "EdDSA" is the RFC 8037 name shared by both curves; RFC 9861 introduced the curve-specific ones.
    assertDeclaredAlgorithm(jwk, [curve.alg, "EdDSA"]);

    // Ed25519 goes through @noble: Web Crypto only gained it in very recent browser versions.
    if (jwk.crv === "Ed25519") {
        return {
            alg: curve.alg,
            kty: "OKP",
            crv: jwk.crv,
            backend: "ed25519",
            seedSize: curve.seedSize,
            signatureSize: curve.signatureSize,
        };
    }

    return {
        alg: curve.alg,
        kty: "OKP",
        crv: jwk.crv,
        backend: "webcrypto",
        keyAlgorithm: {name: jwk.crv},
        signAlgorithm: {name: jwk.crv},
        seedSize: curve.seedSize,
        signatureSize: curve.signatureSize,
    };
}

/**
 * Resolves an `RSA` JWK (RFC 7518 RS256/RS384/RS512 and PS256/PS384/PS512).
 *
 * `alg` is optional in a JWK; when absent, RS256 is assumed, as it is the algorithm
 * RFC 7518 defines as mandatory-to-implement for RSA keys.
 *
 * @param {SignatureJwk} jwk - The RSA JWK.
 * @return {JwkSignatureAlgorithm} The resolved algorithm description.
 */
function resolveRsaAlgorithm(jwk: SignatureJwk): JwkSignatureAlgorithm {
    const alg = jwk.alg ?? "RS256";
    const parsed = /^(RS|PS)(256|384|512)$/.exec(alg);
    if (!parsed) {
        throw new Error(
            `Cannot import RSA JWK: unsupported algorithm '${alg}', expected RS256, RS384, RS512, PS256, PS384 or PS512`,
        );
    }

    const [, family, digest] = parsed;
    const hash = `SHA-${digest}`;
    const name = family === "PS" ? "RSA-PSS" : "RSASSA-PKCS1-v1_5";

    return {
        alg: alg as JwkSignatureAlgorithmName,
        kty: "RSA",
        backend: "webcrypto",
        keyAlgorithm: {name, hash},
        // RFC 7518 §3.5 mandates a PSS salt as long as the digest output.
        signAlgorithm: name === "RSA-PSS" ? {name, saltLength: Number(digest) / 8} : {name},
        // No seed: an RSA key is a pair of primes, not a scalar derived from a seed.
        seedSize: undefined,
        // The signature is as long as the modulus, which is a property of the key, not of the algorithm.
        signatureSize: undefined,
    };
}

/**
 * Resolves an `AKP` JWK (RFC 9836 ML-DSA-44/65/87).
 *
 * @param {SignatureJwk} jwk - The algorithm key pair JWK.
 * @return {JwkSignatureAlgorithm} The resolved algorithm description.
 */
function resolveAkpAlgorithm(jwk: SignatureJwk): JwkSignatureAlgorithm {
    if (!jwk.alg) throw new Error("Cannot import AKP JWK: missing 'alg' member");
    const signatureSize = ML_DSA_SIGNATURE_SIZES[jwk.alg];
    if (signatureSize === undefined) {
        throw new Error(
            `Cannot import AKP JWK: unsupported algorithm '${jwk.alg}', ` +
            `expected one of ${Object.keys(ML_DSA_SIGNATURE_SIZES).join(", ")}`,
        );
    }

    return {
        alg: jwk.alg as JwkSignatureAlgorithmName,
        kty: "AKP",
        backend: "ml-dsa",
        seedSize: 32,
        signatureSize,
    };
}

/** Minimal JWKs identifying each supported algorithm, used to resolve one by name. */
const ALGORITHM_TEMPLATES: Record<JwkSignatureAlgorithmName, SignatureJwk> = {
    "ES256": {kty: "EC", crv: "P-256"},
    "ES384": {kty: "EC", crv: "P-384"},
    "ES512": {kty: "EC", crv: "P-521"},
    "ES256K": {kty: "EC", crv: "secp256k1"},
    "Ed25519": {kty: "OKP", crv: "Ed25519"},
    "Ed448": {kty: "OKP", crv: "Ed448"},
    "RS256": {kty: "RSA", alg: "RS256"},
    "RS384": {kty: "RSA", alg: "RS384"},
    "RS512": {kty: "RSA", alg: "RS512"},
    "PS256": {kty: "RSA", alg: "PS256"},
    "PS384": {kty: "RSA", alg: "PS384"},
    "PS512": {kty: "RSA", alg: "PS512"},
    "ML-DSA-44": {kty: "AKP", alg: "ML-DSA-44"},
    "ML-DSA-65": {kty: "AKP", alg: "ML-DSA-65"},
    "ML-DSA-87": {kty: "AKP", alg: "ML-DSA-87"},
};

/**
 * Resolves a signature primitive from its JOSE `alg` identifier, without a key.
 *
 * @param {JwkSignatureAlgorithmName} alg - The JOSE algorithm identifier.
 * @return {JwkSignatureAlgorithm} The resolved algorithm description.
 * @throws {Error} If the algorithm is not supported.
 */
export function resolveJwkSignatureAlgorithmByName(alg: JwkSignatureAlgorithmName): JwkSignatureAlgorithm {
    const template = ALGORITHM_TEMPLATES[alg];
    if (!template) {
        throw new Error(
            `Unsupported JOSE signature algorithm '${alg}', ` +
            `expected one of ${Object.keys(ALGORITHM_TEMPLATES).join(", ")}`,
        );
    }
    return resolveJwkSignatureAlgorithm(template);
}

/**
 * Fails when the JWK declares an `alg` that contradicts the one implied by its other members.
 *
 * @param {SignatureJwk} jwk - The JWK to check.
 * @param {string[]} accepted - The `alg` values compatible with the resolved algorithm.
 */
function assertDeclaredAlgorithm(jwk: SignatureJwk, accepted: readonly string[]): void {
    if (jwk.alg !== undefined && !accepted.includes(jwk.alg)) {
        throw new Error(
            `Cannot import JWK: declared algorithm '${jwk.alg}' is incompatible with curve '${jwk.crv}', ` +
            `expected ${accepted.join(" or ")}`,
        );
    }
}

/**
 * Reduces a JWK to the canonical public form of the key it holds.
 *
 * The result carries `kty`, the public members of that key type, and `alg` only where
 * {@link ALG_DEPENDENT_KEY_TYPES} says the key material does not already imply the
 * primitive. Everything else the JWK may have arrived with is dropped: the private
 * members, and the members that describe the JWK rather than the key — `use`, `key_ops`,
 * `ext`, `kid`, `x5u`, `x5c`, `x5t`, `x5t#S256` and anything unrecognised.
 *
 * The extraction works on an allow-list rather than by deleting known private members,
 * so that a private RSA JWK cannot leak `p`, `q`, `dp`, `dq`, `qi` or `oth` into the
 * public key, and so that a member added by a future JWK revision cannot slip through.
 *
 * @param {SignatureJwk} jwk - The JWK to derive the public key from.
 * @param {JwkSignatureAlgorithm} algorithm - The algorithm resolved from that JWK.
 * @return {SignatureJwk} The canonical public JWK, with its members ordered.
 * @throws {Error} If a public member required by the key type is missing.
 */
export function extractPublicJwk(jwk: SignatureJwk, algorithm: JwkSignatureAlgorithm): SignatureJwk {
    const members: Record<string, unknown> = {kty: algorithm.kty};
    if (ALG_DEPENDENT_KEY_TYPES.has(algorithm.kty)) members.alg = algorithm.alg;

    for (const member of PUBLIC_MEMBERS[algorithm.kty]) {
        const value = (jwk as Record<string, unknown>)[member];
        if (value === undefined) {
            throw new Error(`Cannot import ${algorithm.kty} JWK: missing public member '${member}'`);
        }
        members[member] = value;
    }
    return sortJwkMembers(members);
}

/**
 * Reduces a JWK to the canonical private form of the key it holds.
 *
 * The result is {@link extractPublicJwk} completed by the private members of the key
 * type; the same members are dropped, on the same allow-list basis.
 *
 * @param {SignatureJwk} jwk - The private JWK.
 * @param {JwkSignatureAlgorithm} algorithm - The algorithm resolved from that JWK.
 * @return {SignatureJwk} The canonical private JWK, with its members ordered.
 * @throws {Error} If a member required to sign is missing.
 */
export function extractPrivateJwk(jwk: SignatureJwk, algorithm: JwkSignatureAlgorithm): SignatureJwk {
    for (const member of REQUIRED_PRIVATE_MEMBERS[algorithm.kty]) {
        if ((jwk as Record<string, unknown>)[member] === undefined) {
            throw new Error(
                `Cannot import ${algorithm.kty} JWK as a private key: missing member '${member}'`,
            );
        }
    }

    const members: Record<string, unknown> = {...extractPublicJwk(jwk, algorithm)};
    for (const member of PRIVATE_MEMBERS[algorithm.kty]) {
        const value = (jwk as Record<string, unknown>)[member];
        if (value !== undefined) members[member] = value;
    }
    return sortJwkMembers(members);
}

/**
 * Returns a copy of a JWK whose members are ordered lexicographically.
 *
 * Both JSON and CBOR serialise object members in insertion order, so ordering them is
 * what turns the canonical form into a canonical byte string: two JWKs holding the same
 * members serialise identically no matter which order they were written in.
 *
 * @param {SignatureJwk | Record<string, unknown>} jwk - The JWK to order.
 * @return {SignatureJwk} A copy of the JWK, with its members in lexicographic order.
 */
export function sortJwkMembers(jwk: SignatureJwk | Record<string, unknown>): SignatureJwk {
    const sorted: Record<string, unknown> = {};
    for (const member of Object.keys(jwk).sort()) {
        sorted[member] = (jwk as Record<string, unknown>)[member];
    }
    return sorted as SignatureJwk;
}

/**
 * Reads a mandatory string member of a JWK.
 *
 * @param {SignatureJwk} jwk - The JWK to read from.
 * @param {string} member - Name of the member.
 * @return {string} The member value.
 * @throws {Error} If the member is missing or is not a string.
 */
export function requireJwkMember(jwk: SignatureJwk, member: string): string {
    const value = (jwk as Record<string, unknown>)[member];
    if (typeof value !== "string") throw new Error(`Malformed JWK: missing or invalid member '${member}'`);
    return value;
}
