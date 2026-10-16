import * as v from 'valibot';
import { JsonData, JsonObject } from '../type/valibot/json/Json';
import { ResolutionProofProofs } from '../type/valibot/proofs/ResolutionProof';

export interface Policies {
    onResolutionFailure?: 'ignore' | 'throw'
    onCyclicResolution?: 'ignore' | 'throw'
    onDuplicateKeys?: 'ignore' | 'throw'
}

export interface ResolverInput {
    linkedJson: JsonObject
    policies?: Policies
    digestData?: Record<string, JsonObject>
}

export interface ResolverOutput {
    linkedJson: JsonObject
    policies?: Policies
    resolvedJson: JsonObject
    digestData: Record<string, JsonObject>
    proofs: ResolutionProofProofs
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

export const DigestSchema = v.object({
    digest: v.string(),
    type: v.picklist(["json"]),
    encoding: v.string(),
    digestAlg: v.string(),
});

export type Digest = v.InferOutput<typeof DigestSchema>;

export interface DigestRecord {
    digest: Digest
    digestData: JsonObject
}

export interface ResolverHydrator {
    hydrateMicroblock(link: string, mbRef: MbRef): Promise<JsonData | undefined>;
}

export interface Unresolved {
    path: string
    type: string
    cause: string
}

export interface ResolverReport {
    passes: number
    unresolved: Unresolved[]
}
