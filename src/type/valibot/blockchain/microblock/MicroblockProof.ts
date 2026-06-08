import * as val from 'valibot';
import { uint8array } from "../../primitives";
import { VirtualBlockchainStateSchema } from "../virtualBlockchain/virtualBlockchains";

export const MicroblockProofSchema = val.object({
    block: val.object({
        height: val.number(),
        vbRadixHash: uint8array(),
        tokenRadixHash: uint8array(),
        storageHash: uint8array(),
        appHash: uint8array(),
    }),
    microblock: val.object({
        virtualBlockchainId: uint8array(),
        height: val.number(),
        hash: uint8array(),
    }),
    virtualBlockchain: val.object({
        state: VirtualBlockchainStateSchema,
        // the root hash of the Merkle tree must match the value defined in the state
        merkleWitnesses: val.array(uint8array()),
        // radix key = virtualBlockchainId, radix value = hash of the state
        // the radix
        radixProof: val.array(uint8array()),
    }),
});

export type MicroblockProof = val.InferOutput<typeof MicroblockProofSchema>;
