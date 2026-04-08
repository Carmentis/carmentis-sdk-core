export {}
/*
import {SECTIONS} from "../constants/constants";
import {OrganizationVb} from "./OrganizationVb";
import {Crypto} from "../crypto/crypto";
import {CMTSToken} from "../economics/currencies/token";
import {PublicSignatureKey} from "../crypto/signature/PublicSignatureKey";
import {PrivateSignatureKey} from "../crypto/signature/PrivateSignatureKey";
import {SignatureSchemeId} from "../crypto/signature/SignatureSchemeId";
import {OrganizationNotFoundError, VirtualBlockchainNotFoundError} from "../errors/carmentis-error";
import {Hash} from "../entities/Hash";
import {OrganizationDescription} from "./sectionSchemas";

export class Organization {
  provider: any;
  signatureSchemeId?: SignatureSchemeId;
  vb: OrganizationVb;
  gasPrice: CMTSToken;

  constructor({
    provider
  }: any) {
    this.vb = new OrganizationVb({ provider });
    this.provider = provider;
    this.gasPrice = CMTSToken.zero();

    if (this.provider.isKeyed()) {
      const privateKey = this.provider.getPrivateSignatureKey();
      this.signatureSchemeId = privateKey.getSignatureSchemeId();
    }
  }

  async _create() {
    if (typeof this.signatureSchemeId === 'undefined') throw 'Cannot create an organization without a signature scheme';
    await this.vb.setSignatureScheme(this.signatureSchemeId);

    if (!this.provider.isKeyed()) throw 'Cannot create an organization without a keyed provider';
    const privateKey: PrivateSignatureKey = this.provider.getPrivateSignatureKey();
    const publicKey = privateKey.getPublicKey();
    await this.vb.setPublicKey(publicKey);
  }

  async _load(identifier: Uint8Array) {
    try {
        return await this.vb.synchronizeVirtualBlockchain(identifier);
    } catch (e) {
        if (e instanceof VirtualBlockchainNotFoundError) {
            throw new OrganizationNotFoundError(Hash.from(identifier));
        } else {
            throw e;
        }
    }
  }

  async setDescription(object: OrganizationDescription) {
    await this.vb.setDescription(object);
  }

  async getDescription() : Promise<OrganizationDescription> {
    // TODO (for all similar methods): the state may have changed and there may be a more recent description
    const microblock = await this.vb.getMicroblock(this.());
    const section = microblock.getSection<OrganizationDescription>(
        (section: any) => section.type == SECTIONS.ORG_DESCRIPTION
    );
    return section.object;
  }

  async getPublicKey() : Promise<PublicSignatureKey> {
    return await this.vb.getPublicKey();
  }

  setGasPrice(gasPrice: CMTSToken) {
    this.gasPrice = gasPrice;
  }

  getName() : string {
    throw 'Not implemented'
    //return this.vb.state.name;
  }

  async publishUpdates(waitForAnchoring = true) {
    if (!this.provider.isKeyed()) throw 'Cannot publish updates without keyed provider.';
    const privateKey = this.provider.getPrivateSignatureKey();
    this.vb.setGasPrice(this.gasPrice);
    await this.vb.setSignature(privateKey);
    return await this.vb.publish(waitForAnchoring);
  }
}

 */
