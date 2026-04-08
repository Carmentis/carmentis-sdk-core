import * as val from 'valibot';
import {accountId, boolean, height, number, string} from "../../primitives";
import {ProtocolUpdateSchema} from "../protocol/ProtocolUpdate";
import {ProtocolVariablesSchema} from "../protocol/ProtocolVariables";

// ---------------------------------------------------------------------------
// Protocol VB Internal State
// ---------------------------------------------------------------------------

export const ProtocolVBInternalStateObjectSchema = val.object({
    organizationId: accountId(),
    currentProtocolVariables: ProtocolVariablesSchema,
    protocolUpdates: val.array(ProtocolUpdateSchema),
});
export type ProtocolVBInternalStateObject = val.InferOutput<typeof ProtocolVBInternalStateObjectSchema>;

// ---------------------------------------------------------------------------
// Account VB Internal State
// ---------------------------------------------------------------------------

export const AccountVirtualBlockchainInternalStateSchema = val.object({
    signatureSchemeId: number(),
    publicKeyHeight: height(),
});
export type AccountVBInternalStateObject = val.InferOutput<typeof AccountVirtualBlockchainInternalStateSchema>;

// ---------------------------------------------------------------------------
// Organization VB Internal State
// ---------------------------------------------------------------------------

export const OrganizationVBInternalStateObjectSchema = val.object({
    accountId: accountId(),
    descriptionHeight: height(),
});
export type OrganizationVBInternalStateObject = val.InferOutput<typeof OrganizationVBInternalStateObjectSchema>;

// ---------------------------------------------------------------------------
// Validator Node VB Internal State
// ---------------------------------------------------------------------------

export const ValidatorNodeVBInternalStateObjectSchema = val.object({
    organizationId: accountId(),
    cometbftPublicKeyDeclarationHeight: height(),
    rpcEndpointHeight: height(),
    lastKnownApprovalStatus: boolean(),
});
export type ValidatorNodeVBInternalStateObject = val.InferOutput<typeof ValidatorNodeVBInternalStateObjectSchema>;

// ---------------------------------------------------------------------------
// Application VB Internal State
// ---------------------------------------------------------------------------

export const ApplicationVBInternalStateObjectSchema = val.object({
    organizationId: accountId(),
    descriptionHeight: height(),
});
export type ApplicationVBInternalStateObject = val.InferOutput<typeof ApplicationVBInternalStateObjectSchema>;

// ---------------------------------------------------------------------------
// Application Ledger Internal State
// ---------------------------------------------------------------------------

export const ApplicationLedgerChannelSchema = val.object({
    name: string(),
    isPrivate: boolean(),
    creatorId: number(),
});
export type ApplicationLedgerChannel = val.InferOutput<typeof ApplicationLedgerChannelSchema>;

export const ApplicationLedgerActorInvitationStateSchema = val.object({
    channelId: number(),
    height: height(),
});
export type ApplicationLedgerActorInvitationState = val.InferOutput<typeof ApplicationLedgerActorInvitationStateSchema>;

/**
 * Describes a shared secret between two parties.
 * One of the actor is implicit: This object should be associated with
 * an actor identifier, the other one is defined in this state.
 */
export const ApplicationLedgerSharedSecretStateSchema = val.object({
    peerActorId: number(),
    height: height(),
});
export type ApplicationLedgerSharedSecretState = val.InferOutput<typeof ApplicationLedgerSharedSecretStateSchema>;

export const ApplicationLedgerActorSchema = val.object({
    name: string(),
    subscribed: boolean(),
    signatureKeyHeight: number(),
    pkeKeyHeight: number(),
    sharedSecrets: val.array(ApplicationLedgerSharedSecretStateSchema),
    invitations: val.array(ApplicationLedgerActorInvitationStateSchema),
});
export type ApplicationLedgerActor = val.InferOutput<typeof ApplicationLedgerActorSchema>;

/**
 * Describes the local state of the application ledger.
 */
export const ApplicationLedgerInternalStateObjectSchema = val.object({
    /**
     * This field contains the list of additional writers that are allowed to write to the virtual blockchain.
     */
    allowedAdditionalWriters: val.array(accountId()),
    allowedSignatureSchemeIds: val.array(number()),
    allowedPkeSchemeIds: val.array(number()),
    applicationId: accountId(),
    channels: val.array(ApplicationLedgerChannelSchema),
    actors: val.array(ApplicationLedgerActorSchema),
});
export type ApplicationLedgerInternalStateObject = val.InferOutput<typeof ApplicationLedgerInternalStateObjectSchema>;
