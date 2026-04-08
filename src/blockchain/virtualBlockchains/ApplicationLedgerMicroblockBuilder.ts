import {ApplicationLedgerVb} from "./ApplicationLedgerVb";
import {Microblock} from "../microblock/Microblock";
import {MicroBlockNotFoundInVirtualBlockchainAtHeightError} from "../../errors/carmentis-error";
import {IMicroblockSearchFailureFallback} from "./fallbacks/IMicroblockSearchFailureFallback";
import {Height, IProvider, Provider} from "../../common";
import {VirtualBlockchain} from "./VirtualBlockchain";
import {IApplicationLedgerInternalStateUpdater} from "../internalStates/IInternalStateUpdater";
import {InternalStateUpdaterFactory} from "../internalStatesUpdater/InternalStateUpdaterFactory";
import {Section} from "../../type/valibot/blockchain/section/sections";


export class ApplicationLedgerMicroblockBuilder implements IMicroblockSearchFailureFallback {

    private stateUpdater?: IApplicationLedgerInternalStateUpdater;
    constructor(protected mbUnderConstruction: Microblock, protected vb: ApplicationLedgerVb, private provider: IProvider) {

    }

    onMicroblockSearchFailureForExceedingHeight(vb: VirtualBlockchain, askedHeight: Height): Promise<Microblock> {
        const currentVbHeight = vb.getHeight();
        if (currentVbHeight + 1 === askedHeight) return Promise.resolve(this.mbUnderConstruction);
        throw new MicroBlockNotFoundInVirtualBlockchainAtHeightError(vb.getIdentifier(), askedHeight)
    }

    protected getBuiltMicroblock() {
        return this.mbUnderConstruction;
    }

    protected async updateStateWithSection(section: Section) {
        // if not already defined, create the state updater with the current protocol state
        if (!this.stateUpdater)  {
            const protocolState = await this.provider.getProtocolState();
            this.stateUpdater = InternalStateUpdaterFactory.createApplicationLedgerInternalStateUpdater(
                protocolState.getApplicationLedgerInternalStateUpdaterVersion()
            );
        }

        // update the internal state with the new section
        this.vb.setInternalState(
            await this.stateUpdater.updateStateFromSection(
                this.provider,
                this.vb.getInternalState(),
                section,
                this.mbUnderConstruction.getHeight()
            )
        )
    }

    protected getInternalState() {
        return this.vb.getInternalState();
    }


}
