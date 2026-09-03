import {JsonCanonicalizationMethod} from "../json/JsonCanonicalizationMethod";
import {BinaryEncoding} from "./BinaryEndoding";
import {PrivateSignatureKey} from "../../PrivateSignatureKey";
import {JsonEncoder} from "../json/JsonEncoder";
import {BinaryEncoder} from "./BinaryEncoder";

export class BinarySigner {
    private signatureEncoding: BinaryEncoding = BinaryEncoding.HEX;

    setSignatureEncoding(encoding: BinaryEncoding) {
        this.signatureEncoding = encoding;
        return this;
    }

    async sign(
        sk: PrivateSignatureKey,
        messageEncoding: BinaryEncoding,
        encodedMessage: string,
    ) {
        const message = BinaryEncoder.decode(encodedMessage, messageEncoding);
        const rawSignature = await sk.sign(message);
        return BinaryEncoder.encode(rawSignature, this.signatureEncoding);
    }
}