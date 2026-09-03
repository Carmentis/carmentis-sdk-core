import {match} from "ts-pattern";
import {BinaryEncoding} from "./BinaryEndoding";

export class BinaryEncoder {
    static decode(message: string, encoding: BinaryEncoding): Uint8Array {
        return match(encoding)
            .with(BinaryEncoding.BASE64, () => Buffer.from(message, 'base64'))
            .with(BinaryEncoding.HEX, () => Buffer.from(message, 'hex'))
            .with(BinaryEncoding.BASE64URL, () => Buffer.from(message, 'base64url'))
            .exhaustive()
    }

    static encode(message: Uint8Array, encoding: BinaryEncoding) {
        return match(encoding)
            .with(BinaryEncoding.BASE64, () => Buffer.from(message).toString('base64'))
            .with(BinaryEncoding.HEX, () => Buffer.from(message).toString('hex'))
            .with(BinaryEncoding.BASE64URL, () => Buffer.from(message).toString('base64url'))
            .exhaustive()
    }
}