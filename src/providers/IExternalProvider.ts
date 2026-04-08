import {MicroblockInformation} from "../type/valibot/provider/MicroblockInformationSchema";
import {AbciRequest} from "../type/valibot/provider/abci/AbciRequest";
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

export interface IExternalProvider {
    sendSerializedMicroblock(serializedMicroblock: Uint8Array): Promise<any>;

    awaitMicroblockAnchoring(hash: Uint8Array): Promise<MicroblockInformation>;

    getChainInformation(): Promise<ChainInformationAbciResponse>;

    getBlockInformation(height: number): Promise<BlockInformationAbciResponse>;

    getBlockContent(height: number): Promise<BlockContentAbciResponse>;

    getValidatorNodeByAddress(address: Uint8Array): Promise<ValidatorNodeByAddressAbciResponse>;

    getAccountState(accountHash: Uint8Array): Promise<AccountStateAbciResponse>;

    getAccountHistory(accountHash: Uint8Array, lastHistoryHash: Uint8Array, maxRecords: number): Promise<AccountHistoryAbciResponse>;

    getAccountByPublicKeyHash(publicKeyHash: Uint8Array): Promise<AccountByPublicKeyHashAbciResponse>;

    getObjectList(type: number): Promise<ObjectListAbciResponse>;

    getMicroblockInformation(hash: Uint8Array): Promise<MicroblockInformation | null> ;

    getMicroblockBodys(hashes: Uint8Array[]): Promise<MicroblockBodysAbciResponse  | null>;

    getVirtualBlockchainUpdate(virtualBlockchainId: Uint8Array, knownHeight: number): Promise<VirtualBlockchainUpdateAbciResponse>;

    getSerializedVirtualBlockchainState(virtualBlockchainId: any): Promise<Uint8Array>;

    broadcastTx(data: Uint8Array): Promise<any>;

    abciQuery(request: AbciRequest): Promise<AbciResponse>

    getGenesisSnapshot(): Promise<GenesisSnapshotAbciResponse>;

}