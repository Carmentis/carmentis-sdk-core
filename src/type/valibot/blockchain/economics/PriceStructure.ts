import * as v from 'valibot';

export const PriceCategorySchema = v.object({
    pricingRate: v.number(),
    maximumNumberOfDays: v.number(),
});
export type PriceCategory = v.InferOutput<typeof PriceCategorySchema>;

export const PriceStructureSchema = v.array(PriceCategorySchema)
export type PriceStructure = v.InferOutput<typeof PriceStructureSchema>;

export const PriceBreakdownSchema = v.object({
    numberOfDays: v.number(),
    pricingRate: v.number(),
    priceInAtomics: v.number(),
});
export type PriceBreakdown = v.InferOutput<typeof PriceBreakdownSchema>;
