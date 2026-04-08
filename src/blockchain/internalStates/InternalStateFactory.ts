import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {IInternalState} from "./IInternalState";
import {ProtocolInternalState} from "./ProtocolInternalState";
import {AccountInternalState} from "./AccountInternalState";
import {ApplicationInternalState} from "./ApplicationInternalState";
import {ApplicationLedgerInternalState} from "./ApplicationLedgerInternalState";
import {OrganizationInternalState} from "./OrganizationInternalState";
import {ValidatorNodeInternalState} from "./ValidatorNodeInternalState";

export class InternalStateFactory {
    static createInternalStateFromObject(vbType: VirtualBlockchainType, internalStateObject: unknown): IInternalState {
        switch (vbType) {
            case VirtualBlockchainType.PROTOCOL_VIRTUAL_BLOCKCHAIN:
                return ProtocolInternalState.createFromObject(internalStateObject);
            case VirtualBlockchainType.ACCOUNT_VIRTUAL_BLOCKCHAIN:
                return AccountInternalState.createFromObject(internalStateObject);
            case VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN:
                return ApplicationInternalState.createFromObject(internalStateObject);
            case VirtualBlockchainType.APP_LEDGER_VIRTUAL_BLOCKCHAIN:
                return ApplicationLedgerInternalState.createFromObject(internalStateObject);
            case VirtualBlockchainType.ORGANIZATION_VIRTUAL_BLOCKCHAIN:
                return OrganizationInternalState.createFromObject(internalStateObject);
            case VirtualBlockchainType.NODE_VIRTUAL_BLOCKCHAIN:
                return ValidatorNodeInternalState.createFromObject(internalStateObject);
            default:
                throw new Error(`Unknown virtual blockchain type: ${vbType}`);
        }
    }
}