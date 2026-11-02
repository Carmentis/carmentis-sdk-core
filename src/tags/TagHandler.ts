import { Provider } from '../providers/Provider';
import { JsonObject } from '../type/valibot/json/Json';
import { ResolverPath } from '../resolver/ResolverPath';
import { MicroblockNode, SectionNode } from '../type/valibot/resolutionNodes/ResolutionNodes';
import {
    ResolverInput,
    ResolverOutput,
    ResolverHydrator,
    TagHandlerOutput,
    TagInfo,
} from '../resolver/ResolverTypes';

export interface TagHandlerContext {
    /**
     * Returns the closest microblock or section node enclosing the given path, if any.
     */
    getEnclosingNode(path: ResolverPath): MicroblockNode | SectionNode | undefined
}

export abstract class TagHandler {
    constructor(
        protected readonly hydrator: ResolverHydrator,
        protected readonly provider: Provider,
        protected readonly input: ResolverInput | ResolverOutput,
    ) {}

    abstract getTags(): TagInfo[]
    abstract handle(tag: string, object: JsonObject, path: ResolverPath, context?: TagHandlerContext): Promise<TagHandlerOutput>
}
