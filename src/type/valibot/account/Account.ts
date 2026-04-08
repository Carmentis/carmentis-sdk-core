import * as v from "valibot";
import {bin256, uint8array} from "../primitives";

export const LOCK_TYPE_COUNT = 3;
export enum LockType {
    Escrow = 0,
    Vesting = 1,
    NodeStaking = 2
}

// Escrow schemas
export const EscrowParametersSchema = v.object({
    escrowIdentifier: uint8array(),
    fundEmitterAccountId: uint8array(),
    transferAuthorizerAccountId: uint8array(),
    startTimestamp: v.number(),
    durationDays: v.number(),
});
export type EscrowParameters = v.InferOutput<typeof EscrowParametersSchema>;

export const EscrowLockSchema = v.object({
    type: v.literal(LockType.Escrow),
    lockedAmountInAtomics: v.number(),
    parameters: EscrowParametersSchema
});
export type EscrowLock = v.InferOutput<typeof EscrowLockSchema>;

// Vesting schemas
export const VestingParametersSchema = v.object({
    initialVestedAmountInAtomics: v.number(),
    cliffStartTimestamp: v.number(),
    cliffDurationDays: v.number(),
    vestingDurationDays: v.number()
});
export type VestingParameters = v.InferOutput<typeof VestingParametersSchema>;

export const VestingLockSchema = v.object({
    type: v.literal(LockType.Vesting),
    lockedAmountInAtomics: v.number(),
    parameters: VestingParametersSchema
});
export type VestingLock = v.InferOutput<typeof VestingLockSchema>;

// Staking schemas
export const NodeStakingParametersSchema = v.object({
    validatorNodeId: uint8array(),
    plannedUnlockAmountInAtomics: v.number(),
    plannedUnlockTimestamp: v.number(),
    slashed: v.boolean(),
    plannedSlashingAmountInAtomics: v.number(),
    plannedSlashingTimestamp: v.number()
});
export type NodeStakingParameters = v.InferOutput<typeof NodeStakingParametersSchema>;

export const NodeStakingLockSchema = v.object({
    type: v.literal(LockType.NodeStaking),
    lockedAmountInAtomics: v.number(),
    parameters: NodeStakingParametersSchema
});
export type NodeStakingLock = v.InferOutput<typeof NodeStakingLockSchema>;

// Lock variant schema
export const LockSchema = v.variant('type', [
    EscrowLockSchema,
    VestingLockSchema,
    NodeStakingLockSchema
]);
export type Lock = v.InferOutput<typeof LockSchema>;

// Account breakdown schema
export const AccountBreakdownSchema = v.object({
    balance: v.number(),
    escrowed: v.number(),
    vested: v.number(),
    releasable: v.number(),
    staked: v.number(),
    stakeable: v.number(),
    locked: v.number(),
    spendable: v.number()
});
export type AccountBreakdown = v.InferOutput<typeof AccountBreakdownSchema>;

export const AccountStateSchema = v.object({
    height: v.number(),
    balance: v.number(),
    lastHistoryHash: uint8array(),
    locks: v.array(LockSchema),
})
export type AccountState = v.InferOutput<typeof AccountStateSchema>;

export const AccountInformationSchema = v.object({
    type: v.number(),
    exists: v.boolean(),
    state: AccountStateSchema
})
export type AccountInformation = v.InferOutput<typeof AccountInformationSchema>;

export const AccountHistoryEntrySchema = v.object({
    height: v.pipe(v.number(), v.integer(), v.minValue(0)),
    previousHistoryHash: bin256(),
    type: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(255)),
    timestamp: v.pipe(v.number(), v.integer(), v.minValue(0)),
    linkedAccount: bin256(),
    amount: v.pipe(v.number(), v.integer(), v.minValue(0)),
    chainReference: uint8array(),
});
export type AccountHistoryEntry = v.InferOutput<typeof AccountHistoryEntrySchema>;

export const AccountHistorySchema = v.array(AccountHistoryEntrySchema);
export type AccountHistory = v.InferOutput<typeof AccountHistorySchema>;

export const RequestedAccountUpdateSchema = v.object({
    accountHash: uint8array(),
    lastKnownHistoryHash: uint8array(),
});
export type RequestedAccountUpdate = v.InferOutput<typeof RequestedAccountUpdateSchema>;

export const AccountUpdateSchema = v.object({
    accountHash: uint8array(),
    currentState: AccountStateSchema,
    historyUpdate: AccountHistorySchema,
});
export type AccountUpdate = v.InferOutput<typeof AccountUpdateSchema>;
