import * as v from 'valibot';
import {JwsSignature} from "./JwsSignature";
import {JsonCanonicalUtf8Signature} from "./JsonCanonicalUtf8Signature";
import {SignatureContext, SignatureObjectSchema, SignatureType} from "../../../../type/JsonSignatureSchemas";


export abstract class JsonSignature {
    constructor(
        private readonly signatureType: SignatureType
    ) {}

    getSignatureType() {
        return this.signatureType;
    }

    abstract getContext(): SignatureContext;
    abstract getPayload(): unknown;
}




