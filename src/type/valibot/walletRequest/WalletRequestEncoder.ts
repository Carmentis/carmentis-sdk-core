import * as v from 'valibot';
import {decode, encode} from 'cbor-x';
import {
    WalletRequest,
    WalletRequestSchema,
    WalletResponse,
    WalletResponseSchema
} from './walletRequests';

export class WalletRequestEncoder {
    static encodeRequest(request: WalletRequest): Uint8Array {
        return encode(v.parse(WalletRequestSchema, request));
    }

    static decodeRequest(data: Uint8Array): WalletRequest {
        return v.parse(WalletRequestSchema, decode(data));
    }

    static encodeResponse(response: WalletResponse): Uint8Array {
        return encode(v.parse(WalletResponseSchema, response));
    }

    static decodeResponse(data: Uint8Array): WalletResponse {
        const decodedResponse = decode(data);
        return v.parse(WalletResponseSchema, decodedResponse);
    }
}

export class WalletRequestValidation {
    static validateWalletRequest(request: object): WalletRequest {
        return v.parse(WalletRequestSchema, request);
    }

    static validateWalletResponse(response: object): WalletResponse {
        return v.parse(WalletResponseSchema, response);
    }
}
