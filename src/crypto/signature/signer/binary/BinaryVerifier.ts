import {JsonCanonicalizationMethod} from "../json/JsonCanonicalizationMethod";
import {BinaryEncoding} from "./BinaryEndoding";
import {PrivateSignatureKey} from "../../PrivateSignatureKey";
import {JsonEncoder} from "../json/JsonEncoder";
import {BinaryEncoder} from "./BinaryEncoder";
import {PublicSignatureKey} from "../../PublicSignatureKey";

export class BinaryVerifier {
    private signatureEncoding: BinaryEncoding = BinaryEncoding.HEX;

    setSignatureEncoding(encoding: BinaryEncoding) {
        this.signatureEncoding = encoding;
        return this;
    }

    async verify(
        pk: PublicSignatureKey,
        messageEncoding: BinaryEncoding,
        encodedMessage: string,
        signature: string,
    ) {
        const rawMessage = BinaryEncoder.decode(encodedMessage, messageEncoding);
        const rawSignature = BinaryEncoder.decode(signature, this.signatureEncoding);
        return await pk.verify(rawMessage, rawSignature);
    }
}