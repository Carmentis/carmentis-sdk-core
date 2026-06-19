import * as v from 'valibot';
import {RetentionPolicySchema} from "../economics/RetentionPolicy";
import {positiveInt} from "../../primitives";

export const ProtocolVariablesSchema = v.object({
    protocolVersionName: v.string(),
    protocolVersion: positiveInt(),
    feesCalculationVersion: positiveInt(),
    fixedGasCost: positiveInt(),
    secp256k1SignatureGasCost: positiveInt(),
    mlDsa65SignatureGasCost: positiveInt(),
    pkmsSecp256k1SignatureGasCost: positiveInt(),
    globalStateUpdaterVersion: positiveInt(),
    applicationLedgerInternalStateUpdaterVersion: positiveInt(),
    applicationInternalStateUpdaterVersion: positiveInt(),
    organizationInternalStateUpdaterVersion: positiveInt(),
    validatorNodeInternalStateUpdaterVersion: positiveInt(),
    accountInternalStateUpdaterVersion: positiveInt(),
    protocolInternalStateUpdaterVersion: positiveInt(),
    minimumNodeStakingAmountInAtomics: positiveInt(),
    maximumNodeStakingAmountInAtomics: positiveInt(),
    unstakingDelayInDays: positiveInt(),
    maxBlockSizeInBytes: positiveInt(),
    retentionPolicy: RetentionPolicySchema,
    abciVersion: positiveInt(),
    maxMicroblocksPerBlock: positiveInt(),
});
export type ProtocolVariables = v.InferOutput<typeof ProtocolVariablesSchema>