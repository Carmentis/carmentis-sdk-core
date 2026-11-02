import {Point} from "@noble/secp256k1";
import {base64url} from "jose";
import {PublicSignatureKey} from "./PublicSignatureKey";
import {SignatureSchemeId} from "./SignatureSchemeId";
import {JwkPublicSignatureKey} from "./jwk/JwkPublicSignatureKey";
import {encodeSignatureJwk} from "./jwk/JwkBinaryEncoder";
import {SignatureJwk} from "./jwk/JwkSignatureAlgorithm";
import {getSubtle} from "./jwk/webcrypto";

/** A public key, either a Carmentis key or a key managed by the Web Crypto API. */
export type ComparablePublicKey = PublicSignatureKey | CryptoKey;

/**
 * Tells whether two public keys model the same cryptographic key.
 *
 * The keys may come from different worlds: Carmentis native keys (secp256k1, Ed25519,
 * ML-DSA-65), JWK-backed keys, and `CryptoKey`s managed by Node.js or the browser. Each
 * is reduced to its canonical public JWK, and the CBOR encodings of those JWKs are
 * compared, so that representation details (member order, `kid`, `key_ops`, compressed
 * versus uncompressed points...) never make two equivalent keys look different.
 */
export class PublicSignatureComparator {
    /**
     * @param {ComparablePublicKey} a - The first public key.
     * @param {ComparablePublicKey} b - The second public key.
     * @return {Promise<boolean>} Whether both keys model the same public key.
     * @throws {Error} If a key is private, non-exportable or of an unsupported kind.
     */
    static async areEquals(a: ComparablePublicKey, b: ComparablePublicKey): Promise<boolean> {
        const [jwkA, jwkB] = await Promise.all([toCanonicalJwk(a), toCanonicalJwk(b)]);
        const bytesA = encodeSignatureJwk(jwkA);
        const bytesB = encodeSignatureJwk(jwkB);
        return bytesA.length === bytesB.length && bytesA.every((byte, i) => byte === bytesB[i]);
    }
}

function isCryptoKey(key: ComparablePublicKey): key is CryptoKey {
    return typeof CryptoKey !== "undefined"
        ? key instanceof CryptoKey
        : typeof (key as CryptoKey).type === "string" && typeof (key as CryptoKey).algorithm === "object";
}

async function toCanonicalJwk(key: ComparablePublicKey): Promise<SignatureJwk> {
    if (isCryptoKey(key)) {
        if (key.type !== "public") {
            throw new Error(`Cannot compare a CryptoKey of type '${key.type}': a public key is expected`);
        }
        if (!key.extractable) {
            throw new Error("Cannot compare a non-extractable CryptoKey");
        }
        const jwk = await getSubtle().exportKey("jwk", key) as SignatureJwk;
        return (await JwkPublicSignatureKey.fromJwk(jwk)).getPublicJwk();
    }

    if (key instanceof JwkPublicSignatureKey) return key.getPublicJwk();

    const bytes = await key.getPublicKeyAsBytes();
    switch (key.getSignatureSchemeId()) {
        case SignatureSchemeId.ED25519:
            return canonical({kty: "OKP", crv: "Ed25519", x: base64url.encode(bytes)});
        case SignatureSchemeId.ML_DSA_65:
            return canonical({kty: "AKP", alg: "ML-DSA-65", pub: base64url.encode(bytes)});
        case SignatureSchemeId.SECP256K1:
        case SignatureSchemeId.PKMS_SECP256K1: {
            // Native keys may be compressed; the JWK always carries both coordinates.
            const uncompressed = Point.fromBytes(bytes).toBytes(false);
            return canonical({
                kty: "EC",
                crv: "secp256k1",
                x: base64url.encode(uncompressed.slice(1, 33)),
                y: base64url.encode(uncompressed.slice(33, 65)),
            });
        }
        default:
            throw new Error(`Cannot compare public keys of signature scheme ${key.getSignatureSchemeId()}`);
    }
}

/** Runs a hand-built JWK through the importer, so it takes the exact canonical form. */
async function canonical(jwk: SignatureJwk): Promise<SignatureJwk> {
    return (await JwkPublicSignatureKey.fromJwk(jwk)).getPublicJwk();
}
