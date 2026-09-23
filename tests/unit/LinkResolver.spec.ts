import { LinkResolver, VbRef, MbRef, SectRef } from '../../src/blockchain/resolver/LinkResolver';
import { describe, it, expect } from 'vitest'

describe("Link resolver", () => {
    it("Should parse the links correctly", async () => {
        const vbId = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
        const link0 = `cmts://resolve/vb/${vbId}/mb/h/1`;
        const res0 = LinkResolver.resolve(link0);
        expect(res0.type).toEqual("mb");
        expect((res0.ref as MbRef).vb!.id).toEqual(vbId);

        const link1 = `cmts://resolve/vb/${vbId}/mb/h/1/sect/123`;
        const res1 = LinkResolver.resolve(link1);
        expect(res1.type).toEqual("section");
        expect((res1.ref as SectRef).index).toEqual(123);

        const link2 = `cmts://resolve/vb/${vbId}/mb/h/1/sect/n/foobar`;
        const res2 = LinkResolver.resolve(link2);
        expect(res2.type).toEqual("section");
        expect((res2.ref as SectRef).name).toEqual("foobar");

        const link3 = `cmtx://resolve/vb/${vbId}/mb/h/1/sect/n/foobar`;
        expect(() => LinkResolver.resolve(link3)).toThrow();
    })
})
