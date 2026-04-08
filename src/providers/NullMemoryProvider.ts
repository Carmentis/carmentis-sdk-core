import {Logger} from "../utils/Logger";
import {IInternalProvider} from "./IInternalProvider";
import {VirtualBlockchainInfo} from "../type/valibot/provider/VirtualBlockchainInfo";
import {MicroblockHeader} from "../type/valibot/blockchain/microblock/MicroblockHeader";
import {MicroblockBody} from "../type/valibot/blockchain/microblock/MicroblockBody";

/**
 * This class is for debugging purposes.
 * It describes a memory provider that does not actually store anything,
 * forcing the data to be fetched from the network.
 */
export class NullMemoryProvider implements IInternalProvider {

    private static logger = Logger.getMemoryProviderLogger();
    private static instance: NullMemoryProvider = new NullMemoryProvider();

    static getInstance() {
        return this.instance;
    }

    constructor() {
    }

    clear() {
        NullMemoryProvider.logger.info(`Clearing`);
    }

    async getSerializedInformationOfVirtualBlockchainContainingMicroblock(hash: Uint8Array): Promise<Uint8Array | null> {
        return null;
    }

    async getInformationOfVirtualBlockchainContainingMicroblock(hash: Uint8Array): Promise<VirtualBlockchainInfo | null> {
        return null;
    }

    async getMicroblock(identifier: Uint8Array): Promise<Uint8Array> {
        throw new Error("Method not implemented")
    }

    async getMicroblockHeader(identifier: Uint8Array) {
        return null;
    }

    async getSerializedMicroblockHeader(identifier: Uint8Array) {
        return null;
    }

    async getMicroblockBody(identifier: Uint8Array) {
        return null;
    }

    async getSerializedVirtualBlockchainState(identifier: Uint8Array) {
        return null;
    }

    async getAccountByPublicKeyHash(publicKeyHash: Uint8Array) {
        return null;
    }

    async setMicroblockVbInformation(identifier: Uint8Array, serializedVirtualBlockchainInfo: Uint8Array) {
    }

    async setSerializedMicroblockHeader(microblockHash: Uint8Array, serializedHeader: Uint8Array) {
    }

    async setSerializedMicroblockBody(microblockId: Uint8Array, serializedBody: Uint8Array) {
    }

    async setMicroblockHeader(identifier: Uint8Array, header: MicroblockHeader) {
    }

    async setMicroblockBody(identifier: Uint8Array, body: MicroblockBody) {
    }

    async setSerializedVirtualBlockchainState(identifier: Uint8Array, serializedstate: Uint8Array) {
    }
}
