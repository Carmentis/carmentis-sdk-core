import {Microblock} from "../microblock/Microblock";
import {IInternalStateUpdater} from "../internalStates/IInternalStateUpdater";
import {ApplicationInternalState} from "../internalStates/ApplicationInternalState";
import {SectionType} from "../../type/valibot/blockchain/section/SectionType";
import {IProvider} from "../../providers/IProvider";

export class ApplicationInternalStateUpdater implements IInternalStateUpdater<ApplicationInternalState> {
    updateState(provider: IProvider, prevState: ApplicationInternalState, microblock: Microblock): ApplicationInternalState {
        const newState = prevState.clone();
        for (const section of microblock.getAllSections()) {
            if (section.type === SectionType.APP_CREATION) {
                newState.setOrganizationId(section.organizationId);
            }

            if (section.type === SectionType.APP_DESCRIPTION) {
                newState.setDescriptionHeight(microblock.getHeight());
            }
        }
        return newState;
    }
}