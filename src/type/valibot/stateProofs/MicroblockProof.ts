import * as val from 'valibot';
import { uint8array } from "../primitives";
import { VirtualBlockchainStateSchema } from "../blockchain/virtualBlockchain/virtualBlockchains";
import { ProofBlockSchema } from "./ProofBlock";

export const MicroblockProofSchema = val.object({
    block: ProofBlockSchema,
    microblock: val.object({
        virtualBlockchainId: uint8array(),
        height: val.number(),
        hash: uint8array(),
    }),
    virtualBlockchain: val.object({
        state: VirtualBlockchainStateSchema,
        merkleWitnesses: val.array(uint8array()),
        radixProof: val.array(uint8array()),
    }),
});

export type MicroblockProof = val.InferOutput<typeof MicroblockProofSchema>;
