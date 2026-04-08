import * as v from 'valibot';
import {VirtualBlockchainStateSchema} from "../blockchain/virtualBlockchain/virtualBlockchains";
import {uint8array} from "../primitives";


export const VirtualBlockchainStatusSchema = v.object({
    state: VirtualBlockchainStateSchema,
    microblockHashes: v.array(uint8array()),
})
export type VirtualBlockchainStatus = v.InferOutput<typeof VirtualBlockchainStatusSchema>;