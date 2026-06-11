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
    ValidatorNodeByAddressAbciResponse,
    VirtualBlockchainUpdateAbciResponse
} from "../type/valibot/provider/abci/AbciResponse";
import {MicroblockStruct} from "../type/valibot/blockchain/microblock/MicroblockStruct";

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
    getMicroblockInformation(hash: Uint8Array): Promise<MicroblockInformation | null> ;
    getSerializedMicroblockByHeight(virtualBlockchainId: Uint8Array, height: number): Promise<Uint8Array | null>;
    getMicroblockBodys(hashes: Uint8Array[]): Promise<MicroblockBodysAbciResponse  | null>;
    getVirtualBlockchainUpdate(virtualBlockchainId: Uint8Array, knownStateHash: Uint8Array): Promise<VirtualBlockchainUpdateAbciResponse>;
    getSerializedVirtualBlockchainState(virtualBlockchainId: any): Promise<Uint8Array>;
    broadcastTx(data: Uint8Array): Promise<any>;
    abciQuery(request: AbciRequest): Promise<AbciResponse>
    getGenesisSnapshot(): Promise<GenesisSnapshotAbciResponse>;
}
