// This file contains all the sections contained in a microblock
import * as val from 'valibot';
import {accountId, boolean, number, string, uint8, uint8array} from "../../primitives";
import {SectionType} from "./SectionType";
import {ProtocolUpdateSchema} from "../protocol/ProtocolUpdate";

// ---------------------------------------------------------------------------
// All virtual blockchain purpose
// ---------------------------------------------------------------------------
export const CustomSectionSchema = val.objectWithRest(
    {
        type: val.literal(SectionType.CUSTOM)
    },
    val.unknown()
)
export type CustomSection = val.InferOutput<typeof CustomSectionSchema>;

export const SignatureSectionSchema = val.object({
    type: val.literal(SectionType.SIGNATURE),
    signature: uint8array(),
    schemeId: uint8(),
})
export type SignatureSection = val.InferOutput<typeof SignatureSectionSchema>;

export const AllowedAdditionalWriterSectionSchema = val.object({
    type: val.literal(SectionType.ALLOWED_ADDITIONAL_WRITER),
    allowedWriterAccountId: uint8array(),
})
export type AllowedAdditionalWriterSection = val.InferOutput<typeof AllowedAdditionalWriterSectionSchema>;

// ---------------------------------------------------------------------------
// Protocol Sections
// ---------------------------------------------------------------------------

export const ProtocolCreationSectionSchema = val.object({
    type: val.literal(SectionType.PROTOCOL_CREATION),
    organizationId: accountId(),
})
export type ProtocolCreationSection = val.InferOutput<typeof ProtocolCreationSectionSchema>;

export const ProtocolUpdateSectionSchema = val.object({
    type: val.literal(SectionType.PROTOCOL_UPDATE),
    ...ProtocolUpdateSchema.entries
})
export type ProtocolUpdateSection = val.InferOutput<typeof ProtocolUpdateSectionSchema>;

export const ProtocolVariablesSectionSchema = val.object({
    type: val.literal(SectionType.PROTOCOL_VARIABLES),
    protocolVariables: val.any(), // ProtocolVariables object
})
export type ProtocolVariablesSection = val.InferOutput<typeof ProtocolVariablesSectionSchema>;

// ---------------------------------------------------------------------------
// Account Sections
// ---------------------------------------------------------------------------

export const AccountPublicKeySectionSchema = val.object({
    type: val.literal(SectionType.ACCOUNT_PUBLIC_KEY),
    publicKey: uint8array(),
    schemeId: uint8(),
})
export type AccountPublicKeySection = val.InferOutput<typeof AccountPublicKeySectionSchema>;

export const AccountTokenIssuanceSectionSchema = val.object({
    type: val.literal(SectionType.ACCOUNT_TOKEN_ISSUANCE),
    amount: number(),
})
export type AccountTokenIssuanceSection = val.InferOutput<typeof AccountTokenIssuanceSectionSchema>;

export const AccountCreationSectionSchema = val.object({
    type: val.literal(SectionType.ACCOUNT_CREATION),
    sellerAccount: accountId(),
    amount: number(),
})
export type AccountCreationSection = val.InferOutput<typeof AccountCreationSectionSchema>;

export const AccountTransferSectionSchema = val.object({
    type: val.literal(SectionType.ACCOUNT_TRANSFER),
    account: accountId(),
    amount: number(),
    publicReference: string(),
    privateReference: string(),
})
export type AccountTransferSection = val.InferOutput<typeof AccountTransferSectionSchema>;

export const AccountVestingTransferSectionSchema = val.object({
    type: val.literal(SectionType.ACCOUNT_VESTING_TRANSFER),
    account: accountId(),
    amount: number(),
    publicReference: string(),
    privateReference: string(),
    cliffDurationDays: number(),
    vestingDurationDays: number(),
})
export type AccountVestingTransferSection = val.InferOutput<typeof AccountVestingTransferSectionSchema>;

