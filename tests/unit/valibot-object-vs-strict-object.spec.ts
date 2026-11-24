import { describe, it, expect } from 'vitest'
import * as v from 'valibot';

describe("Valibot object vs strict object", () => {
    it("Should remove fields from object", () => {
        const schema = v.object({
            a: v.number(),
            b: v.number(),
            c: v.number(),
        });
        const obj = { a: 1, b: 2, c: 3, d: 4 };
        const result = v.parse(schema, obj);
        expect(result).toEqual({ a: 1, b: 2, c: 3 });
    })

    it("Should raise an exception when more fields", () => {
        const schema = v.strictObject({
            a: v.number(),
            b: v.number(),
            c: v.number(),
        });
        const obj = { a: 1, b: 2, c: 3, d: 4 };
        expect(() => v.parse(schema, obj)).toThrow();
    })
})