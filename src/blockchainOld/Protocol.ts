export {}
/*

import {SECTIONS} from "../constants/constants";
import {ProtocolVb} from "./ProtocolVb";
import {Crypto} from "../crypto/crypto";
import {CMTSToken} from "../economics/currencies/token";
import {PublicSignatureKey} from "../crypto/signature/PublicSignatureKey";
import {PrivateSignatureKey} from "../crypto/signature/PrivateSignatureKey";
import {SignatureSchemeId} from "../crypto/signature/SignatureSchemeId";

export class Protocol {
  provider: any;
  signatureSchemeId?: SignatureSchemeId;
  vb: ProtocolVb;
  gasPrice: CMTSToken;

  constructor({
    provider
  }: any) {
    this.vb = new ProtocolVb({ provider });
    this.provider = provider;
    this.gasPrice = CMTSToken.zero();

    if (this.provider.isKeyed()) {
      const privateKey = this.provider.getPrivateSignatureKey();
      this.signatureSchemeId = privateKey.getSignatureSchemeId();
    }
  }

  async _create() {
    if (typeof this.signatureSchemeId === 'undefined') throw 'Cannot create a protocol VB without a signature scheme';
    await this.vb.setSignatureScheme(this.signatureSchemeId);

    if (!this.provider.isKeyed()) throw 'Cannot create a protocol VB without a keyed provider';
    const privateKey: PrivateSignatureKey = this.provider.getPrivateSignatureKey();
    const publicKey = privateKey.getPublicKey();
    await this.vb.setPublicKey(publicKey);
  }

  async _load(identifier: Uint8Array) {
    await this.vb.synchronizeVirtualBlockchain(identifier);
  }

  async getPublicKey() : Promise<PublicSignatureKey> {
    return await this.vb.getPublicKey();
  }

  setGasPrice(gasPrice: CMTSToken) {
    this.gasPrice = gasPrice;
  }

  getName() : string {
    throw 'Not implemented'
  }

  async publishUpdates(waitForAnchoring = true) {
    if (!this.provider.isKeyed()) throw 'Cannot publish updates without keyed provider.';
    const privateKey = this.provider.getPrivateSignatureKey();
    this.vb.setGasPrice(this.gasPrice);
    await this.vb.setSignature(privateKey);
    return await this.vb.publish(waitForAnchoring);
  }
}*/