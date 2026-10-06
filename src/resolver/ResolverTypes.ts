import * as v from 'valibot';
import { JsonData, JsonObject } from '../type/valibot/json/Json';

export const RESOLUTION_LINK_TAG = "__resolution_link__";
export const OFFCHAIN_DATA_TAG = "__offchain_data__";

export interface Policies {
    onResolutionFailure?: 'ignore' | 'throw'
    onCyclicResolution?: 'ignore' | 'throw'
    onDuplicateKeys?: 'ignore' | 'throw'
}

export interface ResolverInput {
    linkedJson: JsonObject
    policies?: Policies
}

export interface ResolverOutput {
    linkedJson: JsonObject
    policies?: Policies
    resolvedJson: JsonObject
    offchainData: Record<string, JsonObject>
    proofs: Record<string, JsonObject>
}

export interface VbRef {
    id: string;
    type?: number;
}
 
export interface MbRef {
    vb?: VbRef;
    hash?: string;
    height?: number;
}

export interface SectRef {
    mb: MbRef;
    index?: number;
    name?: string;
}

export type ResolvedPath =
    | { type: "vb"; ref: VbRef }
    | { type: "mb"; ref: MbRef }
    | { type: "section"; ref: SectRef };

export const OnchainDataSchema = v.object({
    digest: v.string(),
    encoding: v.string(),
    digestAlg: v.string(),
});

export type OnchainData = v.InferOutput<typeof OnchainDataSchema>;

export interface OffchainRecord {
    onchainData: OnchainData
    offchainData: JsonObject
}

export interface ResolverHydrator {
    hydrateMicroblock(link: string, mbRef: MbRef): Promise<JsonData>;
    hydrateOffchainData(onchainData: OnchainData): Promise<JsonData>;
}
