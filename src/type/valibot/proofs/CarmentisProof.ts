import * as v from 'valibot';
import {AppLedgerProofSchema} from './AppLedgerProof';
import {AccountProofSchema} from './AccountProof';
import {MicroblockProofSchema} from './MicroblockProof';

export const ProofInfoSchema = v.object({
    version: v.number(),
    chainId: v.string(),
    description: v.string(),
    date: v.string(),
    author: v.string(),
});
export type ProofInfo = v.InferOutput<typeof ProofInfoSchema>;

const ProofSignatureCommitmentSchema = v.object({
    issuedAt: v.optional(v.string()),
    digestAlg: v.optional(v.picklist(['sha256'])),
    digestTarget: v.optional(v.picklist(['cborProof'])),
    digest: v.optional(v.string()),
});
export type ProofSignatureCommitment = v.InferOutput<typeof ProofSignatureCommitmentSchema>;

const ProofSignatureSchema = v.object({
    commitment: ProofSignatureCommitmentSchema,
    signer: v.string(),
    pubkey: v.string(),
    alg: v.picklist(['ecdsaSecp256k1', 'mlDsa65']),
    sig: v.string(),
});
export type ProofSignature = v.InferOutput<typeof ProofSignatureSchema>;

const AppLedgerPayloadSchema = v.object({ type: v.literal("appLedgerProof"), proof: AppLedgerProofSchema });
const AccountPayloadSchema = v.object({ type: v.literal("accountProof"), proof: AccountProofSchema });
const MicroblockPayloadSchema = v.object({ type: v.literal("microblockProof"), proof: MicroblockProofSchema });

// generic wrapped proof (e.g. what the proof-checker expects)
const ProofInnerSchema = v.variant('type', [
    AppLedgerPayloadSchema,
    AccountPayloadSchema,
    MicroblockPayloadSchema,
]);

const WrappedInfoSchema = v.object({ info: ProofInfoSchema });
const WrappedSignatureSchema = v.object({ signature: v.optional(ProofSignatureSchema) });

export const SignedProofPayloadSchema = v.intersect([ProofInnerSchema, WrappedInfoSchema]);
export type SignedProofPayload = v.InferOutput<typeof SignedProofPayloadSchema>;

export const WrappedProofSchema = v.intersect([SignedProofPayloadSchema, WrappedSignatureSchema]);
export type WrappedProof = v.InferOutput<typeof WrappedProofSchema>;

// app ledger wrapped proof
export const SignedAppLedgerPayloadSchema = v.intersect([AppLedgerPayloadSchema, WrappedInfoSchema]);
export type SignedAppLedgerPayload = v.InferOutput<typeof SignedAppLedgerPayloadSchema>;

export const WrappedAppLedgerProofSchema = v.intersect([SignedAppLedgerPayloadSchema, WrappedSignatureSchema]);
export type WrappedAppLedgerProof = v.InferOutput<typeof WrappedAppLedgerProofSchema>;

// account wrapped proof
export const SignedAccountPayloadSchema = v.intersect([AccountPayloadSchema, WrappedInfoSchema]);
export type SignedAccountPayload = v.InferOutput<typeof SignedAccountPayloadSchema>;

export const WrappedAccountProofSchema = v.intersect([SignedAccountPayloadSchema, WrappedSignatureSchema]);
export type WrappedAccountProof = v.InferOutput<typeof WrappedAccountProofSchema>;

// microblock wrapped proof
export const SignedMicroblockPayloadSchema = v.intersect([MicroblockPayloadSchema, WrappedInfoSchema]);
export type SignedMicroblockPayload = v.InferOutput<typeof SignedMicroblockPayloadSchema>;

export const WrappedMicroblockProofSchema = v.intersect([SignedMicroblockPayloadSchema, WrappedSignatureSchema]);
export type WrappedMicroblockProof = v.InferOutput<typeof WrappedMicroblockProofSchema>;
