import * as v from 'valibot'

export const SignatureTagSchema = v.pipe(
    v.object({
        metadata: v.object({
            title: v.string(),
            message: v.string(),
            origin: v.string(),
            requestedAt: v.string(),
            signedAt: v.string(),

            notValidBefore: v.optional(v.string()),
            notValidAfter: v.optional(v.string()),

            allowOnChain: v.optional(v.boolean()),
            organizationId: v.optional(v.string()),
            applicationId: v.optional(v.string()),
            applicationLedgerId: v.optional(v.string()),
            latestMicroblockHash: v.optional(v.string()),
        }),

        // The signed data is either embedded in the tag, as `data`, or referenced by `path`.
        data: v.optional(v.unknown()),
        path: v.optional(v.string()),

        pk: v.string(),
        signature: v.string(),
    }),

    v.check(
        (tag) => (tag.data !== undefined) !== (tag.path !== undefined),
        "a signature tag has to hold either the signed data or the path to it, not both",
    ),
)

export type SignatureTag = v.InferOutput<typeof SignatureTagSchema>
