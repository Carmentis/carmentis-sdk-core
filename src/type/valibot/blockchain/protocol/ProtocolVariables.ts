import * as v from 'valibot';
import {PriceStructureSchema} from "../economics/PriceStructure";

export const ProtocolVariablesSchema = v.object({
    protocolVersionName: v.string(),
    protocolVersion: v.number(),
    feesCalculationVersion: v.number(),
    globalStateUpdaterVersion: v.number(),
    applicationLedgerInternalStateUpdaterVersion: v.number(),
    applicationInternalStateUpdaterVersion: v.number(),
    organizationInternalStateUpdaterVersion: v.number(),
    validatorNodeInternalStateUpdaterVersion: v.number(),
    accountInternalStateUpdaterVersion: v.number(),
    protocolInternalStateUpdaterVersion: v.number(),
    minimumNodeStakingAmountInAtomics: v.number(),
    maximumNodeStakingAmountInAtomics: v.number(),
    unstakingDelayInDays: v.number(),
    maxBlockSizeInBytes: v.number(),
    priceStructure: PriceStructureSchema,
    abciVersion: v.number(),
});
export type ProtocolVariables = v.InferOutput<typeof ProtocolVariablesSchema>