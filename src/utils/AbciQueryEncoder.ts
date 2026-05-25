import {AbciRequest, AbciRequestSchema} from "../type/valibot/provider/abci/AbciRequest";
import {decode, encode} from "cbor-x";
import {AbciResponse, AbciResponseSchema} from "../type/valibot/provider/abci/AbciResponse";
import * as v from 'valibot';


export class AbciQueryEncoder {
    static encodeAbciRequest(request: AbciRequest): Uint8Array {
        return encode(v.parse(AbciRequestSchema, request));
    }

    static decodeAbciRequest(request: Uint8Array): AbciRequest {
        return v.parse(AbciRequestSchema, decode(request));
    }

    static encodeAbciResponse(response: AbciResponse): Uint8Array {
        return encode(v.parse(AbciResponseSchema, response));
    }

    static decodeAbciResponse(response: Uint8Array): AbciResponse {
        const decodedResponse = decode(response);
        return v.parse(AbciResponseSchema, decodedResponse);
    }
}