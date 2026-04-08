import * as v from 'valibot';
import {decode, encode} from 'cbor-x';
import {WiQrCode, WiQrCodeSchema} from './clientBridgeMessages';

export class WiQrCodeEncoder {
    static encode(qrCode: WiQrCode): Uint8Array {
        return encode(v.parse(WiQrCodeSchema, qrCode));
    }

    static decode(data: Uint8Array): WiQrCode {
        return v.parse(WiQrCodeSchema, decode(data));
    }
}
