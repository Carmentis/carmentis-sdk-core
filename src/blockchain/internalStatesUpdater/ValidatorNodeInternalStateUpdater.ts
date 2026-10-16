import {Microblock} from "../microblock/Microblock";
import {SectionType} from "../../type/valibot/blockchain/section/SectionType";
import {IInternalStateUpdater} from "../internalStates/IInternalStateUpdater";
import {ValidatorNodeInternalState} from "../internalStates/ValidatorNodeInternalState";
import {ValidatorNodeVotingPowerUpdateSection} from "../../type/valibot/blockchain/section/sections";
import {IProvider} from "../../providers/IProvider";

export class ValidatorNodeInternalStateUpdater implements IInternalStateUpdater<ValidatorNodeInternalState> {
    updateState(provider: IProvider, prevState: ValidatorNodeInternalState, microblock: Microblock): ValidatorNodeInternalState {
        const newState = prevState;

        // we have to study the microblock to update the internal state
        const cometbftPublicKeyDeclarations = microblock.getSectionsByType(
            SectionType.VN_COMETBFT_PUBLIC_KEY_DECLARATION
        );
        const numberOfCometbftPublicKeyDeclaration = cometbftPublicKeyDeclarations.length;


        if (microblock.isGenesisMicroblock()) {
            // the validator node must declare its cometbft public key in the genesis microblock
            // and cannot declare it in any other microblock
            // reject if there are no or more than one cometbft public key declaration
            if (numberOfCometbftPublicKeyDeclaration !== 1) {
                throw new Error(`The genesis microblock must contain exactly one cometbft public key declaration: got ${numberOfCometbftPublicKeyDeclaration}`);
            } else {
                newState.setCometbftPublicKeyDeclarationHeight(microblock.getHeight());
            }
        } else {
            // reject if there is an attempt to redeclare its cometbft public key
            if (numberOfCometbftPublicKeyDeclaration !== 0) {
                throw new Error("The validator node cannot declare its cometbft public key in any microblock other than the genesis microblock");
            }
        }


        for (const section of microblock.getAllSections()) {
            switch (section.type) {
                case SectionType.VN_CREATION:
                    newState.setOrganizationId(section.organizationId);
                    break;
                case SectionType.VN_APPROVAL:
                    this.updateApproval(newState, section);
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