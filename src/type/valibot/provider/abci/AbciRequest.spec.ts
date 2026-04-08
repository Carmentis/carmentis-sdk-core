import {AbciResponse, AbciResponseType} from "./AbciResponse";
import {AbciQueryEncoder} from "../../../../utils/AbciQueryEncoder";
import { describe, it, expect } from 'vitest'

describe("Abci request", () => {
    it('A response can be decoded', () => {
        const response: AbciResponse = {
            responseType: AbciResponseType.OBJECT_LIST,
            list: [
                Uint8Array.from([
                    37, 50, 14, 109, 170, 198, 20, 130,
                    82, 182, 133, 44, 30, 186, 160, 38,
                    135, 34, 177, 122, 46, 170, 114, 221,
                    154, 132, 85, 2, 53, 52, 171, 62
                ]),
                Uint8Array.from([
                    61, 156, 209, 31, 17, 129, 152, 224,
                    154, 166, 40, 131, 212, 145, 56, 92,
                    38, 17, 31, 219, 111, 137, 64, 27,
                    204, 87, 120, 168, 198, 191, 140, 184
                ]),
                Uint8Array.from([
                    101, 183, 88, 223, 31, 246, 235, 202,
                    193, 162, 184, 90, 206, 77, 252, 226,
                    147, 197, 4, 227, 95, 47, 178, 34,
                    127, 169, 143, 33, 192, 68, 142, 4
                ]),
                Uint8Array.from([
                    107, 110, 244, 6, 179, 149, 196, 232,
                    240, 80, 57, 27, 202, 152, 178, 173,
                    238, 0, 61, 56, 235, 44, 229, 46,
                    174, 71, 9, 32, 14, 100, 104, 75
                ]),
                Uint8Array.from([
                    198, 171, 15, 166, 253, 98, 27, 125,
                    74, 66, 8, 20, 135, 48, 153, 100,
                    147, 21, 182, 4, 86, 123, 155, 181,
                    119, 246, 77, 185, 194, 192, 191, 0
                ]),
                Uint8Array.from([
                    227, 25, 225, 198, 208, 170, 5, 202,
                    50, 220, 12, 39, 166, 46, 33, 134,
                    161, 25, 85, 79, 37, 165, 165, 15,
                    134, 55, 222, 248, 41, 59, 137, 82
                ])
            ]
        };

        const encodedResponse = AbciQueryEncoder.encodeAbciResponse(response);
        const decodedResponse = AbciQueryEncoder.decodeAbciResponse(encodedResponse);
        expect(decodedResponse).toEqual(response)
    })
})