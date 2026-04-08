import {Microblock} from "../microblock/Microblock";
import {SectionType} from "../../type/valibot/blockchain/section/SectionType";

import {IInternalStateUpdater} from "../internalStates/IInternalStateUpdater";
import {OrganizationInternalState} from "../internalStates/OrganizationInternalState";
import {IProvider} from "../../providers/IProvider";

export class OrganizationInternalStateUpdater implements IInternalStateUpdater<OrganizationInternalState> {
    updateState(provider: IProvider, internalState: OrganizationInternalState, microblock: Microblock): OrganizationInternalState {
        for (const section of microblock.getAllSections()) {
            if (section.type === SectionType.ORG_CREATION) {
                internalState.setAccountId(section.accountId);
            }

            if (section.type === SectionType.ORG_DESCRIPTION) {
                internalState.updateDescriptionHeight(microblock.getHeight())
            }
        }

        return internalState;
    }
}