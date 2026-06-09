import * as val from 'valibot';
import { uint8array } from "../primitives";

export const ProofBlockSchema = val.object({
    height: val.number(),
    vbRadixHash: uint8array(),
    tokenRadixHash: uint8array(),
    storageHash: uint8array(),
    appHash: uint8array(),
});

export type ProofBlock = val.InferOutput<typeof ProofBlockSchema>;
