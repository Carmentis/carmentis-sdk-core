export {}
/*
import {Provider} from "./Provider";
import {
    AccountHash,
    AccountHistoryInterface,
    AccountStateDTO,
    MicroblockInformationSchema,
    MsgVirtualBlockchainState,
    Proof
} from "../blockchain/types";
import axios, {AxiosError} from "axios";
import {Utils} from "../utils/utils";
import {MessageSerializer, MessageUnserializer} from "../data/messageSerializer";
import {Base64} from "../data/base64";
import {SCHEMAS} from "../constants/constants";
import {CMTSToken} from "../economics/currencies/token";
import {
    AccountNotFoundForAccountHashError,
    ApplicationLedgerNotFoundError,
    ApplicationNotFoundError, NodeConnectionRefusedError,
    NodeError, NotAuthenticatedError,
    OrganizationNotFoundError,
    VirtualBlockchainNotFoundError
} from "../errors/carmentis-error";
import {AccountHistoryView} from "../entities/AccountHistoryView";
import {CryptoSchemeFactory} from "../crypto/CryptoSchemeFactory";
import {CryptographicHash} from "../crypto/hash/hash-interface";
import {VirtualBlockchainType} from "../entities/VirtualBlockchainType";
import {BlockchainUtils} from "../blockchain/blockchainUtils";
import {VirtualBlockchainStateWrapper} from "../wrappers/VirtualBlockchainStateWrapper";
import {MicroBlockInformation} from "../entities/MicroBlockInformation";
import {Hash} from "../entities/Hash";
import {AccountState} from "../entities/AccountState";
import {ApplicationLedger} from "../blockchain/ApplicationLedger";
import {Application} from "../blockchain/Application";
import {Organization} from "../blockchain/Organization";
import {ValidatorNode} from "../blockchain/ValidatorNode";
import {MemoryProvider} from "./MemoryProvider";
import {NetworkProvider} from "./NetworkProvider";
import {KeyedProvider} from "./KeyedProvider";
import {ProofVerificationResult} from "../entities/ProofVerificationResult";
import {Microblock} from "../blockchain/Microblock";
import {VB_ACCOUNT, VB_APPLICATION, VB_ORGANIZATION, VB_VALIDATOR_NODE} from "../constants/chain";
import {RPCNodeStatusResponseType} from "./nodeRpc/RPCNodeStatusResponseType";
import {VirtualBlockchainWrapper} from "../wrappers/VirtualBlockchainWrapper";
import {MicroBlockHeaderWrapper} from "../wrappers/MicroBlockHeaderWrapper";
import {PublicSignatureKey} from "../crypto/signature/PublicSignatureKey";
import {PrivateSignatureKey} from "../crypto/signature/PrivateSignatureKey";
import {BlockchainClient} from "./BlockchainClient";
import { AbstractPrivateDecryptionKey, StateUpdateRequest } from "../common";

export class ABCINodeUnauthenticatedBlockchainClient implements BlockchainClient {

    static createFromNodeURL(nodeUrl: string): ABCINodeUnauthenticatedBlockchainClient {
        return new ABCINodeUnauthenticatedBlockchainClient(nodeUrl);
    }

    private networkProvider: NetworkProvider;
    private publicProvider: Provider;

    protected constructor(
        protected nodeUrl: string,
        private cacheProvider: MemoryProvider = MemoryProvider.getInstance(),
        provider?: Provider
    ) {
        this.networkProvider = new NetworkProvider(nodeUrl);
        this.publicProvider = provider instanceof Provider ? provider : new Provider(cacheProvider, this.networkProvider);
    }

    createGenesisAccount(): Promise<Account> {
        throw new NotAuthenticatedError();
    }
    createAccount(sellerAccount: Hash, buyerPublicKey: PublicSignatureKey, amount: CMTSToken): Promise<Account> {
        throw new NotAuthenticatedError();
    }
    createOrganization(): Promise<Organization> {
        throw new NotAuthenticatedError();
    }
    createValidatorNode(organizationIdentifierString: Hash): Promise<ValidatorNode> {
        throw new NotAuthenticatedError();
    }
    createApplication(organizationIdentifierString: Hash): Promise<Application> {
        throw new NotAuthenticatedError();
    }
    createApplicationLedger(applicationId: Hash, expirationDay: number): Promise<ApplicationLedger> {
        throw new NotAuthenticatedError();
    }
    createApplicationLedgerFromJson<T = any>(privateDecryptionKey: AbstractPrivateDecryptionKey, object: StateUpdateRequest<T>, expirationDay: number): Promise<ApplicationLedger> {
        throw new NotAuthenticatedError();
    }
    createTokenTransfer(sellerPrivateKey: PrivateSignatureKey, buyerAccount: Hash, amount: CMTSToken, publicReference: string, privateReference: string, gasPrice: CMTSToken): Promise<any> {
        throw new NotAuthenticatedError();
    }

    async getChainInformation() {
        return await this.networkProvider.getChainInformation();
    }

    async getBlockInformation(height: number) {
        return await this.networkProvider.getBlockInformation(height);
    }

    async getBlockContent(height: number) {
        return await this.networkProvider.getBlockContent(height);
    }

    async getValidatorNodeByAddress(address: Uint8Array) {
        const validatorNodeDto = await this.networkProvider.getValidatorNodeByAddress(address);
        return Hash.from(validatorNodeDto.validatorNodeHash);
    }

    async getPublicKeyOfOrganization(organizationId: Hash): Promise<PublicSignatureKey> {
        const organization = await this.loadOrganization(organizationId);
        return organization.getPublicKey();
    }

    async getMicroBlock(type: VirtualBlockchainType, hash: Hash): Promise<Microblock> {
        const info = await this.publicProvider.getMicroblockInformation(hash.toBytes());

        if(info === null) {
          throw new Error("unable to load microblock");
        }

        const bodyList = await this.publicProvider.getMicroblockBodys([ hash.toBytes() ]);

        const microblock = new Microblock(type);
        microblock.load(info.header, bodyList[0].body);

        return microblock;
    }

    async getManyMicroBlock(type: VirtualBlockchainType, hashes: Hash[]): Promise<Microblock[]> {
        return Promise.all(hashes.map(async hash => {
            return this.getMicroBlock(type, hash)
        }))
    }

    async getVirtualBlockchain(vbId: Hash){
        const content = await this.publicProvider.getVirtualBlockchainContent(vbId.toBytes());
        if (content === null || content.state === undefined) throw new NodeError("Invalid response from node")
        const state = new VirtualBlockchainStateWrapper(vbId, content.state);
        const hashes = content.microblockHashes.map(Hash.from);
        return new VirtualBlockchainWrapper(state, hashes)
    }

    async getMicroblockInformation(hash: Hash): Promise<MicroBlockInformation> {
        const answer = await this.publicProvider.getMicroblockInformation(hash.toBytes());

        if(answer === null) {
            throw new Error("unable to load microblock information");
        }

        // parse the header
        const header = new MicroBlockHeaderWrapper(
            BlockchainUtils.decodeMicroblockHeader(answer.header)
        );

        // parse and retrieve virtual blockchain state
        const virtualBlockchainId = Hash.from(answer.virtualBlockchainId);
        const virtualBlockchainState = await this.getVirtualBlockchainState(virtualBlockchainId);

        return new MicroBlockInformation(header, virtualBlockchainState);
    }

    async lockUntilMicroBlockPublished(microblockHash: Hash): Promise<Hash> {
        const answer = await this.networkProvider.awaitMicroblockAnchoring(microblockHash.toBytes());
        return Hash.from(answer.virtualBlockchainId);
    }

    private static DEFAULT_MAX_RECORDS_HISTORY = 100;
    async getAccountHistory(accountHash: Hash, lastHistoryHash?: Hash, maxRecords: number= ABCINodeUnauthenticatedBlockchainClient.DEFAULT_MAX_RECORDS_HISTORY): Promise<AccountHistoryView> {
        // we first search for the account state
        const accountState = await this.getAccountState(accountHash);
        if (accountState.isEmpty()) throw new AccountNotFoundForAccountHashError(accountHash);

        // use the last history hash from the account state if not provided
        let usedLastHistoryHash;
        if (lastHistoryHash === undefined) {
            usedLastHistoryHash = accountState.getLastHistoryHash();
        } else {
            usedLastHistoryHash = lastHistoryHash;
        }

        // search the account
        const answer = await this.networkProvider.getAccountHistory(accountHash.toBytes(), usedLastHistoryHash.toBytes(), maxRecords);
        //console.log(`Here is the transactions history for account ${accountHash.encode()}:`, answer)

        // convert the response into transactions
        const transactions = new AccountHistoryView();
        for (const t of answer.list) {
            transactions.setTransactionAtHeight(t.height, t);
        }

        return transactions;
    }

    async getAccountState(accountHash: Hash): Promise<AccountState> {
        const answer = await this.networkProvider.getAccountState(accountHash.toBytes());
        const state = AccountState.createFromDTO(answer);
        if (state.isEmpty()) throw new AccountNotFoundForAccountHashError(accountHash);
        return state;
    }

    async getBalanceOfAccount(accountHash: Hash): Promise<CMTSToken> {
        const accountState = await this.getAccountState(accountHash);
        return accountState.getBalance();
    }

    async getAccountByPublicKey(publicKey: PublicSignatureKey, hashScheme: CryptographicHash = CryptoSchemeFactory.createDefaultCryptographicHash()): Promise<Hash> {
        const answer = await this.networkProvider.getAccountByPublicKeyHash(hashScheme.hash(publicKey.getPublicKeyAsBytes()));
        return Hash.from(answer.accountHash);
    }

    async getVirtualBlockchainState(vbId: Hash): Promise<VirtualBlockchainStateWrapper> {
        const answer = await this.networkProvider.getVirtualBlockchainState(vbId.toBytes());
        const state =  BlockchainUtils.decodeVirtualBlockchainState(answer.stateData);
        return new VirtualBlockchainStateWrapper(vbId, state);
    }


    async loadApplicationLedger(vbId: Hash, provider: Provider = this.publicProvider): Promise<ApplicationLedger> {
       try {
           const applicationLedger = new ApplicationLedger({ provider });
           await applicationLedger._load(vbId.toBytes());
           return applicationLedger;
       } catch (e) {
           if (e instanceof VirtualBlockchainNotFoundError) {
               throw new ApplicationLedgerNotFoundError(vbId);
           } else {
               throw e
           }
       }
    }

    async loadValidatorNode(identifier: Hash): Promise<ValidatorNode> {
        try {
            const validatorNode = new ValidatorNode({ provider: this.publicProvider });
            await validatorNode._load(identifier.toBytes());
            return validatorNode;
        } catch (e) {
            if (e instanceof VirtualBlockchainNotFoundError) {
                throw new ApplicationNotFoundError(identifier)
            } else {
                throw e
            }
        }
    }

    async loadApplication(identifier: Hash): Promise<Application> {
       try {
           const application = new Application({ provider: this.publicProvider });
           await application._load(identifier.toBytes());
           return application;
       } catch (e) {
           if (e instanceof VirtualBlockchainNotFoundError) {
               throw new ApplicationNotFoundError(identifier)
           } else {
               throw e
           }
       }
    }

    async loadOrganization(vbId: Hash): Promise<Organization> {
        try {
            const organization = new Organization({ provider: this.publicProvider });
            await organization._load(vbId.toBytes());
            return organization;
        } catch (e) {
            if (e instanceof VirtualBlockchainNotFoundError) {
                throw new OrganizationNotFoundError(vbId);
            } else {
                throw e
            }
        }
    }

    async loadAccount(identifier: Hash) {
        try {
            const account = new Account({ provider: this.publicProvider });
            await account._load(identifier.toBytes());
            return account;
        } catch (e) {
            if (e instanceof VirtualBlockchainNotFoundError) {
                throw new AccountNotFoundForAccountHashError(identifier);
            } else {
                throw e
            }
        }
    }

    async getRecord<T = any>(vbId: Hash, height: number, privateSignatureKey?: PrivateSignatureKey): Promise<T> {
        // decide if we use keyed provider or public provider
        const provider = privateSignatureKey !== undefined ? new KeyedProvider(privateSignatureKey, this.cacheProvider, this.networkProvider) : this.publicProvider;
        const appLedger = await this.loadApplicationLedger(vbId, provider);
        return appLedger.getRecord(height);
    }

    async verifyProofFromJson(proof: Proof) {
        // import the app ledger
        const appLedger = new ApplicationLedger({ provider: this.publicProvider });
        await appLedger._load(Utils.binaryFromHexa(proof.info.virtualBlockchainIdentifier));
        try {
            const importedProof = await appLedger.importProof(proof);
            return ProofVerificationResult.createSuccessfulProofVerificationResult(appLedger, importedProof);
        } catch (e) {
            if (e instanceof ProofVerificationResult) {
                return ProofVerificationResult.createFailedProofVerificationResult(appLedger)
            } else {
                throw e
            }
        }
    }


    async getAllAccounts() {
        return await this.getObjectList(VB_ACCOUNT);
    }

    async getAllValidatorNodes() {
        return await this.getObjectList(VB_VALIDATOR_NODE);
    }


    async getAllOrganizations() {
        return await this.getObjectList(VB_ORGANIZATION);
    }

    async getNodeStatus(): Promise<RPCNodeStatusResponseType> {
        return NetworkProvider.sendStatusQueryToNodeServer(this.nodeUrl);
    }

    async getAllApplications() {
        return await this.getObjectList(VB_APPLICATION);
    }

    private async getObjectList( objectType: number ): Promise<Hash[]> {
        const response = await this.publicProvider.getObjectList(objectType);
        return response.list.map(Hash.from)
    }
}

 */