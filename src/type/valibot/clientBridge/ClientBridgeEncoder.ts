import * as v from 'valibot';
import {decode, encode} from 'cbor-x';
import {
    ClientBridgeMessage,
    ClientBridgeMessageSchema
} from './clientBridgeMessages';

export class ClientBridgeEncoder {
    static encode(message: ClientBridgeMessage): Uint8Array {
        return encode(v.parse(ClientBridgeMessageSchema, message));
    }

    static decode(data: Uint8Array): ClientBridgeMessage {
        return v.parse(ClientBridgeMessageSchema, decode(data));
    }
}

export class ClientBridgeValidation {
    static validateClientBridgeMessage(message: unknown): ClientBridgeMessage {
        return v.parse(ClientBridgeMessageSchema, message);
    }
}