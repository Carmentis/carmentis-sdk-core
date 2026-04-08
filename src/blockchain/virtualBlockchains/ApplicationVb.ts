import {VirtualBlockchain} from "./VirtualBlockchain";
import {Microblock} from "../microblock/Microblock";
import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {ApplicationMicroblockStructureChecker} from "../structureCheckers/ApplicationMicroblockStructureChecker";
import {IProvider} from "../../providers/IProvider";
import {ApplicationInternalState} from "../internalStates/ApplicationInternalState";
import {InternalStateUpdaterFactory} from "../internalStatesUpdater/InternalStateUpdaterFactory";
import {ProtocolInternalState} from "../internalStates/ProtocolInternalState";
import {Utils} from "../../utils/utils";
import {SectionType} from "../../type/valibot/blockchain/section/SectionType";

export class ApplicationVb extends VirtualBlockchain<ApplicationInternalState> {
    
    // ------------------------------------------
    // Instance implementation
    // ------------------------------------------
    constructor(provider: IProvider,  state: ApplicationInternalState = ApplicationInternalState.createInitialState()) {
        super(provider, VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN, state);
    }


    protected async updateInternalState(protocolState: ProtocolInternalState, state: ApplicationInternalState, microblock: Microblock) {
        const stateUpdaterVersion = protocolState.getApplicationInternalStateUpdaterVersion();
        const localStateUpdater = InternalStateUpdaterFactory.createApplicationInternalStateUpdater(
            stateUpdaterVersion
        );
        return localStateUpdater.updateState(this.provider, state, microblock);
    }

    async getVirtualBlockchainState() {
        const height = this.getHeight();
        const lastMicroblockHash = height === 0 ?
            Utils.getNullHash() :
            (await this.getLastMicroblock()).getHash().toBytes();
        return {
            expirationDay: this.getExpirationDay(),
            height: height,
            internalState: this.internalState.toObject(),
            lastMicroblockHash: lastMicroblockHash,
            type: this.getType()
        };
    }

    async getVirtualBlockchainOwnerId() {
        const orgId = this.internalState.getOrganizationId();
        const organizationVb = await this.provider.loadOrganizationVirtualBlockchain(orgId);
        return organizationVb.getVirtualBlockchainOwnerId();
    }
    
    protected checkMicroblockStructure(microblock: Microblock): boolean {
        const checker = new ApplicationMicroblockStructureChecker();
        return checker.checkMicroblockStructure(microblock);
    }

    getOrganizationId() {
        return this.internalState.getOrganizationId()
    }

    async getApplicationDescription() {
        const descriptionHeight = this.internalState.getDescriptionHeight();
        const mb = await this.getMicroblock(descriptionHeight);
        for (const section of mb.getAllSections()) {
            if (section.type == SectionType.APP_DESCRIPTION) {
                return section;
            }
        }
        throw new Error('Application description not found');
    }
}
