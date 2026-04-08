import {MicroblockHeader} from "../type/valibot/blockchain/microblock/MicroblockHeader";
import {VirtualBlockchainInfo} from "../type/valibot/provider/VirtualBlockchainInfo";
import {MicroblockBody} from "../type/valibot/blockchain/microblock/MicroblockBody";

export interface IInternalProvider {
    getSerializedInformationOfVirtualBlockchainContainingMicroblock(hash: Uint8Array): Promise<Uint8Array | null>;
    getInformationOfVirtualBlockchainContainingMicroblock(hash: Uint8Array): Promise<VirtualBlockchainInfo | null>;

    getMicroblock(identifier: Uint8Array): Promise<Uint8Array>;

    getSerializedMicroblockHeader(identifier: Uint8Array): Promise<Uint8Array | null>;
    getMicroblockHeader(identifier: Uint8Array): Promise<MicroblockHeader | null>;

    getMicroblockBody(identifier: Uint8Array): Promise<Uint8Array | null>;

    getSerializedVirtualBlockchainState(identifier: Uint8Array): Promise<Uint8Array | null>;

    getAccountByPublicKeyHash(publicKeyHash: Uint8Array): Promise<Uint8Array | null>;

    setMicroblockVbInformation(identifier: Uint8Array, data: Uint8Array): Promise<void>;

    setSerializedMicroblockHeader(identifier: Uint8Array, serializedHeader: Uint8Array): Promise<void>;
    setSerializedMicroblockBody(identifier: Uint8Array, serializedBody: Uint8Array): Promise<void>;
    setMicroblockHeader(identifier: Uint8Array, header: MicroblockHeader): Promise<void>;
    setMicroblockBody(identifier: Uint8Array, body: MicroblockBody): Promise<void>;

    setSerializedVirtualBlockchainState(identifier: Uint8Array, data: Uint8Array): Promise<void>;

}