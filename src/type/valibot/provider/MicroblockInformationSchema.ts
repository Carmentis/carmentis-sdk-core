import * as v from 'valibot'
import {MicroblockHeaderSchema} from "../blockchain/microblock/MicroblockHeader";
import {uint8array} from "../primitives";

export const MicroblockInformationSchema = v.object({
    virtualBlockchainId: uint8array(),
    virtualBlockchainType: v.number(),
    header: MicroblockHeaderSchema
})
export type MicroblockInformation = v.InferOutput<typeof MicroblockInformationSchema>;

/*
export interface MicroblockInformationSchema {
    virtualBlockchainId: Uint8Array;
    virtualBlockchainType: number;
    header: Uint8Array;
}
 */