import * as v from 'valibot';
import {number, uint8array} from "../../primitives";
import {VirtualBlockchainType} from "../../../VirtualBlockchainType";
import {
    AccountVirtualBlockchainInternalStateSchema,
    ApplicationLedgerInternalStateObjectSchema,
    ApplicationVBInternalStateObjectSchema,
    OrganizationVBInternalStateObjectSchema,
    ProtocolVBInternalStateObjectSchema,
    ValidatorNodeVBInternalStateObjectSchema
} from "./internalStates";

export const VirtualBlockchainSharedPropertiesSchema = v.object({
    height: number(),
    expirationDay: number(),
    lastMicroblockHash: uint8array(),
})

export const AccountVirtualBlockchainStateSchema = v.object({
    type: v.literal(VirtualBlockchainType.ACCOUNT_VIRTUAL_BLOCKCHAIN),
    ...VirtualBlockchainSharedPropertiesSchema.entries,
    internalState: AccountVirtualBlockchainInternalStateSchema,
})
export type AccountVirtualBlockchainState = v.InferOutput<typeof AccountVirtualBlockchainStateSchema>;

export const OrganizationVirtualBlockchainStateSchema = v.object({
    type: v.literal(VirtualBlockchainType.ORGANIZATION_VIRTUAL_BLOCKCHAIN),
    ...VirtualBlockchainSharedPropertiesSchema.entries,
    internalState: OrganizationVBInternalStateObjectSchema,
})
export type OrganizationVirtualBlockchainState = v.InferOutput<typeof OrganizationVirtualBlockchainStateSchema>;

export const ValidatorNodeVirtualBlockchainStateSchema = v.object({
    type: v.literal(VirtualBlockchainType.NODE_VIRTUAL_BLOCKCHAIN),
    ...VirtualBlockchainSharedPropertiesSchema.entries,
    internalState: ValidatorNodeVBInternalStateObjectSchema,
})
export type ValidatorNodeVirtualBlockchainState = v.InferOutput<typeof ValidatorNodeVirtualBlockchainStateSchema>;

export const ApplicationVirtualBlockchainStateSchema = v.object({
    type: v.literal(VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN),
    ...VirtualBlockchainSharedPropertiesSchema.entries,
    internalState: ApplicationVBInternalStateObjectSchema,
})
export type ApplicationVirtualBlockchainState = v.InferOutput<typeof ApplicationVirtualBlockchainStateSchema>;

export const ApplicationLedgerVirtualBlockchainStateSchema = v.object({
    type: v.literal(VirtualBlockchainType.APP_LEDGER_VIRTUAL_BLOCKCHAIN),
    ...VirtualBlockchainSharedPropertiesSchema.entries,
    internalState: ApplicationLedgerInternalStateObjectSchema,
})
export type ApplicationLedgerVirtualBlockchainState = v.InferOutput<typeof ApplicationLedgerVirtualBlockchainStateSchema>;

export const ProtocolVirtualBlockchainStateSchema = v.object({
    type: v.literal(VirtualBlockchainType.PROTOCOL_VIRTUAL_BLOCKCHAIN),
    ...VirtualBlockchainSharedPropertiesSchema.entries,
    internalState: ProtocolVBInternalStateObjectSchema,
})
export type ProtocolVirtualBlockchainState = v.InferOutput<typeof ProtocolVirtualBlockchainStateSchema>;

export const VirtualBlockchainStateSchema = v.variant(
    "type",
    [
        AccountVirtualBlockchainStateSchema,
        OrganizationVirtualBlockchainStateSchema,
        ValidatorNodeVirtualBlockchainStateSchema,
        ApplicationVirtualBlockchainStateSchema,
        ApplicationLedgerVirtualBlockchainStateSchema,
        ProtocolVirtualBlockchainStateSchema,
    ]
)


export type VirtualBlockchainState = v.InferOutput<typeof VirtualBlockchainStateSchema>;