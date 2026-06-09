import * as val from 'valibot';
import { uint8array } from "../primitives";
import { AccountStateSchema } from "../account/Account";
import { ProofBlockSchema } from "./ProofBlock";

export const AccountProofSchema = val.object({
    block: ProofBlockSchema,
    account: val.object({
        virtualBlockchainId: uint8array(),
        state: AccountStateSchema,
        radixProof: val.array(uint8array()),
    }),
});

export type AccountProof = val.InferOutput<typeof AccountProofSchema>;
