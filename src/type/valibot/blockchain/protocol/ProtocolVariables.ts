import * as v from 'valibot';
import {RetentionPolicySchema} from "../economics/RetentionPolicy";
import {positiveInt, nonNegativeInt, naturalInt} from "../../primitives";

export const ProtocolVariablesSchema = v.object({
    protocolVersionName: v.string(),
    protocolVersion: positiveInt(),
    feesCalculationVersion: positiveInt(),
    fixedGasCost: naturalInt(),
    secp256k1SignatureGasCost: naturalInt(),
    mlDsa65SignatureGasCost: naturalInt(),
    pkmsSecp256k1SignatureGasCost: naturalInt(),
    globalStateUpdaterVersion: positiveInt(),
    applicationLedgerInternalStateUpdaterVersion: positiveInt(),
    applicationInternalStateUpdaterVersion: positiveInt(),
    organizationInternalStateUpdaterVersion: positiveInt(),
    validatorNodeInternalStateUpdaterVersion: positiveInt(),
    accountInternalStateUpdaterVersion: positiveInt(),
    protocolInternalStateUpdaterVersion: positiveInt(),
    minimumNodeStakingAmountInAtomics: positiveInt(),
    maximumNodeStakingAmountInAtomics: positiveInt(),
    unstakingDelayInDays: naturalInt(),
    maxBlockSizeInBytes: positiveInt(),
    retentionPolicy: RetentionPolicySchema,
    abciVersion: positiveInt(),
    maxMicroblocksPerBlock: positiveInt(),
});
export type ProtocolVariables = v.InferOutput<typeof ProtocolVariablesSchema>