export const AccountEscrowTransferSectionSchema = val.object({
    type: val.literal(SectionType.ACCOUNT_ESCROW_TRANSFER),
    account: accountId(),
    amount: number(),
    publicReference: string(),
    privateReference: string(),
    escrowIdentifier: accountId(),
    agentAccount: accountId(),
    durationDays: number(),
})
export type AccountEscrowTransferSection = val.InferOutput<typeof AccountEscrowTransferSectionSchema>;

export const AccountEscrowSettlementSectionSchema = val.object({
    type: val.literal(SectionType.ACCOUNT_ESCROW_SETTLEMENT),
    escrowIdentifier: accountId(),
    confirmed: boolean(),
})
export type AccountEscrowSettlementSection = val.InferOutput<typeof AccountEscrowSettlementSectionSchema>;

export const AccountStakeSectionSchema = val.object({
    type: val.literal(SectionType.ACCOUNT_STAKE),
    amount: number(),
    objectType: number(),
    objectIdentifier: accountId(),
})
export type AccountStakeSection = val.InferOutput<typeof AccountStakeSectionSchema>;

export const AccountUnstakeSectionSchema = val.object({
    type: val.literal(SectionType.ACCOUNT_UNSTAKE),
    amount: number(),
    objectType: number(),
    objectIdentifier: accountId(),
})
export type AccountUnstakeSection = val.InferOutput<typeof AccountUnstakeSectionSchema>;


// ---------------------------------------------------------------------------
// Validator Node Sections
// ---------------------------------------------------------------------------

export const ValidatorNodeCreationSectionSchema = val.object({
    type: val.literal(SectionType.VN_CREATION),
    organizationId: accountId(),
})
export type ValidatorNodeCreationSection = val.InferOutput<typeof ValidatorNodeCreationSectionSchema>;

export const ValidatorNodeCometbftPublicKeyDeclarationSectionSchema = val.object({
    type: val.literal(SectionType.VN_COMETBFT_PUBLIC_KEY_DECLARATION),
    cometPublicKeyType: string(),
    cometPublicKey: string(),
})
export type ValidatorNodeCometbftPublicKeyDeclarationSection = val.InferOutput<typeof ValidatorNodeCometbftPublicKeyDeclarationSectionSchema>;

export const ValidatorNodeRpcEndpointSectionSchema = val.object({
    type: val.literal(SectionType.VN_RPC_ENDPOINT),
    rpcEndpoint: string(),
})
export type ValidatorNodeRpcEndpointSection = val.InferOutput<typeof ValidatorNodeRpcEndpointSectionSchema>;

export const ValidatorNodeApprovalSectionSchema = val.object({
    type: val.literal(SectionType.VN_APPROVAL),
    status: boolean(),
})
export type ValidatorNodeVotingPowerUpdateSection = val.InferOutput<typeof ValidatorNodeApprovalSectionSchema>;

export const ValidatorNodeSlashingCancellationSectionSchema = val.object({
    type: val.literal(SectionType.VN_SLASHING_CANCELLATION),
    reason: string(),
})
export type ValidatorNodeSlashingCancellationSection = val.InferOutput<typeof ValidatorNodeSlashingCancellationSectionSchema>;

// ---------------------------------------------------------------------------
// Organization Sections
// ---------------------------------------------------------------------------

export const OrganizationCreationSectionSchema = val.object({
    type: val.literal(SectionType.ORG_CREATION),
    accountId: accountId(),
})
export type OrganizationCreationSection = val.InferOutput<typeof OrganizationCreationSectionSchema>;

export const OrganizationDescriptionSectionSchema = val.object({
    type: val.literal(SectionType.ORG_DESCRIPTION),
    name: string(),
    city: string(),
    countryCode: string(),
    website: string(),
    misc: val.optional(val.record(val.string(), val.string())),
})
export type OrganizationDescriptionSection = val.InferOutput<typeof OrganizationDescriptionSectionSchema>;

