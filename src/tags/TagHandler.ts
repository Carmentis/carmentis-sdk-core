import { Provider } from '../providers/Provider';
import { JsonObject } from '../type/valibot/json/Json';
import { ResolverPath } from '../resolver/ResolverPath';
import {
    ResolverInput,
    ResolverOutput,
    ResolverHydrator,
    TagHandlerOutput,
    TagInfo,
} from '../resolver/ResolverTypes';

export abstract class TagHandler {
    constructor(
        protected readonly hydrator: ResolverHydrator,
        protected readonly provider: Provider,
        protected readonly input: ResolverInput | ResolverOutput,
    ) {}

    abstract getTags(): TagInfo[]
    abstract handle(tag: string, object: JsonObject, path: ResolverPath): Promise<TagHandlerOutput>
}
