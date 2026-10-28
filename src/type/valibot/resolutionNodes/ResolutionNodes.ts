import * as v from 'valibot';

const MicroblockNodeSchema = v.object({
    type: v.literal("microblock"),
    hash: v.string(),
    vbId: v.string(),
    height: v.number(),
    found: v.boolean(),
});
export type MicroblockNode = v.InferOutput<typeof MicroblockNodeSchema>;

const SectionNodeSchema = v.object({
    type: v.literal("section"),
    microblockHash: v.string(),
    vbId: v.string(),
    height: v.number(),
    index: v.number(),
    found: v.boolean(),
});
export type SectionNode = v.InferOutput<typeof SectionNodeSchema>;

const SignatureNodeSchema = v.object({
    type: v.literal("signature"),
    publicKey: v.string(),
    valid: v.boolean(),
});
export type SignatureNode = v.InferOutput<typeof SignatureNodeSchema>;

const DigestDataNodeSchema = v.object({
    type: v.literal("digestData"),
    digest: v.string(),
    valid: v.boolean(),
});
export type DigestDataNode = v.InferOutput<typeof DigestDataNodeSchema>;

const CertificateNodeSchema = v.object({
    type: v.literal("certificate"),
    valid: v.boolean(),
});
export type CertificateNode = v.InferOutput<typeof CertificateNodeSchema>;

const VcNodeSchema = v.object({
    type: v.literal("vc"),
    valid: v.boolean(),
});
export type VcNode = v.InferOutput<typeof VcNodeSchema>;

const VpNodeSchema = v.object({
    type: v.literal("vp"),
    valid: v.boolean(),
});
export type VpNode = v.InferOutput<typeof VpNodeSchema>;

const ResolutionNodeSchema = v.variant(
    "type",
    [
        MicroblockNodeSchema,
        SectionNodeSchema,
        SignatureNodeSchema,
        DigestDataNodeSchema,
        CertificateNodeSchema,
        VcNodeSchema,
        VpNodeSchema,
    ]
);
export type ResolutionNode = v.InferOutput<typeof ResolutionNodeSchema>;
