import { ResolvedPath, MbRef, VbRef, SectRef } from "./ResolverTypes";
import { VirtualBlockchainType } from "../type/VirtualBlockchainType";

const VB_TYPES: Record<string, number | undefined> = {
    vb: undefined,
    acc: VirtualBlockchainType.ACCOUNT_VIRTUAL_BLOCKCHAIN,
    al: VirtualBlockchainType.APP_LEDGER_VIRTUAL_BLOCKCHAIN,
    app: VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN,
    node: VirtualBlockchainType.NODE_VIRTUAL_BLOCKCHAIN,
    org: VirtualBlockchainType.ORGANIZATION_VIRTUAL_BLOCKCHAIN,
    prot: VirtualBlockchainType.PROTOCOL_VIRTUAL_BLOCKCHAIN,
}

const MB_TAG = "mb";
const SECTION_TAG = "sect";
const HEIGHT_TAG = "h";
const NAME_TAG = "n";

export class LinkResolver {
    static isLink(item: unknown): boolean {
        if (typeof item !== 'string' || !item.startsWith("cmts://resolve/")) {
            return false;
        }
        try {
            new URL(item);
            return true;
        }
        catch {
            return false;
        }
    }

    static getPath(link: string): string[] {
        if (!LinkResolver.isLink(link)) {
            throw new Error('invalid link format');
        }
        const url = new URL(link);
        const path = url.pathname.split("/").slice(1);
        return path;
    }

    static resolve(link: string): ResolvedPath {
        const path = LinkResolver.getPath(link);
        let ptr = 0;
        const next = (expected: string): string => {
            if (ptr >= path.length) {
                throw new Error(`unexpected end of path in '${link}', was expecting ${expected}`);
            }
            return path[ptr++];
        };
        const endOfPath = (): boolean => ptr >= path.length;

        let vb: VbRef = { id: "" };
        let mb: MbRef = {};
        const root = next(`<root_tag>`);
        let vbAtRoot = root in VB_TYPES;

        // level 1: VB or MB
        if (vbAtRoot) {
            const type = VB_TYPES[root];
            const id = next(`<vb_id>`);
            vb = { id, ...(type !== undefined && { type }) };
        } else if (root == MB_TAG) {
            mb = { hash: next(`<mb_hash>`) }
        } else {
            throw new Error(`unrecognized root tag '${root}' in '${link}'`);
        }

        if (endOfPath()) {
            return vbAtRoot ? { type: "vb", ref: vb } : { type: "mb", ref: mb };
        }

        // level 2: MB (if level 1 is a VB)
        if (vbAtRoot) {
            const mbTag = next(`'${MB_TAG}'`);
            if (mbTag !== MB_TAG) {
                throw new Error(`unexpected tag '${mbTag}' in '${link}', was expecting '${MB_TAG}'`);
            }
            const key = next(`'${HEIGHT_TAG}' or <mb_hash>`);
            if (key === HEIGHT_TAG) {
                const height = Number(next(`microblock height`));
                if (!Number.isInteger(height) || height < 1) {
                    throw new Error(`invalid height in '${link}'`);
                }
                mb = { vb, height };
            } else {
                mb = { vb, hash: key };
            }
        }

        if (endOfPath()) {
            return { type: "mb", ref: mb };
        }

        // level 3: section
        const sectTag = next(`'${SECTION_TAG}'`);
        if (sectTag !== SECTION_TAG) {
            throw new Error(`unexpected tag '${sectTag}' in '${link}', was expecting '${SECTION_TAG}'`);
        }
        const key = next(`'${NAME_TAG}' or <section_index>`);
        let sect: SectRef;
        if (key === NAME_TAG) {
            sect = { mb, name: next(`section name`) };
        } else {
            const index = Number(key);
            if (!Number.isInteger(index) || index < 0) {
                throw new Error(`invalid section index in '${link}'`);
            }
            sect = { mb, index };
        }

        if (!endOfPath()) {
            throw new Error(`unexpected trailing tags in '${link}'`);
        }
        return { type: "section", ref: sect };
    }
}
