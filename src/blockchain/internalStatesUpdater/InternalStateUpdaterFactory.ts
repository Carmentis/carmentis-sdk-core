import {AppLedgerLocalStateUpdaterV1} from "./ApplicationLedgerLocalStateUpdater";
import {IllegalParameterError} from "../../errors/carmentis-error";
import {ValidatorNodeInternalStateUpdater} from "./ValidatorNodeInternalStateUpdater";
import {ProtocolInternalStateUpdater} from "./ProtocolInternalStateUpdater";
import {OrganizationInternalStateUpdater} from "./OrganizationInternalStateUpdater";
import {AccountInternalStateUpdater} from "./AccountInternalStateUpdater";
import {ApplicationInternalStateUpdater} from "./ApplicationInternalStateUpdater";
import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {IApplicationLedgerInternalStateUpdater, IInternalStateUpdater} from "../internalStates/IInternalStateUpdater";
import {AccountInternalState} from "../internalStates/AccountInternalState";
import {OrganizationInternalState} from "../internalStates/OrganizationInternalState";
import {ProtocolInternalState} from "../internalStates/ProtocolInternalState";
import {ValidatorNodeInternalState} from "../internalStates/ValidatorNodeInternalState";


export class InternalStateUpdaterFactory {
    static createApplicationLedgerInternalStateUpdater(internalStateVersion: number): IApplicationLedgerInternalStateUpdater {
        return new AppLedgerLocalStateUpdaterV1;
    }

    static createAccountInternalStateUpdater(internalStateVersion: number): IInternalStateUpdater<AccountInternalState> {
        switch (internalStateVersion) {
            case 1: return new AccountInternalStateUpdater()
            default:
                throw new IllegalParameterError("Unknown account local state version");
        }
    }

    static createOrganizationInternalStateUpdater(internalStateVersion: number): IInternalStateUpdater<OrganizationInternalState> {
        switch (internalStateVersion) {
            case 1: return new OrganizationInternalStateUpdater()
            default:
                throw new IllegalParameterError("Unknown organization local state version");
        }
    }

    static createProtocolInternalStateUpdater(internalStateVersion: number): IInternalStateUpdater<ProtocolInternalState> {
        return new ProtocolInternalStateUpdater()
    }

    static createValidatorNodeInternalStateUpdater(internalStateVersion: number): IInternalStateUpdater<ValidatorNodeInternalState> {
        switch (internalStateVersion) {
            case 1: return new ValidatorNodeInternalStateUpdater()
            default:
                throw new IllegalParameterError("Unknown validator node local state version");
        }
    }

    static createApplicationInternalStateUpdater(internalStateVersion: number) {
        switch (internalStateVersion) {
            case 1: return new ApplicationInternalStateUpdater()
            default:
                throw new IllegalParameterError("Unknown validator node local state version");
        }
    }

    /**
     * Returns the default local state updater version for the given virtual blockchain type.
     *
     * @param {VirtualBlockchainType} type - The type of the virtual blockchain for which the updater version is needed.
     * @return {number} The default local state updater version associated with the specified virtual blockchain type.
     */
    static defaultInternalStateUpdaterVersionByVbType(type: VirtualBlockchainType): number {
        // since we do not have done any update now, the default local state updater version is at one for every VBs
        return 1;
    }
}