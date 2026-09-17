import {JsonSignature} from "./JsonSignature";
import {SignatureContext, SignatureObjectSchema, SignatureType} from "../../../../type/JsonSignatureSchemas";
import {JsonCanonicalUtf8Signature} from "./JsonCanonicalUtf8Signature";
import {JwsSignature} from "./JwsSignature";
import * as v from 'valibot';


export class JsonSignatureParser {
    /**
     * Creates a signature object.
     *
     * @param object
     */
    static parse(object: unknown): JsonSignature {
        const sig = v.parse(SignatureObjectSchema, object);
        if (sig.signatureType === SignatureType.JSON_CANONICAL_UTF8) {
            return new JsonCanonicalUtf8Signature(sig)
        } else if (sig.signatureType === SignatureType.JWS) {
            return new JwsSignature(sig)
        } else {
            throw new Error(`Unknown signature type`)
        }
    }
}