// ---------------------------------------------------------------------------
// Application Sections
// ---------------------------------------------------------------------------

export const ApplicationCreationSectionSchema = val.object({
    type: val.literal(SectionType.APP_CREATION),
    organizationId: accountId(),
})
export type ApplicationCreationSection = val.InferOutput<typeof ApplicationCreationSectionSchema>;

export const ApplicationDescriptionSectionSchema = val.object({
    type: val.literal(SectionType.APP_DESCRIPTION),
    name: string(),
    logoUrl: string(),
    homepageUrl: string(),
    description: string(),
    misc: val.optional(val.record(val.string(), val.string())),
})
export type ApplicationDescriptionSection = val.InferOutput<typeof ApplicationDescriptionSectionSchema>;

// ---------------------------------------------------------------------------
// Application Ledger Sections
// ---------------------------------------------------------------------------

export const ApplicationLedgerAllowedSigSchemesSectionSchema = val.object({
    type: val.literal(SectionType.APP_LEDGER_ALLOWED_SIG_SCHEMES),
    schemeIds: val.array(uint8()),
})
export type ApplicationLedgerAllowedSigSchemesSection = val.InferOutput<typeof ApplicationLedgerAllowedSigSchemesSectionSchema>;

export const ApplicationLedgerAllowedPkeSchemesSectionSchema = val.object({
    type: val.literal(SectionType.APP_LEDGER_ALLOWED_PKE_SCHEMES),
    schemeIds: val.array(uint8()),
})
export type ApplicationLedgerAllowedPkeSchemesSection = val.InferOutput<typeof ApplicationLedgerAllowedPkeSchemesSectionSchema>;

export const ApplicationLedgerCreationSectionSchema = val.object({
    type: val.literal(SectionType.APP_LEDGER_CREATION),
    applicationId: accountId(),
})
export type ApplicationLedgerCreationSection = val.InferOutput<typeof ApplicationLedgerCreationSectionSchema>;

export const ApplicationLedgerActorCreationSectionSchema = val.object({
    type: val.literal(SectionType.APP_LEDGER_ACTOR_CREATION),
    id: number(),
    actorType: number(),
    name: string(),
})
export type ApplicationLedgerActorCreationSection = val.InferOutput<typeof ApplicationLedgerActorCreationSectionSchema>;

export const ApplicationLedgerChannelCreationSectionSchema = val.object({
    type: val.literal(SectionType.APP_LEDGER_CHANNEL_CREATION),
    id: number(),
    isPrivate: boolean(),
    creatorId: number(),
    name: string(),
})
export type ApplicationLedgerChannelCreationSection = val.InferOutput<typeof ApplicationLedgerChannelCreationSectionSchema>;

export const ApplicationLedgerSharedSecretSectionSchema = val.object({
    type: val.literal(SectionType.APP_LEDGER_SHARED_SECRET),
    hostId: number(),
    guestId: number(),
    encryptedSharedKey: uint8array(),
})
export type ApplicationLedgerSharedSecretSection = val.InferOutput<typeof ApplicationLedgerSharedSecretSectionSchema>;

export const ApplicationLedgerChannelInvitationSectionSchema = val.object({
    type: val.literal(SectionType.APP_LEDGER_CHANNEL_INVITATION),
    channelId: number(),
    hostId: number(),
    guestId: number(),
    encryptedChannelKey: uint8array(),
})
export type ApplicationLedgerChannelInvitationSection = val.InferOutput<typeof ApplicationLedgerChannelInvitationSectionSchema>;

export const ApplicationLedgerActorSubscriptionSectionSchema = val.object({
    type: val.literal(SectionType.APP_LEDGER_ACTOR_SUBSCRIPTION),
    actorId: number(),
    actorType: number(),
    organizationId: accountId(),
    signatureSchemeId: uint8(),
    signaturePublicKey: uint8array(),
    pkeSchemeId: uint8(),
    pkePublicKey: uint8array(),
})
export type ApplicationLedgerActorSubscriptionSection = val.InferOutput<typeof ApplicationLedgerActorSubscriptionSectionSchema>;

