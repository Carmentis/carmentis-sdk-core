import {Microblock} from "../microblock/Microblock";
import {SectionType} from "../../type/valibot/blockchain/section/SectionType";
import {IInternalStateUpdater} from "../internalStates/IInternalStateUpdater";
import {ValidatorNodeInternalState} from "../internalStates/ValidatorNodeInternalState";
import {ValidatorNodeVotingPowerUpdateSection} from "../../type/valibot/blockchain/section/sections";
import {IProvider} from "../../providers/IProvider";

export class ValidatorNodeInternalStateUpdater implements IInternalStateUpdater<ValidatorNodeInternalState> {
    updateState(provider: IProvider, prevState: ValidatorNodeInternalState, microblock: Microblock): ValidatorNodeInternalState {
        const newState = prevState;
        for (const section of microblock.getAllSections()) {
            switch (section.type) {
                case SectionType.VN_CREATION:
                    newState.setOrganizationId(section.organizationId);
                    break;
                case SectionType.VN_APPROVAL:
                    this.updateApproval(newState, section);
                    break;
                case SectionType.VN_COMETBFT_PUBLIC_KEY_DECLARATION:
                    newState.setCometbftPublicKeyDeclarationHeight(microblock.getHeight());
                    break;
                case SectionType.VN_RPC_ENDPOINT:
                    newState.setRpcEndpointDeclarationHeight(microblock.getHeight());
                    break;
            }
        }
        return newState;
    }

    private updateApproval(state: ValidatorNodeInternalState, section: ValidatorNodeVotingPowerUpdateSection) {
        state.setApprovalStatus(section.status)
    }
}