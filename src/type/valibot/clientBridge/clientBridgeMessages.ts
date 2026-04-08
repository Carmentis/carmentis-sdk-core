import * as v from 'valibot';
import {bin256, binary, uint8array} from '../primitives';
import {WalletRequestSchema, WalletResponseSchema} from "../walletRequest/walletRequests";

export const WI_MAX_SERVER_URL_LENGTH = 100;

// Unified Message Type Enum
export enum ClientBridgeMessageType {
    REQUEST = 'CLIENT_BRIDGE_REQUEST',
    UPDATE_QR = 'CLIENT_BRIDGE_UPDATE_QR',
    CONNECTION_TOKEN = 'CLIENT_BRIDGE_CONNECTION_TOKEN',
    FORWARDED_ANSWER = 'CLIENT_BRIDGE_FORWARDED_ANSWER',
    GET_CONNECTION_INFO = 'CLIENT_BRIDGE_GET_CONNECTION_INFO',
    ANSWER = 'CLIENT_BRIDGE_ANSWER',
    CONNECTION_INFO = 'CLIENT_BRIDGE_CONNECTION_INFO',
    CONNECTION_ACCEPTED = 'CLIENT_BRIDGE_CONNECTION_ACCEPTED',
    FORWARDED_REQUEST = 'CLIENT_BRIDGE_FORWARDED_REQUEST',
    ERROR = 'CLIENT_BRIDGE_ERROR'
}

// QR Code Schema (auxiliary type)
export const WiQrCodeSchema = v.object({
    base64EncodedQrId: v.string(),
    timestamp: v.number(),
    serverUrl: v.pipe(v.string(), v.maxLength(WI_MAX_SERVER_URL_LENGTH))
});

export type WiQrCode = v.InferOutput<typeof WiQrCodeSchema>;

// Message Schemas - Unified bidirectional messages
export const ClientBridgeMessageSchema_Request = v.object({
    type: v.literal(ClientBridgeMessageType.REQUEST),
    walletRequest: WalletRequestSchema,
    deviceId: bin256(),
    withToken: v.number()
});

export const ClientBridgeMessageSchema_UpdateQr = v.object({
    type: v.literal(ClientBridgeMessageType.UPDATE_QR),
    base64EncodedQrId: v.string(),
    timestamp: v.number()
});

export const ClientBridgeMessageSchema_ConnectionToken = v.object({
    type: v.literal(ClientBridgeMessageType.CONNECTION_TOKEN),
    token: bin256()
});

export const ClientBridgeMessageSchema_ForwardedAnswer = v.object({
    type: v.literal(ClientBridgeMessageType.FORWARDED_ANSWER),
    walletResponse: WalletResponseSchema,
});

export const ClientBridgeMessageSchema_GetConnectionInfo = v.object({
    type: v.literal(ClientBridgeMessageType.GET_CONNECTION_INFO),
    base64EncodedQrId: v.string(),
});

export const ClientBridgeMessageSchema_Answer = v.object({
    type: v.literal(ClientBridgeMessageType.ANSWER),
    walletResponse: WalletResponseSchema,
});

export const ClientBridgeMessageSchema_ConnectionInfo = v.object({
    type: v.literal(ClientBridgeMessageType.CONNECTION_INFO)
});

export const ClientBridgeMessageSchema_ConnectionAccepted = v.object({
    type: v.literal(ClientBridgeMessageType.CONNECTION_ACCEPTED),
    base64EncodedQrId: v.string(),
});

export const ClientBridgeMessageSchema_ForwardedRequest = v.object({
    type: v.literal(ClientBridgeMessageType.FORWARDED_REQUEST),
    walletRequest: WalletRequestSchema,
});

export const ClientBridgeMessageSchema_Error = v.object({
    type: v.literal(ClientBridgeMessageType.ERROR),
    errorMessage: v.string()
});

export const ClientBridgeMessageSchema = v.variant("type", [
    ClientBridgeMessageSchema_Request,
    ClientBridgeMessageSchema_UpdateQr,
    ClientBridgeMessageSchema_ConnectionToken,
    ClientBridgeMessageSchema_ForwardedAnswer,
    ClientBridgeMessageSchema_GetConnectionInfo,
    ClientBridgeMessageSchema_Answer,
    ClientBridgeMessageSchema_ConnectionInfo,
    ClientBridgeMessageSchema_ConnectionAccepted,
    ClientBridgeMessageSchema_ForwardedRequest,
    ClientBridgeMessageSchema_Error
]);

// Message Types
export type ClientBridgeMessage = v.InferOutput<typeof ClientBridgeMessageSchema>;
export type ClientBridgeMessage_Request = v.InferOutput<typeof ClientBridgeMessageSchema_Request>;
export type ClientBridgeMessage_UpdateQr = v.InferOutput<typeof ClientBridgeMessageSchema_UpdateQr>;
export type ClientBridgeMessage_ConnectionToken = v.InferOutput<typeof ClientBridgeMessageSchema_ConnectionToken>;
export type ClientBridgeMessage_ForwardedAnswer = v.InferOutput<typeof ClientBridgeMessageSchema_ForwardedAnswer>;
export type ClientBridgeMessage_GetConnectionInfo = v.InferOutput<typeof ClientBridgeMessageSchema_GetConnectionInfo>;
export type ClientBridgeMessage_Answer = v.InferOutput<typeof ClientBridgeMessageSchema_Answer>;
export type ClientBridgeMessage_ConnectionInfo = v.InferOutput<typeof ClientBridgeMessageSchema_ConnectionInfo>;
export type ClientBridgeMessage_ConnectionAccepted = v.InferOutput<typeof ClientBridgeMessageSchema_ConnectionAccepted>;
export type ClientBridgeMessage_ForwardedRequest = v.InferOutput<typeof ClientBridgeMessageSchema_ForwardedRequest>;
export type ClientBridgeMessage_Error = v.InferOutput<typeof ClientBridgeMessageSchema_Error>;
