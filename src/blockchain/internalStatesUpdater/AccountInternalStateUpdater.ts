import {Microblock} from "../microblock/Microblock";
import {ECO} from "../../constants/constants";
import {IInternalStateUpdater} from "../internalStates/IInternalStateUpdater";
import {AccountInternalState} from "../internalStates/AccountInternalState";
import {
    AccountPublicKeySection,
    AccountTokenIssuanceSection,
    AccountVestingTransferSection,
    Section
} from "../../type/valibot/blockchain/section/sections";
import {SectionType} from "../../type/valibot/blockchain/section/SectionType";
import {IProvider} from "../../providers/IProvider";

export class AccountInternalStateUpdater implements IInternalStateUpdater<AccountInternalState> {
    constructor() {}

    async updateState(provider: IProvider, prevState: AccountInternalState, microblock: Microblock) {
        const newState = AccountInternalState.createFromObject({
            ...prevState.toObject()
        });

        // Process all sections in the microblock
        const sections: Section[] = microblock.getAllSections();
        
        for (const section of sections) {
            switch (section.type) {
                case SectionType.ACCOUNT_PUBLIC_KEY:
                    await this.publicKeyCallback(newState, microblock, section);
                    break;
                case SectionType.ACCOUNT_TOKEN_ISSUANCE:
                    await this.tokenIssuanceCallback(newState, microblock, section);
                    break;
                case SectionType.ACCOUNT_CREATION:
                    await this.creationCallback(newState, microblock, section);
                    break;
                case SectionType.ACCOUNT_TRANSFER:
                    await this.transferCallback(newState, microblock, section);
                    break;
                case SectionType.ACCOUNT_VESTING_TRANSFER:
                    await this.vestingTransferCallback(newState, microblock, section);
                    break;
                case SectionType.ACCOUNT_ESCROW_TRANSFER:
                    await this.escrowTransferCallback(newState, microblock, section);
                    break;
                case SectionType.ACCOUNT_STAKE:
                    await this.stakeCallback(newState, microblock, section);
                    break;
                case SectionType.SIGNATURE:
                    await this.signatureCallback(newState, microblock, section);
                    break;
            }
        }

        return newState;
    }

    private async publicKeyCallback(state: AccountInternalState, microblock: Microblock, section: AccountPublicKeySection) {
        state.updatePublicKeyHeight(microblock.getHeight());
        state.updateSignatureScheme(section.schemeId);
    }

    private async tokenIssuanceCallback(state: AccountInternalState, microblock: Microblock, section: AccountTokenIssuanceSection) {
        if (section.amount != ECO.INITIAL_OFFER) {
            throw new Error(`the amount of the initial token issuance is not the expected one`);
        }
    }

    private async creationCallback(state: AccountInternalState, microblock: Microblock, section: Section) {

    }

    private async transferCallback(state: AccountInternalState, microblock: Microblock, section: Section) {
        //const payeeVb = new AccountVb({ provider: this.provider });
        //await payeeVb.load(section.object.account);
        // Note: microblock.setFeesPayerAccount would need the account identifier which isn't available in this context
        // This might need to be handled differently in the new architecture
    }

    private async vestingTransferCallback(state: AccountInternalState, microblock: Microblock, section: AccountVestingTransferSection) {
        if (section.cliffDurationDays < 0) {
            throw new Error(`The cliff duration must be greater than or equal to 0`);
        }
        if (section.vestingDurationDays <= 0) {
            throw new Error(`The vesting duration must be greater than 0`);
        }
        if (section.amount <= 0) {
            throw new Error(`The amount must be greater than 0`);
        }
    }

    private async escrowTransferCallback(state: AccountInternalState, microblock: Microblock, section: Section) {

    }

    private async stakeCallback(state: AccountInternalState, microblock: Microblock, section: Section) {
    }

    private async signatureCallback(state: AccountInternalState, microblock: Microblock, section: Section) {
    }
}
