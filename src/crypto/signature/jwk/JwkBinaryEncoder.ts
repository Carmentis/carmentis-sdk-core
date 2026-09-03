import {Encoder} from "cbor-x";
import {SignatureJwk, sortJwkMembers} from "./JwkSignatureAlgorithm";
import { JwkPrivateSignatureKey } from "./JwkPrivateSignatureKey";

/**
 * CBOR codec of the JWK signature keys.
 *
 * The options depart from the `cbor-x` defaults so that the output is plain CBOR rather
 * than a `cbor-x` dialect, which matters because these bytes leave the SDK — they are
 * what {@link JwkPublicSignatureKey.getPublicKeyAsBytes} and
 * {@link JwkPrivateSignatureKey.getPrivateKeyAsBytes} return, and what ends up hashed
 * into key digests and stored on chain.
 */
const JWK_ENCODER = new Encoder({
    // Encode objects as CBOR maps. The default packs them into `cbor-x` records, which
    // carry a private tag and a structure table no other CBOR implementation reads.
    useRecords: false,
    // Size the map header from the member count, as RFC 8949 §4.1 prefers. The default
    // always writes a two-byte length, which no other encoder would produce here.
    variableMapSize: true,
    // Decode maps back into plain objects rather than `Map` instances.
    mapsAsObjects: true,
});

/**
 * Serialises a JWK as CBOR, with its members in lexicographic order.
 *
 * Ordering the members is what makes the encoding canonical: a given key always yields
 * the same bytes, whichever order the JWK it was imported from listed its members in.
 * Feeding this a JWK reduced by {@link extractPublicJwk} or {@link extractPrivateJwk} —
 * which are already ordered — additionally guarantees that two JWKs modelling the same
 * key yield the same bytes, since neither can carry a stray `kid` or `x5c` any more.
 *
 * @param {SignatureJwk} jwk - The JWK to serialise.
 * @return {Uint8Array} The CBOR encoding of the JWK.
 */
export function encodeSignatureJwk(jwk: SignatureJwk): Uint8Array {
    // `cbor-x` returns a view into a buffer it keeps and reuses, so the bytes are copied
    // out rather than handed over along with the multi-kilobyte buffer behind them.
    return Uint8Array.from(JWK_ENCODER.encode(sortJwkMembers(jwk)));
}

/**
 * Reads back a JWK serialised by {@link encodeSignatureJwk}.
 *
 * The decoded JWK is returned as-is; it is the importer that validates it, so that a
 * payload holding a well-formed but unsupported JWK fails with the same diagnostic as
 * the same JWK passed to `fromJwk` directly.
 *
 * @param {Uint8Array} bytes - The CBOR encoding of a JWK.
 * @return {SignatureJwk} The decoded JWK.
 * @throws {Error} If the payload is not CBOR, or does not hold a map.
 */
export function decodeSignatureJwk(bytes: Uint8Array): SignatureJwk {
    let decoded: unknown;
    try {
        decoded = JWK_ENCODER.decode(bytes);
    } catch (cause) {
        throw new Error(`Cannot decode JWK: the payload is not valid CBOR: ${(cause as Error).message}`);
    }

    if (decoded === null || typeof decoded !== "object" || Array.isArray(decoded)) {
        throw new Error("Cannot decode JWK: the CBOR payload does not hold a map");
    }
    return decoded as SignatureJwk;
}
