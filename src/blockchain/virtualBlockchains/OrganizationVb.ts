import {VirtualBlockchain} from "./VirtualBlockchain";
import {Microblock} from "../microblock/Microblock";
import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {OrganizationMicroblockStructureChecker} from "../structureCheckers/OrganizationMicroblockStructureChecker";
import {IProvider} from "../../providers/IProvider";
import {OrganizationInternalState} from "../internalStates/OrganizationInternalState";
import {InternalStateUpdaterFactory} from "../internalStatesUpdater/InternalStateUpdaterFactory";
import {ProtocolInternalState} from "../internalStates/ProtocolInternalState";
import {Hash} from "../../entities/Hash";
import {OrganizationDescriptionSection} from "../../type/valibot/blockchain/section/sections";
import {SectionType} from "../../type/valibot/blockchain/section/SectionType";
import {IllegalStateError} from "../../errors/carmentis-error";
import {Utils} from "../../utils/utils";

export class OrganizationVb extends VirtualBlockchain<OrganizationInternalState> {

    // ------------------------------------------
    // Static methods
    // ------------------------------------------
    static createOrganizationVirtualBlockchain(provider: IProvider) {
        return new OrganizationVb(provider);
    }

    // ------------------------------------------
    // Instance implementation
    // ------------------------------------------

    constructor(provider: IProvider, state: OrganizationInternalState = OrganizationInternalState.createInitialState()) {
        super(provider, VirtualBlockchainType.ORGANIZATION_VIRTUAL_BLOCKCHAIN, state)
    }

    protected async updateInternalState(protocolState: ProtocolInternalState, state: OrganizationInternalState, microblock: Microblock) {
        const stateUpdateVersion = protocolState.getOrganizationInternalStateUpdaterVersion();
        const localStateUpdater = InternalStateUpdaterFactory.createOrganizationInternalStateUpdater(
                stateUpdateVersion
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
        return this.internalState.getAccountId();
    }
    
    protected checkMicroblockStructure(microblock: Microblock): boolean {
        const checker = new OrganizationMicroblockStructureChecker();
        return checker.checkMicroblockStructure(microblock)
    }

    getAccountId(): Hash {
        return this.internalState.getAccountId();
    }

    async getDescription() : Promise<OrganizationDescriptionSection> {
        const descriptionHeight = this.internalState.getDescriptionHeight();
        const microblock = await this.getMicroblock(descriptionHeight);
        for (const section of microblock.getAllSections()) {
            if (section.type === SectionType.ORG_DESCRIPTION) {
                return section;
            }
        }
        throw new IllegalStateError("No description found for the organization")
    }

}
