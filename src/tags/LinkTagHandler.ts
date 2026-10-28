import { TagHandler } from "./TagHandler";
import { JsonObject, JsonData } from '../type/valibot/json/Json';
import { LinkResolver } from '../resolver/LinkResolver';
import { SectionType } from '../type/valibot/blockchain/section/SectionType';
import { Microblock } from '../blockchain/microblock/Microblock';
import { DckfSignatureEncoder } from '../crypto/encoder/signature/dckf/DckfSignatureEncoder';
import { TAG } from '../type/tags/tags';
import { MicroblockNode, SectionNode } from '../type/valibot/resolutionNodes/ResolutionNodes';
import { ResolverPath } from '../resolver/ResolverPath';
import { Hash } from '../entities/Hash';
import {
    MbRef,
    SectRef,
    TagHandlerOutput,
} from '../resolver/ResolverTypes';

export class LinkTagHandler extends TagHandler {
    private resolvedLinksMap: Map<string, TagHandlerOutput> = new Map;

    constructor(...args: ConstructorParameters<typeof TagHandler>) {
        super(...args);
        this.resolvedLinksMap = new Map;
    }

    getTags() {
        return [ { name: TAG.LINK } ];
    }

    async handle(tag: string, link: any, path: ResolverPath) {
        if (typeof link !== 'string' || !LinkResolver.isLink(link)) {
            throw new Error(`provided entry in ${TAG.LINK} has an invalid format (path: ${path})`);
        }
        return await this.resolveLink(link, path);
    }

    private async resolveLink(link: string, path: ResolverPath) {
        const cachedData = this.resolvedLinksMap.get(link);

        if (cachedData !== undefined) {
            return cachedData;
        }

        const resolvedLink = LinkResolver.resolve(link);
        let data: TagHandlerOutput;

        switch (resolvedLink.type) {
            case "mb": {
                data = await this.resolveMicroblock(link, path, resolvedLink.ref);
                break;
            }
            case "section": {
                data = await this.resolveSection(link, path, resolvedLink.ref);
                break;
            }
            default: {
                throw new Error(`unsupported link type 'resolvedLink.type'`);
            }
        }
        this.resolvedLinksMap.set(link, data);
        return data;
    }

    private async resolveMicroblock(link: string, path: ResolverPath, mbRef: MbRef) {
        const { vb, height } = await LinkResolver.getMicroblockLocation(this.provider, mbRef);
        const microblock = await vb.getMicroblock(height);
        const data = await this.hydrator.hydrateMicroblock(link, mbRef);
        const node: MicroblockNode = {
            type: "microblock",
            hash: microblock.getHash().encode(),
            publicKey: await this.getMicroblockPublicKey(microblock),
            vbId: vb.getIdentifier().encode(),
            height,
            found: true,
        };
        return { output: data, node, resolveOutput: true };
    }

    private async resolveSection(link: string, path: ResolverPath, sectRef: SectRef) {
        const { section, microblock, vbId, height, index } = await LinkResolver.getSection(this.provider, sectRef);
        const node: SectionNode = {
            type: "section",
            microblockHash: microblock.getHash().encode(),
            publicKey: await this.getMicroblockPublicKey(microblock),
            vbId,
            height,
            index,
            found: true,
        };
        return { output: section as JsonObject, node, resolveOutput: true };
    }

    private async getMicroblockPublicKey(microblock: Microblock) {
        const accountId = microblock.getFeesPayerAccount();
        const accountVb = await this.provider.loadAccountVirtualBlockchain(Hash.from(accountId));
        const pubKey = await accountVb.getPublicKey();
        const encoder = new DckfSignatureEncoder;
        const encodedPublicKey = await encoder.encodePublicKey(pubKey);
        return encodedPublicKey;
    }
}
