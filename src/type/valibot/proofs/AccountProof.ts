import * as v from 'valibot';
import { uint8array } from "../primitives";
import { AccountStateSchema } from "../account/Account";
import { ProofBlockObjectSchema, ProofBlockSchema } from "./ProofBlock";

export const AccountProofObjectSchema = v.object({
    block: ProofBlockObjectSchema,
    account: v.object({
        virtualBlockchainId: uint8array(),
        state: AccountStateSchema,
        radixProof: v.array(uint8array()),
    }),
});

export type AccountProofObject = v.InferOutput<typeof AccountProofObjectSchema>;

export const AccountProofEntrySchema = v.object({
    block: ProofBlockSchema,
    account: v.object({
        virtualBlockchainId: v.string(),
        serializedState: v.string(),
        radixProof: v.array(v.string()),
    }),
});

export type AccountProofEntry = v.InferOutput<typeof AccountProofEntrySchema>;

export const AccountProofSchema = v.object({
    accounts: v.array(AccountProofEntrySchema),
});

export type AccountProof = v.InferOutput<typeof AccountProofSchema>;
