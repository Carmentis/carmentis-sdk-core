import {VirtualBlockchain} from "./VirtualBlockchain";
import {ValidatorNodeMicroblockStructureChecker} from "../structureCheckers/ValidatorNodeMicroblockStructureChecker";

import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {Microblock} from "../microblock/Microblock";
import {IProvider} from "../../providers/IProvider";
import {IllegalStateError} from "../../errors/carmentis-error";
import {SectionType} from "../../type/valibot/blockchain/section/SectionType";
import {ValidatorNodeInternalState} from "../internalStates/ValidatorNodeInternalState";
import {InternalStateUpdaterFactory} from "../internalStatesUpdater/InternalStateUpdaterFactory";
import {ProtocolInternalState} from "../internalStates/ProtocolInternalState";
import {Utils} from "../../utils/utils";
import {Hash} from "../../entities/Hash";

export class ValidatorNodeVb extends VirtualBlockchain<ValidatorNodeInternalState> {


    // ------------------------------------------
    // Instance implementation
    // ------------------------------------------
    constructor(provider: IProvider, state: ValidatorNodeInternalState = ValidatorNodeInternalState.createInitialState()) {
        super(provider, VirtualBlockchainType.NODE_VIRTUAL_BLOCKCHAIN, state);
    }

    protected async updateInternalState(protocolState: ProtocolInternalState, state: ValidatorNodeInternalState, microblock: Microblock): Promise<ValidatorNodeInternalState> {
        const stateUpdaterVersion = protocolState.getValidatorNodeInternalStateUpdaterVersion();
        const stateUpdater = InternalStateUpdaterFactory.createValidatorNodeInternalStateUpdater(
            stateUpdaterVersion
        );
        return stateUpdater.updateState(this.provider, state, microblock);
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
        return this.internalState.getOrganizationId();
    }
    
    protected checkMicroblockStructure(microblock: Microblock): boolean {
        const checker = new ValidatorNodeMicroblockStructureChecker();
        return checker.checkMicroblockStructure(microblock);
    }

    async getCometbftPublicKeyDeclaration(): Promise<{cometbftPublicKey: string , cometbftPublicKeyType: string}> {
        const height = this.internalState.getCometbftPublicKeyDeclarationHeight();
        if (height === 0) throw new IllegalStateError("Node has not declared its CometBFT public key yet");
        const microblock = await this.getMicroblock(height);
        for (const section of microblock.getAllSections()) {
            if (section.type !== SectionType.VN_COMETBFT_PUBLIC_KEY_DECLARATION) continue;
            const cometbftPublicKey = section.cometPublicKey;
            const cometbftPublicKeyType = section.cometPublicKeyType;
            return { cometbftPublicKeyType, cometbftPublicKey }
        }
        throw new IllegalStateError("Node has not declared its CometBFT public key yet");
        //const section = microblock.getSectionByType<ValidatorNodeCometbftPublicKeyDeclarationSection>(SectionType.VN_COMETBFT_PUBLIC_KEY_DECLARATION);
    }

    async getRpcEndpointDeclaration() {
        const height = this.internalState.getRpcEndpointHeight();
        if (height === 0) throw new IllegalStateError("Node has not declared its RPC endpoint yet");
        const microblock = await this.getMicroblock(height);
        for (const section of microblock.getAllSections()) {
            if (section.type !== SectionType.VN_RPC_ENDPOINT) continue;
            const rpcEndpoint = section.rpcEndpoint;
            return rpcEndpoint;
        }
        throw new IllegalStateError("Node has not declared its RPC endpoint yet");
    }

    getNodeDeclarationHeight(): number {
        return this.getInternalState().getCometbftPublicKeyDeclarationHeight();
    }

    /**
     Update methods
     */
    /*
    async setSignatureScheme(object: any) {
      await this.addSection(SECTIONS.VN_SIG_SCHEME, object);
    }

    async setDeclaration(object: ValidatorNodeDeclarationSection) {
      await this.addSection(SECTIONS.VN_DECLARATION, object);
    }

    async setDescription(object: ValidatorNodeDescriptionSection) {
      await this.addSection(SECTIONS.VN_DESCRIPTION, object);
    }

    async setRpcEndpoint(object: ValidatorNodeRpcEndpointSection) {
      await this.addSection(SECTIONS.VN_RPC_ENDPOINT, object);
    }

    async setNetworkIntegration(object: ValidatorNodeVotingPowerUpdateSection) {
      await this.addSection(SECTIONS.VN_NETWORK_INTEGRATION, object);
    }

    async setSignature(privateKey: PrivateSignatureKey) {
      const object = this.createSignature(privateKey);
      await this.addSection(SECTIONS.VN_SIGNATURE, object);
    }

    getDescriptionHeight(): number {
      return this.getState().descriptionHeight;
    }

    getRpcEndpointHeight(): number {
      return this.getState().rpcEndpointHeight;
    }

    getNetworkIntegrationHeight(): number {
      return this.getState().networkIntegrationHeight;
    }

     */

    /**
     Section callbacks
     */

    /*
    async signatureSchemeCallback(microblock: any, section: any) {
      this.getState().signatureSchemeId = section.object.schemeId;
    }

    async declarationCallback(microblock: any, section: any) {
      this.getState().organizationId = section.object.organizationId;
    }

    async descriptionCallback(microblock: any, section: any) {
      this.getState().descriptionHeight = microblock.header.height;
    }

    async rpcEndpointCallback(microblock: any, section: any) {
      this.getState().rpcEndpointHeight = microblock.header.height;
    }

    async networkIntegrationCallback(microblock: any, section: any) {
      this.getState().networkIntegrationHeight = microblock.header.height;
    }

     */
    

    async getOrganizationVirtualBlockchain() {
        const orgId = this.internalState.getOrganizationId();
        return await this.provider.loadOrganizationVirtualBlockchain(orgId);
    }


}
