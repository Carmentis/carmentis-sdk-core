import * as v from 'valibot';

// Request enum
export enum WalletInteractiveAnchoringRequestType {
    APPROVAL_HANDSHAKE = 'WALLET_OPERATOR_REQUEST_APPROVAL_HANDSHAKE',
    ACTOR_KEY = 'WALLET_OPERATOR_REQUEST_ACTOR_KEY',
    APPROVAL_SIGNATURE = 'WALLET_OPERATOR_REQUEST_APPROVAL_SIGNATURE'
}

// Response enum
export enum WalletInteractiveAnchoringResponseType {
    ERROR = 'WALLET_OPERATOR_RESPONSE_ERROR',
    ACTOR_KEY_REQUIRED = 'WALLET_OPERATOR_RESPONSE_ACTOR_KEY_REQUIRED',
    APPROVAL_DATA = 'WALLET_OPERATOR_RESPONSE_APPROVAL_DATA',
    APPROVAL_SIGNATURE = 'WALLET_OPERATOR_RESPONSE_APPROVAL_SIGNATURE'
}

// Request Schemas
export const WalletInteractiveAnchoringRequestApprovalHandshakeSchema = v.object({
    type: v.literal(WalletInteractiveAnchoringRequestType.APPROVAL_HANDSHAKE),
    anchorRequestId: v.string()
});

export const WalletInteractiveAnchoringRequestActorKeySchema = v.object({
    type: v.literal(WalletInteractiveAnchoringRequestType.ACTOR_KEY),
    anchorRequestId: v.string(),
    actorSignaturePublicKey: v.string(),
    actorPkePublicKey: v.string()
});

export const WalletInteractiveAnchoringRequestApprovalSignatureSchema = v.object({
    type: v.literal(WalletInteractiveAnchoringRequestType.APPROVAL_SIGNATURE),
    anchorRequestId: v.string(),
    b64Signature: v.string()
});

export const WalletInteractiveAnchoringRequestSchema = v.variant("type", [
    WalletInteractiveAnchoringRequestApprovalHandshakeSchema,
    WalletInteractiveAnchoringRequestActorKeySchema,
    WalletInteractiveAnchoringRequestApprovalSignatureSchema
]);

// Response Schemas
export const WalletInteractiveAnchoringResponseErrorSchema = v.object({
    type: v.literal(WalletInteractiveAnchoringResponseType.ERROR),
    errorMessage: v.optional(v.string(), "")
});

export const WalletInteractiveAnchoringResponseActorKeyRequiredSchema = v.object({
    type: v.literal(WalletInteractiveAnchoringResponseType.ACTOR_KEY_REQUIRED),
    b64GenesisSeed: v.string()
});

export const WalletInteractiveAnchoringResponseApprovalDataSchema = v.object({
    type: v.literal(WalletInteractiveAnchoringResponseType.APPROVAL_DATA),
    b64SerializedMicroblock: v.string()
});

export const WalletInteractiveAnchoringResponseApprovalSignatureSchema = v.object({
    type: v.literal(WalletInteractiveAnchoringResponseType.APPROVAL_SIGNATURE),
    b64VbHash: v.string(),
    b64MbHash: v.string(),
    height: v.number()
});

export const WalletInteractiveAnchoringResponseSchema = v.variant("type", [
    WalletInteractiveAnchoringResponseErrorSchema,
    WalletInteractiveAnchoringResponseActorKeyRequiredSchema,
    WalletInteractiveAnchoringResponseApprovalDataSchema,
    WalletInteractiveAnchoringResponseApprovalSignatureSchema
]);

// Types
export type WalletInteractiveAnchoringRequest = v.InferOutput<typeof WalletInteractiveAnchoringRequestSchema>;
export type WalletInteractiveAnchoringResponse = v.InferOutput<typeof WalletInteractiveAnchoringResponseSchema>;
export type WalletInteractiveAnchoringResponseError = v.InferOutput<typeof WalletInteractiveAnchoringResponseErrorSchema>;
export type WalletInteractiveAnchoringRequestApprovalHandshake = v.InferOutput<typeof WalletInteractiveAnchoringRequestApprovalHandshakeSchema>;
export type WalletInteractiveAnchoringRequestActorKey = v.InferOutput<typeof WalletInteractiveAnchoringRequestActorKeySchema>;
export type WalletInteractiveAnchoringRequestApprovalSignature = v.InferOutput<typeof WalletInteractiveAnchoringRequestApprovalSignatureSchema>;
export type WalletInteractiveAnchoringResponseActorKeyRequired = v.InferOutput<typeof WalletInteractiveAnchoringResponseActorKeyRequiredSchema>;
export type WalletInteractiveAnchoringResponseApprovalData = v.InferOutput<typeof WalletInteractiveAnchoringResponseApprovalDataSchema>;
export type WalletInteractiveAnchoringResponseApprovalSignature = v.InferOutput<typeof WalletInteractiveAnchoringResponseApprovalSignatureSchema>;
