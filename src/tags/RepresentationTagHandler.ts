import * as v from "valibot";
import { TAG } from '../type/tags/tags';
import { TagHandler } from "./TagHandler";
import { ResolverPath } from '../resolver/ResolverPath';
import { RepresentationSchema, Representation } from '../type/RepresentationSchema';

export class RepresentationTagHandler extends TagHandler {
    private readonly representations: Map<string, Representation>;

    constructor(...args: ConstructorParameters<typeof TagHandler>) {
        super(...args);
        this.representations = new Map;
    }

    getTags() {
        return [ { name: TAG.REPRESENTATION, noOutput: true } ];
    }

    getRepresentations() {
        return this.representations;
    }

    async handle(tag: string, object: any, path: ResolverPath) {
        const representation = v.parse(RepresentationSchema, object);
        this.representations.set(
            path.serialize(),
            representation,
        )
        return { node: null };
    }
}
