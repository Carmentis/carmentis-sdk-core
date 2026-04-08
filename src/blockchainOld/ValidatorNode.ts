export {}
/*
import {SECTIONS} from "../constants/constants";
import {ValidatorNodeVb} from "./ValidatorNodeVb";
import {CMTSToken} from "../economics/currencies/token";
import {Hash} from "../entities/Hash";
import {Provider} from "../providers/Provider";
import {PublicSignatureKey} from "../crypto/signature/PublicSignatureKey";
import {
    ValidatorNodeDeclarationSection,
    ValidatorNodeDescriptionSection,
    ValidatorNodeVotingPowerUpdateSection,
    ValidatorNodeRpcEndpointSection
} from "./sectionSchemas";

export class ValidatorNode {
  provider: any;
  signatureSchemeId: any;
  vb: ValidatorNodeVb;
  gasPrice: CMTSToken;

  constructor({
      provider
    }: { provider: Provider }) {
    this.vb = new ValidatorNodeVb(provider);
    this.provider = provider;
    this.gasPrice = CMTSToken.zero();

    if (this.provider.isKeyed()) {
      const privateKey = this.provider.getPrivateSignatureKey();
      this.signatureSchemeId = privateKey.getSignatureSchemeId();
    }
  }

  async _create(organizationId: any) {
    await this.vb.setSignatureScheme({
      schemeId: this.signatureSchemeId
    });

    await this.vb.setDeclaration({
      organizationId
    });
  }

  async _load(identifier: any) {
    await this.vb.synchronizeVirtualBlockchain(identifier);
  }

  async setDescription(object: ValidatorNodeDescriptionSection) {
    await this.vb.setDescription(object);
  }

  async setRpcEndpoint(object: ValidatorNodeRpcEndpointSection) {
    await this.vb.setRpcEndpoint(object);
  }

  async setNetworkIntegration(object: ValidatorNodeVotingPowerUpdateSection) {
    await this.vb.setNetworkIntegration(object);
  }

  setGasPrice(gasPrice: CMTSToken) {
    this.gasPrice = gasPrice;
  }

  async getDeclaration() {
    const microblock = await this.vb.getFirstMicroBlock();
    const section = microblock.getSection<ValidatorNodeDeclarationSection>(
        (section: any) => section.type == SECTIONS.VN_DECLARATION
    );
    return section.object;
  }

  async getDescription() {
    const microblock = await this.vb.getMicroblock(this.vb.getDescriptionHeight());
    const section = microblock.getSection<ValidatorNodeDescriptionSection>(
        (section: any) => section.type == SECTIONS.VN_DESCRIPTION
    );
    return section.object;
  }

  async getRpcEndpoint() {
    const microblock = await this.vb.getMicroblock(this.vb.getRpcEndpointHeight());
    const section = microblock.getSection<ValidatorNodeRpcEndpointSection>(
        (section: any) => section.type == SECTIONS.VN_RPC_ENDPOINT
    );
    return section.object;
  }

  async getNetworkIntegration() {
    const height = this.vb.getNetworkIntegrationHeight();

    if(!height) {
      return { votingPower: 0 };
    }

    const microblock = await this.vb.getMicroblock(height);
    const section = microblock.getSection<ValidatorNodeVotingPowerUpdateSection>(
        (section: any) => section.type == SECTIONS.VN_NETWORK_INTEGRATION
    );
    return section.object;
  }

  async getOrganizationId(): Promise<Hash> {
    const declaration = await this.getDeclaration();
    return Hash.from(declaration.organizationId);
  }

  async getOrganizationPublicKey(): Promise<PublicSignatureKey> {
    return await this.vb.getOrganizationPublicKey();
  }

  async publishUpdates(waitForAnchoring = true) {
    if (!this.provider.isKeyed()) throw 'Cannot publish updates without keyed provider.'
    const privateKey = this.provider.getPrivateSignatureKey();
    this.vb.setGasPrice(this.gasPrice);
    await this.vb.setSignature(privateKey);
    return await this.vb.publish(waitForAnchoring);
  }
}

 */
