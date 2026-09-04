import * as v from 'valibot'

export const SignatureTagSchema = v.object({
    metadata: v.object({
        title: v.string(),
        message: v.string(),
        origin: v.string(),
        requestedAt: v.optional(v.string()),
        signedAt: v.string(),

        notValidBefore: v.optional(v.string()),
        notValidAfter: v.optional(v.string()),

        allowOnChain: v.optional(v.boolean()),
        organizationId: v.optional(v.string()),
        applicationId: v.optional(v.string()),
        applicationLedgerId: v.optional(v.string()),
        latestMicroblockHash: v.optional(v.string()),
    }),

    data: v.variant('type', [
        v.object({
            type: v.literal('embedded'),
            data: v.unknown(),
        }),

        v.object({
            type: v.literal('referenced'),
            path: v.string(),
        }),
    ]),

    pk: v.string(),
    signature: v.string(),
})

export type SignatureTag = v.InferOutput<typeof SignatureTagSchema>