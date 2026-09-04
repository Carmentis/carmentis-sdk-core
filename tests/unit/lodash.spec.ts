import {describe, it, expect} from "vitest";
import {get} from "lodash";
import {SectionType} from "../../src/type/valibot/blockchain/section/SectionType";

describe("Lodash", () => {
    it("Should access object in it", () => {
        const obj = {a: 1};
        const target = get(obj, 'a')
        expect(target).toBe(1)

        const mb = {
            header: {
                anchoredAt: '2018-01-10'
            },
            sections: [
                {
                    type: SectionType.CUSTOM,
                    message: 1
                }
            ]
        }
        expect(get(mb, 'header.anchoredAt')).toBe('2018-01-10')
        expect(get(mb, 'sections[0].message')).toBe(1)
    })
})