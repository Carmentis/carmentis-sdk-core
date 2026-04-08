import {
    WalletInteractiveAnchoringRequest,
    WalletInteractiveAnchoringRequestSchema,
    WalletInteractiveAnchoringResponse,
    WalletInteractiveAnchoringResponseSchema
} from "../type/valibot/walletOperatorMessages/Schemas";
import {Encoder, Decoder} from "cbor-x";
import * as v from 'valibot';

export class WalletInteractiveAnchoringEncoder {
    private static encoder = new Encoder({
        tagUint8Array: true,
        mapsAsObjects: true,
    });
    static encodeRequest(request: WalletInteractiveAnchoringRequest) {
        return this.encoder.encode(v.parse(WalletInteractiveAnchoringRequestSchema, request));
    }

    static decodeRequest(request: Uint8Array) {
        return v.parse(WalletInteractiveAnchoringRequestSchema, this.encoder.decode(request));
    }

    static encodeResponse(response: WalletInteractiveAnchoringResponse) {
        return this.encoder.encode(v.parse(WalletInteractiveAnchoringResponseSchema, response));
    }

    static decodeResponse(response: Uint8Array) {
        const decodedResponse = this.encoder.decode(response);
        return v.parse(WalletInteractiveAnchoringResponseSchema, decodedResponse);
    }
}

export class WalletInteractiveAnchoringValidation {
    static validateRequest(request: object) {
        return v.parse(WalletInteractiveAnchoringRequestSchema, request);
    }

    static validateResponse(response: object) {
        return v.parse(WalletInteractiveAnchoringResponseSchema, response);
    }
}
