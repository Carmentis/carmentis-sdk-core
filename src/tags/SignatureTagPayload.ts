import {SignatureTag} from "../type/tags/SignatureTag";
import {Utf8Encoder} from "../data/utf8Encoder";

/**
 * A signature tag as it stands before being signed: everything but the signature itself.
 */
export type UnsignedSignatureTag = Omit<SignatureTag, 'signature'>;

/**
 * Encodes the payload a signature tag signs over: the whole tag but its `signature` member,
 * as JSON with the members of every object sorted, so that two tags carrying the same
 * members produce the same payload whatever order they were assembled in.
 *
 * The embedded data of a tag is expected to be JSON data. A value JSON cannot represent,
 * a `Uint8Array` for instance, is serialised the way `JSON.stringify` serialises it, which
 * says nothing usable about the value.
 *
 * @param {UnsignedSignatureTag} tag - The tag whose payload is to be encoded.
 * @return {Uint8Array} The bytes to sign, or to verify a signature against.
 */
export function encodeSignatureTagPayload(tag: UnsignedSignatureTag): Uint8Array {
    return Utf8Encoder.encode(JSON.stringify(sortMembers({
        metadata: tag.metadata,
        data: tag.data,
        path: tag.path,
        pk: tag.pk,
    })));
}

/**
 * Rewrites every object of the given value with its members in lexicographic order,
 * dropping the members holding `undefined` — which JSON does not represent either.
 */
function sortMembers(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(sortMembers);
    }
    if (value === null || typeof value !== 'object') {
        return value;
    }
    return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
            .filter(([, member]) => member !== undefined)
            .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
            .map(([name, member]) => [name, sortMembers(member)])
    );
}