export const ApplicationLedgerPublicChannelDataSectionSchema = val.object({
    type: val.literal(SectionType.APP_LEDGER_PUBLIC_CHANNEL_DATA),
    channelId: number(),
    data: uint8array(),
})
export type ApplicationLedgerPublicChannelDataSection = val.InferOutput<typeof ApplicationLedgerPublicChannelDataSectionSchema>;

export const ApplicationLedgerPrivateChannelDataSectionSchema = val.object({
    type: val.literal(SectionType.APP_LEDGER_PRIVATE_CHANNEL_DATA),
    channelId: number(),
    merkleRootHash: accountId(),
    encryptedData: uint8array(),
})
export type ApplicationLedgerPrivateChannelDataSection = val.InferOutput<typeof ApplicationLedgerPrivateChannelDataSectionSchema>;

export const ApplicationLedgerAuthorSectionSchema = val.object({
    type: val.literal(SectionType.APP_LEDGER_AUTHOR),
    authorId: number(),
})
export type ApplicationLedgerAuthorSection = val.InferOutput<typeof ApplicationLedgerAuthorSectionSchema>;

export const ApplicationLedgerEndorsementRequestSectionSchema = val.object({
    type: val.literal(SectionType.APP_LEDGER_ENDORSEMENT_REQUEST),
    endorserId: number(),
    message: string(),
})
export type ApplicationLedgerEndorsementRequestSection = val.InferOutput<typeof ApplicationLedgerEndorsementRequestSectionSchema>;

// ---------------------------------------------------------------------------
// Section Union Schema
// ---------------------------------------------------------------------------

export const SectionSchema = val.variant(
    "type",
    [
        SignatureSectionSchema,
        AllowedAdditionalWriterSectionSchema,
        CustomSectionSchema,

        ProtocolCreationSectionSchema,
        ProtocolUpdateSectionSchema,
        ProtocolVariablesSectionSchema,

        AccountPublicKeySectionSchema,
        AccountTokenIssuanceSectionSchema,
        AccountCreationSectionSchema,
        AccountTransferSectionSchema,
        AccountVestingTransferSectionSchema,
        AccountEscrowTransferSectionSchema,
        AccountEscrowSettlementSectionSchema,
        AccountStakeSectionSchema,
        AccountUnstakeSectionSchema,

        ValidatorNodeCreationSectionSchema,
        ValidatorNodeCometbftPublicKeyDeclarationSectionSchema,
        ValidatorNodeRpcEndpointSectionSchema,
        ValidatorNodeApprovalSectionSchema,
        ValidatorNodeSlashingCancellationSectionSchema,

        OrganizationCreationSectionSchema,
        OrganizationDescriptionSectionSchema,

        ApplicationCreationSectionSchema,
        ApplicationDescriptionSectionSchema,

        ApplicationLedgerAllowedSigSchemesSectionSchema,
        ApplicationLedgerAllowedPkeSchemesSectionSchema,
        ApplicationLedgerCreationSectionSchema,
        ApplicationLedgerActorCreationSectionSchema,
        ApplicationLedgerChannelCreationSectionSchema,
        ApplicationLedgerSharedSecretSectionSchema,
        ApplicationLedgerChannelInvitationSectionSchema,
        ApplicationLedgerActorSubscriptionSectionSchema,
        ApplicationLedgerPublicChannelDataSectionSchema,
        ApplicationLedgerPrivateChannelDataSectionSchema,
        ApplicationLedgerAuthorSectionSchema,
        ApplicationLedgerEndorsementRequestSectionSchema,
    ]
)
export type Section = val.InferOutput<typeof SectionSchema>;