export {}
/*
import {Provider} from "../providers/Provider";
import {Explorer} from "./explorer";
import {MicroblockImporter} from "./MicroblockImporter";
import {Account} from "./Account";
import {Organization} from "./Organization";
import {ValidatorNode} from "./ValidatorNode";
import {Application} from "./Application";
import {ApplicationLedger} from "./ApplicationLedger";
import {Utils} from "../utils/utils";
import {EncoderFactory} from "../utils/encoder";
import {ImportedProof, Proof} from "./types";
import {Hash} from "../entities/Hash";
import {StateUpdateRequest} from "./StateUpdateRequest";
import {PublicSignatureKey} from "../crypto/signature/PublicSignatureKey";
import {
    AbstractPrivateDecryptionKey
} from "../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeInterface";


export type OperatorAnchorRequest = Omit<StateUpdateRequest, 'applicationId'>;


export class Blockchain {
  provider: Provider;
  constructor(provider: Provider) {
    this.provider = provider;
  }

  static createFromProvider(provider: Provider): Blockchain {
    return new Blockchain(provider);
  }

  getExplorer() {
    return new Explorer({ provider: this.provider });
  }

  getMicroblockImporter(data: Uint8Array) {
    return new MicroblockImporter({ data, provider: this.provider });
  }

  isKeyed() {
    return this.provider.isKeyed();
  }


  async createGenesisAccount(genesisPublicKey?: PublicSignatureKey) {
    if (!this.provider.isKeyed()) throw 'Cannot create a genesis account without a keyed provider.'
    const account = new Account({ provider: this.provider });
    await account._createGenesis(genesisPublicKey);
    return account;
  }


  async createAccount(sellerAccount: Hash, buyerPublicKey: PublicSignatureKey, amount: number) {
    if (!this.provider.isKeyed()) throw 'Cannot create an account without a keyed provider.'
    const hexEncoder = EncoderFactory.bytesToHexEncoder();
    const account = new Account({ provider: this.provider });
    await account._create(sellerAccount.toBytes(), buyerPublicKey, amount);
    return account;
  }



  async loadAccount(identifier: Hash) {
    const account = new Account({ provider: this.provider });
    await account._load(identifier.toBytes());
    return account;
  }


  async createOrganization() {
    const organization = new Organization({ provider: this.provider });
    await organization._create();
    return organization;
  }


  async loadOrganization(identifierString: Hash) {
    const organization = new Organization({ provider: this.provider });
    await organization._load(identifierString.toBytes());
    return organization;
  }


  async createValidatorNode(organizationIdentifierString: Hash) {
    const validatorNode = new ValidatorNode({ provider: this.provider });
    await validatorNode._create(organizationIdentifierString.toBytes());
    return validatorNode;
  }


  async loadValidatorNode(identifier: Hash) {
    const validatorNode = new ValidatorNode({ provider: this.provider });
    await validatorNode._load(identifier.toBytes());
    return validatorNode;
  }


  async createApplication(organizationIdentifierString: Hash) {
    const application = new Application({ provider: this.provider });
    await application._create(organizationIdentifierString.toBytes());
    return application;
  }


  async loadApplication(identifier: Hash) {
    const application = new Application({ provider: this.provider });
    await application._load(identifier.toBytes());
    return application;
  }


  async getApplicationLedgerFromJson(hostPrivateDecryptionKey: AbstractPrivateDecryptionKey, object: StateUpdateRequest) {
    const applicationLedger = new ApplicationLedger({ provider: this.provider });
    await applicationLedger._processJson(hostPrivateDecryptionKey, object);
    return applicationLedger;
  }


  async importApplicationLedgerProof(proof: Proof): Promise<ImportedProof[]> {
    const applicationLedger = new ApplicationLedger({ provider: this.provider });
    await applicationLedger._load(Utils.binaryFromHexa(proof.info.virtualBlockchainIdentifier));
    const data = await applicationLedger.importProof(proof);
    return data;
  }


  async createApplicationLedger() {
    if (!this.provider.isKeyed()) throw 'Cannot create application ledger without a keyed provider.'
    const applicationLedger = new ApplicationLedger({ provider: this.provider });
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    await applicationLedger._create();
    return applicationLedger;
  }

  async loadApplicationLedger(identifier: Hash) {
    const applicationLedger = new ApplicationLedger({ provider: this.provider });
    await applicationLedger._load(identifier.toBytes());
    return applicationLedger;
  }
}
*/