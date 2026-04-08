import * as v from 'valibot';

export const RecordActorSchema = v.object({
    name: v.string()
});

export const RecordChannelSchema = v.object({
    name: v.string(),
    public: v.boolean()
});

export const RecordChannelAssignationSchema = v.object({
    fieldPath: v.string(),
    channelName: v.string()
});

export const RecordActorAssignationSchema = v.object({
    actorName: v.string(),
    channelName: v.string()
});

export const RecordMaskedPartSchema = v.object({
    position: v.number(),
    length: v.number(),
    replacementString: v.string()
});

export const RecordMaskableFieldSchema = v.object({
    fieldPath: v.string(),
    maskedParts: v.array(RecordMaskedPartSchema)
});

export const RecordHashableFieldSchema = v.object({
    fieldPath: v.string()
});

export const AppLedgerMicroblockBuildRequestSchema = v.object({
    /**
     * Links the record to an existing transactional flow. When omitted, the record is put in a new virtual blockchain.
     * Is expected to be hex-encoded.
     */
    virtualBlockchainId: v.optional(v.string()),
    data: v.any(),
    actors: v.optional(v.array(RecordActorSchema)),
    channels: v.optional(v.array(RecordChannelSchema)),
    channelAssignations: v.optional(v.array(RecordChannelAssignationSchema)),
    actorAssignations: v.optional(v.array(RecordActorAssignationSchema)),
    hashableFields: v.optional(v.array(RecordHashableFieldSchema)),
    maskableFields: v.optional(v.array(RecordMaskableFieldSchema)),
    author: v.string(),
    endorser: v.optional(v.string()),
    approvalMessage: v.optional(v.string())
});

export type RecordActor = v.InferOutput<typeof RecordActorSchema>;
export type RecordChannel = v.InferOutput<typeof RecordChannelSchema>;
export type RecordChannelAssignation = v.InferOutput<typeof RecordChannelAssignationSchema>;
export type RecordActorAssignation = v.InferOutput<typeof RecordActorAssignationSchema>;
export type RecordMaskedPart = v.InferOutput<typeof RecordMaskedPartSchema>;
export type RecordMaskableField = v.InferOutput<typeof RecordMaskableFieldSchema>;
export type RecordHashableField = v.InferOutput<typeof RecordHashableFieldSchema>;
export type AppLedgerMicroblockBuildRequest<DataType = any> = v.InferOutput<typeof AppLedgerMicroblockBuildRequestSchema>;

export class AppLedgerMicroblockBuildRequestValidation {
    static validate(data: unknown): AppLedgerMicroblockBuildRequest {
        return v.parse(AppLedgerMicroblockBuildRequestSchema, data);
    }

    static safeParse(data: unknown): v.SafeParseResult<typeof AppLedgerMicroblockBuildRequestSchema> {
        return v.safeParse(AppLedgerMicroblockBuildRequestSchema, data);
    }

    static is(data: unknown): data is AppLedgerMicroblockBuildRequest {
        return v.is(AppLedgerMicroblockBuildRequestSchema, data);
    }
}