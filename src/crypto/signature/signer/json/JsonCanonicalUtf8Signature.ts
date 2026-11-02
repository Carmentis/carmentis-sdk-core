import {JsonSignature} from "./JsonSignature";
import {JsonCanonicalUtf8SignatureObject} from "../../../../type/JsonSignatureSchemas";
import {PublicSignatureKey} from "../../PublicSignatureKey";
import {CryptoEncoderFactory} from "../../../encoder/CryptoEncoderFactory";

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

    async getPublicKey() {
        const publicKey = this.signatureObject.publicKey;
        if (!publicKey) return undefined;
        return CryptoEncoderFactory.defaultStringSignatureEncoder()
            .decodePublicKey(publicKey)
    }

    getSignatureObject() {
        return this.signatureObject;
    }
}