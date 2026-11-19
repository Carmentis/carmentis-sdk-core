import { ResolverPath } from '../../src/resolver/ResolverPath';
import { describe, it, expect } from 'vitest'

describe("ResolverPath", () => {
    it("Should run the methods correctly", async () => {
        const obj = {
            myObject: {
                subObject1: {
                    someString: "hello",
                },
                subObject2: {
                    someOtherString: "world",
                },
                someArray: [ "foo", "bar" ],
            }
        }
        const p1 = [ "myObject", "subObject1" ];
        const rp1 = new ResolverPath(p1);
        rp1.join([ "..", "subObject2" ]);
        expect(rp1.toString()).toEqual("myObject.subObject2");

        rp1.append("someOtherString");
        expect(rp1.applyToData(obj)).toEqual("world");

        const p2 = [ "myObject" ];
        const rp2 = new ResolverPath(p2);
        rp2.join([ "someArray", 0 ]);
        expect(rp2.applyToData(obj)).toEqual("foo");

        const p3 = [ "myObject" ];
        const rp3 = new ResolverPath(p3);
        rp3.join([ "someArray", "0" ]);
        expect(() => rp3.applyToData(obj)).toThrow();
    })
})
