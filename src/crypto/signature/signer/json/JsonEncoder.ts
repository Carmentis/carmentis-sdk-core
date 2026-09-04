import {JsonCanonicalizationMethod} from "./JsonCanonicalizationMethod";
import {match} from "ts-pattern";
import {canonicalize} from "json-canonicalize";
import {CBORCryptoBinaryEncoder} from "../../../encoder/CryptoEncoderFactory";

export class JsonEncoder {
    static encode(message: object, canonicalizationMethod: JsonCanonicalizationMethod) {
        return match(canonicalizationMethod)
            .with(JsonCanonicalizationMethod.JSON_CANONICAL, () => {
                const utf8Decoder = new TextEncoder();
                const rawPayload = utf8Decoder.encode(canonicalize(message));
                return rawPayload;
            })
            .with(JsonCanonicalizationMethod.CBOR, () => {
                return new CBORCryptoBinaryEncoder().encode(message);
            })
            .exhaustive();
    }
}