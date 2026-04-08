import * as v from 'valibot';
import {accountId} from "../primitives";

/*
 { name: 'virtualBlockchainType', type: DATA.TYPE_UINT8 },
    { name: 'virtualBlockchainId',   type: DATA.TYPE_BIN256 }
 */
export const VirtualBlockchainInfoSchema = v.object({
    virtualBlockchainType: v.number(),
    virtualBlockchainId: accountId(),
})
export type VirtualBlockchainInfo = v.InferOutput<typeof VirtualBlockchainInfoSchema>;