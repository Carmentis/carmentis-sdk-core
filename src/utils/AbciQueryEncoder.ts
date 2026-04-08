import {AbciRequest, AbciRequestSchema} from "../type/valibot/provider/abci/AbciRequest";
import {decode, encode} from "cbor-x";
import {AbciResponse, AbciResponseSchema} from "../type/valibot/provider/abci/AbciResponse";
import * as v from 'valibot';


export class AbciQueryEncoder {
    static encodeAbciRequest(request: AbciRequest) {
        return encode(v.parse(AbciRequestSchema, request));
    }

    static decodeAbciRequest(request: Uint8Array) {
        return v.parse(AbciRequestSchema, decode(request));
    }

    static encodeAbciResponse(response: AbciResponse) {
        return encode(v.parse(AbciResponseSchema, response));
    }

    static decodeAbciResponse(response: Uint8Array) {
        const decodedResponse = decode(response);
        return v.parse(AbciResponseSchema, decodedResponse);
    }
}