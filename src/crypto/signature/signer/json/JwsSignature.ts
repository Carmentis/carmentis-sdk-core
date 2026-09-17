import jose from "jose";
import * as v from "valibot";
import {JwsSignatureObject, SignatureContextSchema} from "../../../../type/JsonSignatureSchemas";
import {JsonSignature} from "./JsonSignature";

export class JwsSignature extends JsonSignature {
    private readonly jws: string;

    constructor(private readonly signature: JwsSignatureObject) {
        super(signature.signatureType)
        this.jws = this.signature.jws;
    }

    getContext() {
        const header = jose.decodeProtectedHeader(this.jws)
        return v.parse(SignatureContextSchema, header.context);
    }

    getPayload() {
        return jose.decodeJwt(this.jws)
    }

    // Ajout : nécessaire pour reconstruire le signing input lors de la vérification.
    getJws(): string {
        return this.jws;
    }
}