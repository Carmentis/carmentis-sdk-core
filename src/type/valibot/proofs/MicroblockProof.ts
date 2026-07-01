import * as v from 'valibot';
import { uint8array } from "../primitives";
import { VirtualBlockchainStateSchema } from "../blockchain/virtualBlockchain/virtualBlockchains";
import { ProofBlockObjectSchema, ProofBlockSchema } from "./ProofBlock";

export const MicroblockProofObjectSchema = v.object({
    block: ProofBlockObjectSchema,
    microblock: v.object({
        virtualBlockchainId: uint8array(),
        height: v.number(),
        hash: uint8array(),
    }),
    virtualBlockchain: v.object({
        state: VirtualBlockchainStateSchema,
        merkleWitnesses: v.array(uint8array()),
        radixProof: v.array(uint8array()),
    }),
});

export type MicroblockProofObject = v.InferOutput<typeof MicroblockProofObjectSchema>;

export const MicroblockProofEntrySchema = v.object({
    block: ProofBlockSchema,
    microblock: v.object({
        virtualBlockchainId: v.string(),
        height: v.number(),
        hash: v.string(),
    }),
    virtualBlockchain: v.object({
        serializedState: v.string(),
        merkleWitnesses: v.array(v.string()),
        radixProof: v.array(v.string()),
    }),
});

export type MicroblockProofEntry = v.InferOutput<typeof MicroblockProofEntrySchema>;

export const MicroblockProofSchema = v.object({
    microblocks: v.array(MicroblockProofEntrySchema),
});

export type MicroblockProof = v.InferOutput<typeof MicroblockProofSchema>;
