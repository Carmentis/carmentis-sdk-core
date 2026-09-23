import * as v from 'valibot';
import { JsonData, JsonObject } from '../type/valibot/json/Json';
import { LinkResolver } from './LinkResolver';
import {
    RESOLUTION_LINK_TAG,
    OFFCHAIN_DATA_TAG,
    Policies,
    ResolverInput,
    ResolverOutput,
    ResolverConnector,
    OnchainDataSchema
} from './ResolverTypes';

export class Resolver {
    private resolverConnector: ResolverConnector;
    private policies: Policies = {};
    private resolvedLinks = new Map;

    constructor(resolverConnector: ResolverConnector) {
        this.resolverConnector = resolverConnector;
    }

    async resolveFromInput(input: ResolverInput): Promise<JsonObject> {
        await this.initializeResolution(input);
        return await this.resolveNode(input.linkedJson) as JsonObject;
    }

    async resolveFromOutput(output: ResolverOutput): Promise<JsonObject> {
        await this.initializeResolution(output);
        return await this.resolveNode(output.linkedJson) as JsonObject;
    }

    private async initializeResolution(json: ResolverInput | ResolverOutput) {
        this.policies = json.policies ?? {};
        this.resolvedLinks.clear();
    }

    private async resolveNode(node: JsonData, path = "root"): Promise<JsonData> {
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

            for (const key in node) {
                const subPath = path + `[${key}]`;
                newNode[key] = await this.resolveNode(node[key], subPath);
            }
            return newNode;
        }

        const newNode: JsonObject = {};

        for (const key in node) {
            const subPath = path + "." + key;
            switch (key) {
                case RESOLUTION_LINK_TAG: {
                    await this.processResolutionLinkTag(node[key], newNode, subPath);
                    break;
                }
                case OFFCHAIN_DATA_TAG: {
                    const onchainData = v.parse(OnchainDataSchema, node[key]);
                    const data = await this.resolverConnector.resolveOffchainData(onchainData);
                    newNode[key] = await this.resolveNode(data, subPath);
                    break;
                }
                default: {
                    newNode[key] = await this.resolveNode(node[key], subPath);
                    break;
                }
            }
        }
        return newNode;
    }

    private async processResolutionLinkTag(value: unknown, node: JsonObject, path: string) {
        const isArray = Array.isArray(value);
        const list = isArray ? value : [ value ];
        let index = 0;

        for (const link of list) {
            const subPath = path + (isArray ? `[${index}]` : '');
            if (typeof link !== 'string' || !LinkResolver.isLink(link)) {
                throw new Error(`provided entry in ${RESOLUTION_LINK_TAG} has an invalid format (path: ${subPath})`);
            }
            const res = await this.resolveLink(link, subPath);
            if (res === null || Array.isArray(res) || typeof res !== 'object') {
                throw new Error(`provided entry in ${RESOLUTION_LINK_TAG} does not resolve as an object: cannot inline (path: ${subPath})`);
            }
            for (const key in res) {
                if (node[key] !== undefined && this.policies.onDuplicateKeys === 'throw') {
                    throw new Error(`duplicate entry '${key}' while processing ${RESOLUTION_LINK_TAG} (path: ${subPath})`);
                }
                node[key] = res[key];
            }
            index++;
        }
    }

    private async resolveLink(link: string, path: string): Promise<JsonData> {
        const savedEntry = this.resolvedLinks.get(link);
        if (savedEntry !== undefined) {
            return savedEntry;
        }

        let resolved: JsonData;
        const resolvedLink = LinkResolver.resolve(link);

        if (resolvedLink.type === "mb") {
            const mbRef = resolvedLink.ref;
            const data = await this.resolverConnector.resolveMicroblock(link, mbRef);
            resolved = await this.resolveNode(data, path);
        }
        else {
            resolved = link;
        }
        this.resolvedLinks.set(link, resolved);
        return resolved;
    }
}
