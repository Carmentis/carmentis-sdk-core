import { JsonData, JsonObject } from '../type/valibot/json/Json';
import { Provider } from '../providers/Provider';
import { TagProcessor } from '../tags/TagProcessor';
import { ResolverPath } from './ResolverPath';
import {
    ResolverInput,
    ResolverOutput,
    ResolverHydrator,
    ResolverReport,
} from './ResolverTypes';

export class Resolver {
    private readonly provider: Provider;
    private resolverHydrator: ResolverHydrator;
    private resolvedLinksMap: Map<string, JsonData | undefined> = new Map;
    private pass = 0;
    private additionalPass = false;
    private tagProcessor: TagProcessor | undefined;

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
            nodes: this.getTagProcessor().getNodes(),
        };
    }

    static object(value: any): JsonObject | null {
        if (value === undefined || value === null || Array.isArray(value) || typeof value !== "object") {
            return null;
        }
        return value as JsonObject;
    }

    private getTagProcessor() {
        if (this.tagProcessor === undefined) {
            throw new Error(`internal error: tag processor is not defined`);
        }
        return this.tagProcessor;
    }

    private async resolve(json: ResolverInput | ResolverOutput): Promise<JsonObject> {
        this.tagProcessor = new TagProcessor(this.resolverHydrator, this.provider, json);
        this.resolvedLinksMap.clear();
        this.pass = 0;
        let res: JsonObject;

        do {
            this.pass++;
            this.additionalPass = false;
            this.getTagProcessor().clearNodes();
            res = await this.resolveRoot(json.linkedJson);
        } while(this.additionalPass);

        return res;
    }

    private async resolveRoot(root: JsonData): Promise<JsonObject> {
        const res = await this.resolveNode(root, new ResolverPath);
        const object = Resolver.object(res);
        if (object === null) {
            throw new Error(`the root did not resolve as an object`);
        }
        return object;
    }

    private async resolveNode(node: JsonData, path: ResolverPath): Promise<JsonData | undefined> {
        if (node === null) {
            return null;
        }
        if (typeof node !== "object") {
            return node;
        }
        if (Array.isArray(node)) {
            return await this.resolveArray(node, path);
        }

        const tagList = this.extractTags(node);
        let object = await this.resolveObject(node, path);

        for (const tag of tagList) {
            const tagOutput = await this.resolveTag(tag, node, path);
            if (tagOutput !== undefined) {
                const tagObject = Resolver.object(tagOutput);
                if (tagObject === null) {
                    throw new Error(`tag '${tag}' did not resolve as an object: cannot inline`);
                }
                object = { ...object, ...tagObject };
            }
        }
        return object;
    }

    private extractTags(node: JsonObject) {
        return Object.keys(node).filter((key) =>
            this.getTagProcessor().getRegisteredTag(key) !== undefined
        );
    }

    private async resolveArray(node: JsonData[], path: ResolverPath): Promise<JsonData | undefined> {
        const newNode: JsonData[] = [];

        for (let index = 0; index < node.length; index++) {
            const subPath = ResolverPath.clone(path).append(index);
            await this.mapArrayField(node, newNode, index, subPath);
        }
        return newNode;
    }

    private async resolveTag(tag: string, node: JsonObject, path: ResolverPath): Promise<JsonData | undefined> {
        const subPath = ResolverPath.clone(path).append(tag);
        const res = await this.getTagProcessor().process(tag, node[tag], subPath);
        const output = res.output;
        const resolveOutput = res.resolveOutput ?? false;

        if (res.newPassRequired) {
            this.additionalPass = true;
        }
        if (resolveOutput && output !== undefined) {
            return await this.resolveNode(output, path);
        }
        return output;
    }

    private async resolveObject(node: JsonObject, path: ResolverPath): Promise<JsonObject> {
        const newNode: JsonObject = {};

        for (const key in node) {
            if (!this.getTagProcessor().getRegisteredTag(key)) {
                const subPath = ResolverPath.clone(path).append(key);
                await this.mapObjectField(node, newNode, key, subPath);
            }
        }
        return newNode;
    }

    private async mapObjectField(sourceNode: JsonObject, targetNode: JsonObject, key: string, path: ResolverPath) {
        const value = await this.resolveNode(sourceNode[key], path);
        if (value !== undefined) {
            targetNode[key] = value;
        }
    }

    private async mapArrayField(sourceNode: JsonData[], targetNode: JsonData[], index: number, path: ResolverPath) {
        let value = await this.resolveNode(sourceNode[index], path);
        if (value === undefined) {
            value = null;
        }
        targetNode[index] = value;
    }
}
