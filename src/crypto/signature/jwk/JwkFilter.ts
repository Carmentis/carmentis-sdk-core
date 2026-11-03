import {
    JwkSignatureAlgorithm,
    JwkSignatureKeyType,
    SignatureJwk,
    sortJwkMembers,
} from "./JwkSignatureAlgorithm";

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

/** Every member that carries private key material, whatever the key type. */
const ALL_PRIVATE_MEMBERS: readonly string[] = ["d", "p", "q", "dp", "dq", "qi", "oth", "priv"];

/**
 * Reduces JWKs to the members that strictly model a key.
 *
 * The signature keys accept and preserve any JWK, trusting the caller. This class is the
 * opt-in counterpart: it derives the canonical form of a JWK — an allow-list of members,
 * lexicographically ordered — so that two JWKs of the same cryptographic key become
 * identical, whatever descriptive members (`kid`, `x5c`...) they carry.
 */
export class JwkFilter {
    private constructor() {}

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
    static toPublicJwk(jwk: SignatureJwk, algorithm: JwkSignatureAlgorithm): SignatureJwk {
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
     * The result is {@link JwkFilter.toPublicJwk} completed by the private members of the key
     * type; the same members are dropped, on the same allow-list basis.
     *
     * @param {SignatureJwk} jwk - The private JWK.
     * @param {JwkSignatureAlgorithm} algorithm - The algorithm resolved from that JWK.
     * @return {SignatureJwk} The canonical private JWK, with its members ordered.
     * @throws {Error} If a member required to sign is missing.
     */
    static toPrivateJwk(jwk: SignatureJwk, algorithm: JwkSignatureAlgorithm): SignatureJwk {
        for (const member of REQUIRED_PRIVATE_MEMBERS[algorithm.kty]) {
            if ((jwk as Record<string, unknown>)[member] === undefined) {
                throw new Error(
                    `Cannot import ${algorithm.kty} JWK as a private key: missing member '${member}'`,
                );
            }
        }

        const members: Record<string, unknown> = {...JwkFilter.toPublicJwk(jwk, algorithm)};
        for (const member of PRIVATE_MEMBERS[algorithm.kty]) {
            const value = (jwk as Record<string, unknown>)[member];
            if (value !== undefined) members[member] = value;
        }
        return sortJwkMembers(members);
    }


    /**
     * Returns a copy of a JWK without any private key material.
     *
     * Unlike {@link JwkFilter.toPublicJwk}, every other member is kept.
     *
     * @param {SignatureJwk} jwk - The JWK, possibly private.
     * @return {{jwk: SignatureJwk, stripped: boolean}} The JWK without private members, and whether any was removed.
     */
    static stripPrivateMembers(jwk: SignatureJwk): {jwk: SignatureJwk; stripped: boolean} {
        const copy: Record<string, unknown> = {...jwk};
        let stripped = false;
        for (const member of ALL_PRIVATE_MEMBERS) {
            if (member in copy) {
                delete copy[member];
                stripped = true;
            }
        }
        return {jwk: copy as SignatureJwk, stripped};
    }

    /**
     * Extracts the declared usage (`use` and `key_ops`) of a JWK; absent members stay absent.
     *
     * @param {SignatureJwk} jwk - The JWK.
     * @return {SignatureJwk} A partial JWK holding the usage members only.
     */
    static getUsage(jwk: SignatureJwk): SignatureJwk {
        const usage: SignatureJwk = {};
        if (jwk.use !== undefined) usage.use = jwk.use;
        if (jwk.key_ops !== undefined) usage.key_ops = [...jwk.key_ops];
        return usage;
    }

    /**
     * Derives the usage of the public half from the usage of a private JWK.
     *
     * `sign` becomes `verify`; other operations are kept as they are. When the private
     * JWK declares no usage, none is added.
     *
     * @param {SignatureJwk} privateJwk - The private JWK.
     * @return {SignatureJwk} A partial JWK holding the usage members of the public key.
     */
    static toPublicUsage(privateJwk: SignatureJwk): SignatureJwk {
        const usage = JwkFilter.getUsage(privateJwk);
        if (usage.key_ops !== undefined) {
            usage.key_ops = [...new Set(usage.key_ops.map((op) => (op === "sign" ? "verify" : op)))];
        }
        return usage;
    }
}
