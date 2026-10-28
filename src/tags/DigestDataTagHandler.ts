import * as v from "valibot";
import { TAG } from '../type/tags/tags';
import { TagHandler } from "./TagHandler";
import { JsonObject } from '../type/valibot/json/Json';
import { DigestDataHandler } from '../records/DigestData';
import { DigestSchema } from '../resolver/ResolverTypes';
import { DigestDataNode } from '../type/valibot/resolutionNodes/ResolutionNodes';
import { ResolverPath } from '../resolver/ResolverPath';

export class DigestDataTagHandler extends TagHandler {
    private digestDataMap: Map<string, JsonObject>;

    constructor(...args: ConstructorParameters<typeof TagHandler>) {
        super(...args);
        this.digestDataMap = new Map(Object.entries(this.input.digestData ?? {}));
    }

    getTags() {
        return [ { name: TAG.DIGEST }, { name: TAG.DIGEST_DATA, noOutput: true } ];
    }

    async handle(tag: string, object: any, path: ResolverPath) {
        switch (tag) {
            case TAG.DIGEST: {
                return await this.processDigestTag(object, path);
            }
            case TAG.DIGEST_DATA: {
                return await this.processDigestDataTag(object);
            }
            default: {
                throw new Error(`digest data handler called with unrecognized tag '${tag}'`);
            }
        }
    }

    private async processDigestTag(value: unknown, path: ResolverPath) {
        const onchainData = v.parse(DigestSchema, value);
        const digestData = this.digestDataMap.get(onchainData.digest);

        if (digestData !== undefined) {
            const digestNode = DigestDataHandler.jsonFromDigestData(onchainData, digestData);
            const node: DigestDataNode = {
                type: "digestData",
                digest: onchainData.digest,
                valid: true,
            };
            return {
                output: digestNode,
                node,
                resolveOutput: true
            };
        }
        else {
            return { node: null, resolveOutput: false };
        }
    }

    private async processDigestDataTag(value: unknown) {
        let newPassRequired = false;

        if (value !== null && !Array.isArray(value) && typeof value === "object") {
            for (const [ digest, data ] of Object.entries(value)) {
                if (!/^[a-f\d]{64}$/i.test(digest)) {
                    continue;
                }
                const known = this.digestDataMap.has(digest);
                if (!known) {
                    // new digest data has been found: a new resolution pass is required because the
                    // corresponding digest reference(s) may be located anywhere else in the tree
                    newPassRequired = true;
                    this.digestDataMap.set(digest, data);
                }
            }
        }
        return { node: null, resolveOutput: false, newPassRequired };
    }
}
