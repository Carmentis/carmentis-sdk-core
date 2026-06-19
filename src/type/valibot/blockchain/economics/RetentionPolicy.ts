import * as v from 'valibot';

export const RetentionTierSchema = v.object({
    // retentionRatio is expressed as an integer in per thousand
    retentionRatio: v.number(),
    // maximum number of days for which this ratio applies
    maximumNumberOfDays: v.number(),
    // the day divisor is typically 366, except for the 'infinite' range where it's set to 1
    // (so that the 'infinite storage' pricing applies when the maximum standard retention time
    // is exceeded by just one day)
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
