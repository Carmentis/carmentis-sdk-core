import { TagHandler } from "./TagHandler";
import { JsonObject, JsonData } from '../type/valibot/json/Json';
import { LinkResolver } from '../resolver/LinkResolver';
import { SectionType } from '../type/valibot/blockchain/section/SectionType';
import { TAG } from '../type/tags/tags';
import { MicroblockNode, SectionNode } from '../type/valibot/resolutionNodes/ResolutionNodes';
import { ResolverPath } from '../resolver/ResolverPath';
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
        const mb = await vb.getMicroblock(height);
        const data = await this.hydrator.hydrateMicroblock(link, mbRef);
        const node: MicroblockNode = {
            type: "microblock",
            hash: mb.getHash().encode(),
            vbId: vb.getIdentifier().encode(),
            height,
            found: true,
        };
        return { output: data, node, resolveOutput: true };
    }

    private async resolveSection(link: string, path: ResolverPath, sectRef: SectRef) {
        const { section, microblockHash, vbId, height, index } = await LinkResolver.getSection(this.provider, sectRef);
        const node: SectionNode = {
            type: "section",
            microblockHash,
            vbId,
            height,
            index,
            found: true,
        };
        return { output: section as JsonObject, node, resolveOutput: true };
    }
}
