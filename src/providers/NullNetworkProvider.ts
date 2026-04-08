import {IExternalProvider} from "./IExternalProvider";
import {MicroblockInformation} from "../type/valibot/provider/MicroblockInformationSchema";
import {
    AbciResponse,
    AccountByPublicKeyHashAbciResponse,
    AccountHistoryAbciResponse,
    AccountStateAbciResponse,
    BlockContentAbciResponse,
    BlockInformationAbciResponse,
    ChainInformationAbciResponse,
    GenesisSnapshotAbciResponse,
    MicroblockBodysAbciResponse,
    ObjectListAbciResponse,
    ValidatorNodeByAddressAbciResponse,
    VirtualBlockchainUpdateAbciResponse
} from "../type/valibot/provider/abci/AbciResponse";
import {AbciRequest} from "../type/valibot/provider/abci/AbciRequest";

/**
 This is the dummy external provider for nodes.
 */
export class NullNetworkProvider implements IExternalProvider {
    constructor() {
    }

    sendSerializedMicroblock(serializedMicroblock: Uint8Array): Promise<any> {
        throw new Error("Method not implemented.");
    }
    awaitMicroblockAnchoring(hash: Uint8Array): Promise<MicroblockInformation> {
        throw new Error("Method not implemented.");
    }
    getChainInformation(): Promise<ChainInformationAbciResponse> {
        throw new Error("Method not implemented.");
    }
    getBlockInformation(height: number): Promise<BlockInformationAbciResponse> {
        throw new Error("Method not implemented.");
    }
    getBlockContent(height: number): Promise<BlockContentAbciResponse> {
        throw new Error("Method not implemented.");
    }
    getValidatorNodeByAddress(address: Uint8Array): Promise<ValidatorNodeByAddressAbciResponse> {
        throw new Error("Method not implemented.");
    }
    getAccountState(accountHash: Uint8Array): Promise<AccountStateAbciResponse> {
        throw new Error("Method not implemented.");
    }
    getAccountHistory(accountHash: Uint8Array, lastHistoryHash: Uint8Array, maxRecords: number): Promise<AccountHistoryAbciResponse> {
        throw new Error("Method not implemented.");
    }
    getAccountByPublicKeyHash(publicKeyHash: Uint8Array): Promise<AccountByPublicKeyHashAbciResponse> {
        throw new Error("Method not implemented.");
    }
    getObjectList(type: number): Promise<ObjectListAbciResponse> {
        throw new Error("Method not implemented.");
    }

    getMicroblockInformation(hash: Uint8Array): Promise<MicroblockInformation | null>  {
        return Promise.resolve(null);
    }

    getMicroblockBodys(hashes: Uint8Array[]): Promise<MicroblockBodysAbciResponse | null > {
        return Promise.resolve(null);
    }
    getVirtualBlockchainUpdate(virtualBlockchainId: Uint8Array, knownHeight: number): Promise<VirtualBlockchainUpdateAbciResponse> {
        throw new Error("Method not implemented.");
        //return Promise.resolve({ responseType: AbciResponseType.VIRTUAL_BLOCKCHAIN_UPDATE, exists: true, changed: false });
    }
    getSerializedVirtualBlockchainState(virtualBlockchainId: any): Promise<Uint8Array> {
        throw new Error("Method not implemented.");
    }
    broadcastTx(data: Uint8Array): Promise<any> {
        throw new Error("Method not implemented.");
    }
    abciQuery(request: AbciRequest): Promise<AbciResponse> {
        throw new Error("Method not implemented.");
    }
    getGenesisSnapshot(): Promise<GenesisSnapshotAbciResponse> {
        throw new Error("Method not implemented.");
    }



    /*
    async getMicroblockInformation() {
      return null;
    }

    async getMicroblockBodys() {
      return null;
    }

    async getVirtualBlockchainUpdate() {
      return { changed: false, exists: true };
    }

     */
}
