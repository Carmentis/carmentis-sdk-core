import {JsonSignature} from "./JsonSignature";
import {JsonCanonicalUtf8SignatureObject} from "../../../../type/JsonSignatureSchemas";

export class JsonCanonicalUtf8Signature extends JsonSignature {
    constructor(private readonly signatureObject: JsonCanonicalUtf8SignatureObject) {
        super(signatureObject.signatureType)
    }


    getContext() {
        return this.signatureObject.context;
    }

    getPayload() {
        return this.signatureObject.payload;
    }

    getSignatureObject() {
        return this.signatureObject;
    }
}