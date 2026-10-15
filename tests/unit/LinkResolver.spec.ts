import { LinkResolver } from '../../src/resolver/LinkResolver';
import { MbRef, SectRef } from '../../src/resolver/ResolverTypes'
import { describe, it, expect } from 'vitest'

describe("Link resolver", () => {
    it("Should parse the links correctly", async () => {
        const vbId = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

        const linkMb = `cmts://resolve/mb/${vbId}`;
        const resMb = LinkResolver.resolve(linkMb);
        expect(resMb.type).toEqual("mb");
        expect((resMb.ref as MbRef).hash!).toEqual(vbId);

        const link0 = `cmts://resolve/vb/${vbId}/mb/${vbId}`;
        const res0 = LinkResolver.resolve(link0);
        expect(res0.type).toEqual("mb");
        expect((res0.ref as MbRef).vb!.id).toEqual(vbId);

        const link1 = `cmts://resolve/vb/${vbId}/mb/h/1`;
        const res1 = LinkResolver.resolve(link1);
        expect(res1.type).toEqual("mb");
        expect((res1.ref as MbRef).vb!.id).toEqual(vbId);

        const link2 = `cmts://resolve/vb/${vbId}/mb/h/1/sect/123`;
        const res2 = LinkResolver.resolve(link2);
        expect(res2.type).toEqual("section");
        expect((res2.ref as SectRef).index).toEqual(123);

        const link3 = `cmts://resolve/vb/${vbId}/mb/h/1/sect/n/foobar`;
        const res3 = LinkResolver.resolve(link3);
        expect(res3.type).toEqual("section");
        expect((res3.ref as SectRef).name).toEqual("foobar");

        const link4 = `cmtx://resolve/vb/${vbId}/mb/h/1/sect/n/foobar`;
        expect(() => LinkResolver.resolve(link4)).toThrow();
    })
})
