import * as v from "valibot";
import { TAG } from '../type/tags/tags';
import { TagHandler } from "./TagHandler";
import { ResolverPath } from '../resolver/ResolverPath';

export class RepresentationTagHandler extends TagHandler {
    constructor(...args: ConstructorParameters<typeof TagHandler>) {
        super(...args);
    }

    getTags() {
        return [ { name: TAG.REPRESENTATION, noOutput: true } ];
    }

    async handle(tag: string, object: any, path: ResolverPath) {
        return { node: null };
    }
}
