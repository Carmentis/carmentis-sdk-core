import * as v from "valibot";
import {Encoder} from "cbor-x";
import {
    KEY_FILE_FORMAT_VERSION,
    KeyFileEnvelope,
    KeyFileEnvelopeSchema,
    KeyFileHeader,
    KeyFilePayload,
    KeyFilePayloadSchema,
} from "../../type/valibot/walletExport/WalletExportSchema";
import {Base64} from "../../data/base64";
import {WalletKeyFileError} from "../../errors/carmentis-error";

// Plain CBOR (no cbor-x records), as for the JWK encoding. `tagUint8Array: false` keeps byte strings
// untagged whatever the runtime: cbor-x otherwise tags a Uint8Array (tag 64) when `Buffer` exists
// (Node) but not in a browser or webview, which would make the authenticated header differ.
const ENCODER = new Encoder({useRecords: false, variableMapSize: true, mapsAsObjects: true, tagUint8Array: false});

/**
 * Serialization of key files: CBOR for the envelope and for the payload (the JSON document),
 * with schema validation in both directions.
 */
export class KeyFileCodec {
    encodeEnvelope(envelope: KeyFileEnvelope): Uint8Array {
        return this.cbor(v.parse(KeyFileEnvelopeSchema, envelope));
    }

    decodeEnvelope(bytes: Uint8Array): KeyFileEnvelope {
        const decoded = this.decodeCbor(bytes, "key file");
        const version = (decoded as { formatVersion?: unknown } | null)?.formatVersion;
        if (typeof version === "number" && version !== KEY_FILE_FORMAT_VERSION) {
            throw new WalletKeyFileError(`unsupported format version ${version}`);
        }
        const result = v.safeParse(KeyFileEnvelopeSchema, decoded);
        if (!result.success) throw new WalletKeyFileError("not a valid key file");
        return result.output;
    }

    encodePayload(payload: KeyFilePayload): Uint8Array {
        const validated = v.parse(KeyFilePayloadSchema, payload);
        // The payload is a JSON document: make sure nothing but JSON reaches the CBOR encoder.
        return this.cbor(JSON.parse(JSON.stringify(validated)));
    }

    decodePayload(bytes: Uint8Array): KeyFilePayload {
        const result = v.safeParse(KeyFilePayloadSchema, this.decodeCbor(bytes, "payload"));
        if (!result.success) throw new WalletKeyFileError("the decrypted payload is invalid");
        return result.output;
    }

    /**
     * The associated data authenticated with the ciphertext. Members are sorted so that the bytes
     * only depend on the content of the header, not on the order it was built or decoded in.
     */
    buildAad(header: KeyFileHeader): Uint8Array {
        return this.cbor(sortMembers(header));
    }

    toBase64(bytes: Uint8Array): string {
        return Base64.encodeBinary(bytes, Base64.BASE64, true);
    }

    fromBase64(text: string): Uint8Array {
        return Base64.decodeBinary(text.trim(), Base64.BASE64);
    }

    private cbor(value: unknown): Uint8Array {
        // cbor-x hands out a view on a reused buffer.
        return Uint8Array.from(ENCODER.encode(value));
    }

    private decodeCbor(bytes: Uint8Array, what: string): unknown {
        try {
            return ENCODER.decode(bytes);
        } catch {
            throw new WalletKeyFileError(`the ${what} is not valid CBOR`);
        }
    }
}

function sortMembers(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(sortMembers);
    if (value !== null && typeof value === "object" && !(value instanceof Uint8Array)) {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
                .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
                .map(([k, val]) => [k, sortMembers(val)]),
        );
    }
    return value;
}
