import * as v from 'valibot';

export const RetentionTierSchema = v.object({
    retentionRatio: v.number(),
    maximumNumberOfDays: v.number(),
    dayDivisor: v.number(),
});
export type RetentionTier = v.InferOutput<typeof RetentionTierSchema>;

export const RetentionPolicySchema = v.array(RetentionTierSchema)
export type RetentionPolicy = v.InferOutput<typeof RetentionPolicySchema>;

export const RetentionCostBreakdownSchema = v.object({
    numberOfDays: v.number(),
    retentionRatio: v.number(),
    costInGasAtoms: v.number(),
});
export type RetentionCostBreakdown = v.InferOutput<typeof RetentionCostBreakdownSchema>;
