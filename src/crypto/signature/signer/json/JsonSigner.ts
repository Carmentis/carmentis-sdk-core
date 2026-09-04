import {PrivateSignatureKey} from "../../PrivateSignatureKey";
import {JsonCanonicalizationMethod} from "./JsonCanonicalizationMethod";
import {BinaryEncoding} from "../binary/BinaryEndoding";
import {BinaryEncoder} from "../binary/BinaryEncoder";
import {JsonEncoder} from "./JsonEncoder";

export class JsonSigner {
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

    async sign(
        sk: PrivateSignatureKey,
        message: object,
    ) {
        const rawMessage = JsonEncoder.encode(
            message,
            this.jsonCanonicalizationMethod
        );
        const rawSignature = await sk.sign(rawMessage);
        return BinaryEncoder.encode(rawSignature, this.signatureEncoding)
    }
}