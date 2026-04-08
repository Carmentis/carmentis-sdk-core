import {VirtualBlockchain} from "./VirtualBlockchain";
import {ProtocolMicroblockStructureChecker} from "../structureCheckers/ProtocolMicroblockStructureChecker";
import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {Microblock} from "../microblock/Microblock";
import {IProvider} from "../../providers/IProvider";
import {ProtocolInternalState} from "../internalStates/ProtocolInternalState";
import {InternalStateUpdaterFactory} from "../internalStatesUpdater/InternalStateUpdaterFactory";
import {Utils} from "../../utils/utils";
import {Hash} from "../../entities/Hash";
import {SectionType} from "../../type/valibot/blockchain/section/SectionType";

export class ProtocolVb extends VirtualBlockchain<ProtocolInternalState> {

    // ------------------------------------------
    // Static methods
    // ------------------------------------------

    // ------------------------------------------
    // Instance implementation
    // ------------------------------------------
    constructor(provider: IProvider, state: ProtocolInternalState = ProtocolInternalState.createInitialState()) {
        super(provider, VirtualBlockchainType.PROTOCOL_VIRTUAL_BLOCKCHAIN, state);
    }

    protected checkMicroblockStructure(microblock: Microblock): boolean {
        const checker = new ProtocolMicroblockStructureChecker();
        return checker.checkMicroblockStructure(microblock);
    }

    protected async updateInternalState(protocolState: ProtocolInternalState, state:ProtocolInternalState, microblock: Microblock) {
        const stateUpdaterVersion = protocolState.getProtocolInternalStateUpdaterVersion();
        const localStateUpdater = InternalStateUpdaterFactory.createProtocolInternalStateUpdater(
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
        const orgId = await this.getOrganizationId();
        const organizationVb = await this.provider.loadOrganizationVirtualBlockchain(orgId);
        return organizationVb.getVirtualBlockchainOwnerId();
    }

    async getOrganizationId(): Promise<Hash> {
        const firstBlock = await this.getFirstMicroBlock();
        const sections = firstBlock.getAllSections();
        for (const section of sections) {
            if (section.type === SectionType.PROTOCOL_CREATION) {
                return Hash.from(section.organizationId);
            }
        }
        throw new Error('Organization ID not found in protocol vb')
    }
}
