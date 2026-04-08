import * as v from 'valibot';
import {bin256, binary, string, array} from '../primitives';

// Request enum
export enum WalletRequestType {
    AUTH_BY_PUBLIC_KEY = 'WALLET_REQUEST_AUTH_BY_PUBLIC_KEY',
    DATA_APPROVAL = 'WALLET_REQUEST_DATA_APPROVAL',
}

// Response enum
export enum WalletResponseType {
    AUTH_BY_PUBLIC_KEY = 'WALLET_RESPONSE_AUTH_BY_PUBLIC_KEY',
    DATA_APPROVAL = 'WALLET_RESPONSE_DATA_APPROVAL',
}

// Request Schemas
export const WalletRequestAuthByPublicKeySchema = v.object({
    type: v.literal(WalletRequestType.AUTH_BY_PUBLIC_KEY),
    base64EncodedChallenge: v.string()
});

export const WalletRequestDataApprovalSchema = v.object({
    type: v.literal(WalletRequestType.DATA_APPROVAL),
    anchorRequestId: v.string(),
    serverUrl: v.string()
});

export const WalletRequestSchema = v.variant("type", [
    WalletRequestAuthByPublicKeySchema,
    WalletRequestDataApprovalSchema,
]);

// Response Schemas
export const WalletResponseAuthByPublicKeySchema = v.object({
    type: v.literal(WalletResponseType.AUTH_BY_PUBLIC_KEY),
    publicKey: v.string(),
    signature: v.string()
});

export const WalletResponseDataApprovalSchema = v.object({
    type: v.literal(WalletResponseType.DATA_APPROVAL),
    b64VbHash: v.string(),
    b64MbHash: v.string(),
    height: v.number()
});



export const WalletResponseSchema = v.variant("type", [
    WalletResponseAuthByPublicKeySchema,
    WalletResponseDataApprovalSchema,
]);

// Request Types
export type WalletRequest = v.InferOutput<typeof WalletRequestSchema>;
export type WalletRequestAuthByPublicKey = v.InferOutput<typeof WalletRequestAuthByPublicKeySchema>;
export type WalletRequestDataApproval = v.InferOutput<typeof WalletRequestDataApprovalSchema>;

// Response Types
export type WalletResponse = v.InferOutput<typeof WalletResponseSchema>;
export type WalletResponseAuthByPublicKey = v.InferOutput<typeof WalletResponseAuthByPublicKeySchema>;
export type WalletResponseDataApproval = v.InferOutput<typeof WalletResponseDataApprovalSchema>;
