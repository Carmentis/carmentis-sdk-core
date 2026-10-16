import * as v from 'valibot';
import { JsonData, JsonObject } from '../type/valibot/json/Json';
import { LinkResolver } from './LinkResolver';
import { DigestDataHandler } from '../records/DigestData';
import { Provider } from '../providers/Provider';
import { SectionType } from '../type/valibot/blockchain/section/SectionType';
import { TAG } from '../type/tags/tags';
import { TaggedObjectTransformer } from '../tags/TaggedObjectTransformer';
import {
    Policies,
    ResolverInput,
    ResolverOutput,
    ResolverHydrator,
    DigestSchema,
    Unresolved,
    ResolverReport,
    MbRef,
    SectRef,
} from './ResolverTypes';

export class Resolver {
    private readonly provider: Provider;
    private resolverHydrator: ResolverHydrator;
    private policies: Policies = {};
    private unresolved: Unresolved[] = [];
    private resolvedLinksMap: Map<string, JsonData | undefined> = new Map;
    private digestDataMap: Map<string, JsonObject> = new Map;
    private pass = 0;
    private additionalPass = false;

    constructor(provider: Provider, resolverHydrator: ResolverHydrator) {
        this.provider = provider;
        this.resolverHydrator = resolverHydrator;
    }

    async resolveFromInput(input: ResolverInput): Promise<JsonObject> {
        return await this.resolve(input);
    }

    async resolveFromOutput(output: ResolverOutput): Promise<JsonObject> {
        return await this.resolve(output);
    }

    getReport(): ResolverReport {
        return {
            passes: this.pass,
            unresolved: this.unresolved,
        };
    }

    private async resolve(json: ResolverInput | ResolverOutput): Promise<JsonObject> {
        this.policies = json.policies ?? {};
        this.resolvedLinksMap.clear();
        this.digestDataMap = new Map(Object.entries(json.digestData ?? {}));
        this.pass = 0;
        let res: JsonObject;

        do {
            this.pass++;
            this.additionalPass = false;
            this.unresolved.length = 0;
            res = await this.resolveRoot(json.linkedJson);
        } while(this.additionalPass);

        return res;
    }

    private async resolveRoot(root: JsonData): Promise<JsonObject> {
        const res = await this.resolveNode(root, "root");
        if (res === undefined || res === null || typeof res !== "object") {
            throw new Error(`the root did not resolve as an object`);
        }
        return res as JsonObject;
    }

    private async resolveNode(node: JsonData, path: string): Promise<JsonData | undefined> {
        if (node === null) {
            return null;
        }
        if (typeof node === 'string' && LinkResolver.isLink(node)) {
            return await this.resolveLink(node, path);
        }
        if (typeof node !== "object") {
            return node;
        }
        if (Array.isArray(node)) {
            const newNode: JsonData[] = [];

            for (let index = 0; index < node.length; index++) {
                const subPath = path + `[${index}]`;
                await this.mapArrayField(node, newNode, index, subPath);
            }
            return newNode;
        }

        const newNode: JsonObject = {};

        for (const key in node) {
            const subPath = path + "." + key;
            switch (key) {
                case TAG.RESOLUTION_LINK: {
                    await this.processResolutionLinkTag(node[key], newNode, subPath);
                    break;
                }
                case TAG.DIGEST: {
                    await this.processDigestTag(node[key], newNode, subPath);
                    break;
                }
                case TAG.DIGEST_DATA: {
                    await this.processDigestDataTag(node[key]);
                    break;
                }
                default: {
                    if (TaggedObjectTransformer.isKnownTag(key)) {
                        const transformedObject = await TaggedObjectTransformer.process(key, node[key]);
                        if (transformedObject !== null) {
                            for (const [key, value] of Object.entries(transformedObject)) {
                                newNode[key] = value as JsonData;
                            }
                        }
                    }
                    else {
                        await this.mapObjectField(node, newNode, key, subPath);
                    }
                    break;
                }
            }
        }
        return newNode;
    }

    private async mapObjectField(sourceNode: JsonObject, targetNode: JsonObject, key: string, path: string) {
        const value = await this.resolveNode(sourceNode[key], path);
        if (value !== undefined) {
            targetNode[key] = value;
        }
    }

