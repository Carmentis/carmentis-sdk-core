import {AbciResponse, AbciResponseType} from "../../src/type/valibot/provider/abci/AbciResponse";
import {AbciQueryEncoder} from "../../src/utils/AbciQueryEncoder";
import { describe, it, expect } from 'vitest'

describe("Abci request", () => {
    it('A response can be decoded', () => {
        const response: AbciResponse = {
            responseType: AbciResponseType.ACCOUNT_BY_PUBLIC_KEY_HASH,
            accountHash: Uint8Array.from([
                37, 50, 14, 109, 170, 198, 20, 130,
                82, 182, 133, 44, 30, 186, 160, 38,
                135, 34, 177, 122, 46, 170, 114, 221,
                154, 132, 85, 2, 53, 52, 171, 62
            ]),
        };

        const encodedResponse = AbciQueryEncoder.encodeAbciResponse(response);
        const decodedResponse = AbciQueryEncoder.decodeAbciResponse(encodedResponse);
        expect(decodedResponse).toEqual(response)
    })
})