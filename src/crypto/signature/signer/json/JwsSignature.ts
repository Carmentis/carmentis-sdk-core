import * as v from "valibot";
import {JwsSignatureObject, SignatureContext, SignatureContextSchema} from "../../../../type/JsonSignatureSchemas";
import {JsonSignature} from "./JsonSignature";
import {SignatureVerificationUtils} from "./SignatureVerificationUtils";
import {base64UrlToBytes, base64UrlToObject} from "./JsonSignatureUtils";

export class JwsSignature extends JsonSignature {
    private readonly jws: string;
    private readonly context: SignatureContext;
    private readonly payload: object;

    constructor(private readonly signature: JwsSignatureObject) {
        super(signature.signatureType)
        this.jws = this.signature.jws;
        const parts = this.jws.split('.');
        const [encodedHeader, encodedPayload, encodedSignature] = parts;
        const header = base64UrlToObject(encodedHeader);
        this.context = v.parse(SignatureContextSchema, header.context);
        this.payload = base64UrlToObject(encodedPayload);
    }

    getContext() {
        return this.context
    }

    getPayload() {
        return this.payload;
    }

    // Ajout : nécessaire pour reconstruire le signing input lors de la vérification.
    getJws(): string {
        return this.jws;
    }
}