    private async mapArrayField(sourceNode: JsonData[], targetNode: JsonData[], index: number, path: string) {
        let value = await this.resolveNode(sourceNode[index], path);
        if (value === undefined) {
            value = null;
        }
        targetNode[index] = value;
    }

    private async processResolutionLinkTag(value: unknown, node: JsonObject, path: string) {
        const isArray = Array.isArray(value);
        const list = isArray ? value : [ value ];
        let index = 0;

        for (const link of list) {
            const subPath = path + (isArray ? `[${index}]` : '');
            if (typeof link !== 'string' || !LinkResolver.isLink(link)) {
                throw new Error(`provided entry in ${TAG.RESOLUTION_LINK} has an invalid format (path: ${subPath})`);
            }
            const linkNode = await this.resolveLink(link, subPath);
            if (linkNode === undefined) {
                this.unresolved.push({
                    path,
                    type: "link",
                    cause: "unable to resolve link",
                });
                continue;
            }
            if (linkNode === null || Array.isArray(linkNode) || typeof linkNode !== 'object') {
                throw new Error(`provided entry in ${TAG.RESOLUTION_LINK} does not resolve as an object: cannot inline (path: ${subPath})`);
            }
            for (const key in linkNode) {
                if (node[key] !== undefined && this.policies.onDuplicateKeys === 'throw') {
                    throw new Error(`duplicate entry '${key}' while processing ${TAG.RESOLUTION_LINK} (path: ${subPath})`);
                }
                await this.mapObjectField(linkNode, node, key, subPath);
            }
            index++;
        }
    }

    private async resolveLink(link: string, path: string): Promise<JsonData | undefined> {
        const resolvedLink = LinkResolver.resolve(link);

        switch (resolvedLink.type) {
            case "mb": {
                return await this.resolveMicroblock(link, path, resolvedLink.ref);
            }
            case "section": {
                return await this.resolveSection(link, path, resolvedLink.ref);
            }
        }
        return undefined;
    }

    private async resolveMicroblock(link: string, path: string, mbRef: MbRef) {
        let data: JsonData | undefined;
        if (this.resolvedLinksMap.has(link)) {
            data = this.resolvedLinksMap.get(link);
        }
        else {
            data = await this.resolverHydrator.hydrateMicroblock(link, mbRef);
            this.resolvedLinksMap.set(link, data);
        }
        if (data !== undefined) {
            return await this.resolveNode(data, path);
        }
        return undefined;
    }

    private async resolveSection(link: string, path: string, sectRef: SectRef) {
        const section = await LinkResolver.getSection(this.provider, sectRef);
        if (section.type == SectionType.CUSTOM) {
            const tag = Object.keys(section).find((key) => /^__/.test(key));
            if (tag !== undefined) {
                const transformedObject = await TaggedObjectTransformer.process(tag, section[tag]);
                if (transformedObject !== undefined) {
                    return transformedObject as JsonObject;
                }
            }
        }
        return section as JsonObject;
    }

    private async processDigestTag(value: unknown, node: JsonObject, path: string) {
        const onchainData = v.parse(DigestSchema, value);
        const digestData = this.digestDataMap.get(onchainData.digest);

        if (digestData !== undefined) {
            const digestNode = DigestDataHandler.jsonFromDigestData(onchainData, digestData);
            for (const key of Object.keys(digestNode)) {
                await this.mapObjectField(digestNode, node, key, path);
            }
        }
        else {
            this.unresolved.push({
                path,
                type: "digest data",
                cause: "digest data was neither provided in the JSON file nor found on-chain",
            });
        }
    }

    private async processDigestDataTag(value: unknown) {
        if (value !== null && !Array.isArray(value) && typeof value === "object") {
            for (const [ digest, data ] of Object.entries(value)) {
                if (!/^[a-f\d]{64}$/i.test(digest)) {
                    continue;
                }
                const known = this.digestDataMap.has(digest);
                if (!known) {
                    // new digest data has been found: a new resolution pass is required because
                    // the corresponding digest reference(s) may be located anywhere in the tree
                    this.additionalPass = true;
                    this.digestDataMap.set(digest, data);
                }
            }
        }
    }
}
