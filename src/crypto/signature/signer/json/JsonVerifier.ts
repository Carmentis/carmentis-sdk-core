import {JsonCanonicalizationMethod} from "./JsonCanonicalizationMethod";
import {BinaryEncoding} from "../binary/BinaryEndoding";
import {BinaryEncoder} from "../binary/BinaryEncoder";
import {JsonEncoder} from "./JsonEncoder";
import {PublicSignatureKey} from "../../PublicSignatureKey";

export class JsonVerifier {
    private jsonCanonicalizationMethod: JsonCanonicalizationMethod = JsonCanonicalizationMethod.JSON_CANONICAL;
    private signatureEncoding: BinaryEncoding = BinaryEncoding.HEX;

    setJsonCanonicalizationMethod(canonicalizationMethod: JsonCanonicalizationMethod) {
        this.jsonCanonicalizationMethod = canonicalizationMethod;
        return this;
    }

    setSignatureEncoding(encoding: BinaryEncoding) {
        this.signatureEncoding = encoding;
        return this;
    }

    async verify(
        pk: PublicSignatureKey,
        message: object,
        signature: string,
    ) {
        const rawMessage = JsonEncoder.encode(message, this.jsonCanonicalizationMethod);
        const rawSignature = BinaryEncoder.decode(signature, this.signatureEncoding);
        return await pk.verify(rawMessage, rawSignature);
    }
}