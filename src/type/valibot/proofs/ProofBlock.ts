import * as v from 'valibot';
import { uint8array } from "../primitives";

export const ProofBlockObjectSchema = v.object({
    height: v.number(),
    vbRadixHash: uint8array(),
    tokenRadixHash: uint8array(),
    storageHash: uint8array(),
    appHash: uint8array(),
});

export type ProofBlockObject = v.InferOutput<typeof ProofBlockObjectSchema>;

export const ProofBlockSchema = v.object({
    height: v.number(),
    vbRadixHash: v.string(),
    tokenRadixHash: v.string(),
    storageHash: v.string(),
    appHash: v.string(),
});

export type ProofBlock = v.InferOutput<typeof ProofBlockSchema>;
