import {Utils} from "../utils/utils";
import {Logger} from "../utils/Logger";
import {IInternalProvider} from "./IInternalProvider";
import {BlockchainUtils} from "../utils/BlockchainUtils";
import {VirtualBlockchainInfo} from "../type/valibot/provider/VirtualBlockchainInfo";
import {MicroblockHeader} from "../type/valibot/blockchain/microblock/MicroblockHeader";
import {MicroblockBody} from "../type/valibot/blockchain/microblock/MicroblockBody";
import {Crypto} from "../crypto/crypto";

type StringToBinaryMap = Map<string, string>

export class MemoryProvider implements IInternalProvider {

    private static logger = Logger.getMemoryProviderLogger();
    private static instance: MemoryProvider = new MemoryProvider();

    static getInstance() {
        return this.instance;
    }

    private microblockHeaderStore: StringToBinaryMap;
    private microblockBodyStore: StringToBinaryMap;
    private microblockVbInformationStore: StringToBinaryMap;
    private virtualBlockchainStateStore: StringToBinaryMap;

    constructor() {
        this.microblockHeaderStore = new Map;
        this.microblockBodyStore = new Map;
        this.microblockVbInformationStore = new Map;
        this.virtualBlockchainStateStore = new Map;
    }

    clear() {
        MemoryProvider.logger.info(`Clearing`);
        this.microblockHeaderStore = new Map;
        this.microblockBodyStore = new Map;
        this.microblockVbInformationStore = new Map;
        this.virtualBlockchainStateStore = new Map;
    }

    async getSerializedInformationOfVirtualBlockchainContainingMicroblock(hash: Uint8Array): Promise<Uint8Array | null> {
        const result = await MemoryProvider.get(this.microblockVbInformationStore, hash);
        MemoryProvider.logger.info(`getMicroblockVbInformation identifier=${Utils.binaryToHexa(hash)} -> ${result ? result.length : 0} bytes`);
        return result;
    }

    async getInformationOfVirtualBlockchainContainingMicroblock(hash: Uint8Array): Promise<VirtualBlockchainInfo | null> {
        const serializedInfo = await this.getSerializedInformationOfVirtualBlockchainContainingMicroblock(hash);
        if (serializedInfo === null) return null;
        return BlockchainUtils.decodeVirtualBlockchainInfo(serializedInfo);
    }

    async getMicroblock(identifier: Uint8Array): Promise<Uint8Array> {
        throw new Error("Method not implemented")
    }


    async getMicroblockHeader(identifier: Uint8Array) {
        const result = await MemoryProvider.get(this.microblockHeaderStore, identifier);
        if (result === null) {
            MemoryProvider.logger.info("Header not found locally: returning null")
            return null
        } else {
            const header = BlockchainUtils.decodeMicroblockHeader(result);
            MemoryProvider.logger.info(`Header of microblock with identifier=${Utils.binaryToHexa(identifier)} found: {header}`, {header});
            return header;
        }
    }

    async getSerializedMicroblockHeader(identifier: Uint8Array) {
        const result = await MemoryProvider.get(this.microblockHeaderStore, identifier);
        if (result === null) {
            MemoryProvider.logger.info("Header not found locally: returning null")
            return null
        } else {
            const resultHash = Crypto.Hashes.sha256(result);
            const header = BlockchainUtils.decodeMicroblockHeader(result);
            MemoryProvider.logger.info(`Header of microblock with identifier (sha256:${resultHash})=${Utils.binaryToHexa(identifier)} found: {header}`, {
                header: JSON.stringify(header)
            });
            return result;
        }
    }

    async getMicroblockBody(identifier: Uint8Array) {
        const result = await MemoryProvider.get(this.microblockBodyStore, identifier);
        MemoryProvider.logger.info(`getMicroblockBody identifier=${Utils.binaryToHexa(identifier)} -> ${result ? result.length : 0} bytes`);
        return result;
    }

    async getSerializedVirtualBlockchainState(identifier: Uint8Array) {
        const result = await MemoryProvider.get(this.virtualBlockchainStateStore, identifier);
        MemoryProvider.logger.info(`getVirtualBlockchainState identifier=${Utils.binaryToHexa(identifier)} -> ${result ? result.length : 0} bytes`);
        return result;
    }

    async getAccountByPublicKeyHash(publicKeyHash: Uint8Array) {
        // TODO: this could (and should) be cached locally in order to avoid querying the network each time
        return null;
    }

    async setMicroblockVbInformation(identifier: Uint8Array, serializedVirtualBlockchainInfo: Uint8Array) {
        const info = BlockchainUtils.decodeVirtualBlockchainInfo(serializedVirtualBlockchainInfo)
        MemoryProvider.logger.info(`Store info of vb identifier=${Utils.binaryToHexa(identifier)}: {info}`, { info });
        return await MemoryProvider.set(this.microblockVbInformationStore, identifier, serializedVirtualBlockchainInfo);
    }


    async setSerializedMicroblockHeader(microblockHash: Uint8Array, serializedHeader: Uint8Array) {
        const header= BlockchainUtils.decodeMicroblockHeader(serializedHeader);
        MemoryProvider.logger.info(`Store header of microblock identifier=${Utils.binaryToHexa(microblockHash)} -> {header}`, {header});
        return await MemoryProvider.set(this.microblockHeaderStore, microblockHash, serializedHeader);
    }

    async setSerializedMicroblockBody(microblockId: Uint8Array, serializedBody: Uint8Array) {
        const body = BlockchainUtils.decodeMicroblockBody(serializedBody);
        MemoryProvider.logger.info(`Store body of microblock ${Utils.binaryToHexa(microblockId)}: {body}`, { body });
        return await MemoryProvider.set(this.microblockBodyStore, microblockId, serializedBody);
    }

    async setMicroblockHeader(identifier: Uint8Array, header: MicroblockHeader) {
        const data = BlockchainUtils.encodeMicroblockHeader(header);
        await this.setSerializedMicroblockHeader(identifier, data);
    }

    async setMicroblockBody(identifier: Uint8Array, body: MicroblockBody) {
        const data =  BlockchainUtils.encodeMicroblockBody(body);
        await this.setSerializedMicroblockBody(identifier, data);
    }

    async setSerializedVirtualBlockchainState(identifier: Uint8Array, serializedstate: Uint8Array) {
        const state = BlockchainUtils.decodeVirtualBlockchainState(serializedstate);
        MemoryProvider.logger.info(`Store vb state for vb ${Utils.binaryToHexa(identifier)}: {state}`, {state});
        return await MemoryProvider.set(this.virtualBlockchainStateStore, identifier, serializedstate);
    }

    static async get(store: StringToBinaryMap, identifier: Uint8Array): Promise<Uint8Array | null> {
        const key = Utils.binaryToHexa(identifier);
        if (!store.has(key)) {
            return null;
        }
        const result = store.get(key);
        if (result === undefined) return null;
        return Utils.binaryFromHexa(result)
    }

    static async set(store: StringToBinaryMap, identifier: Uint8Array, data: Uint8Array) {
        const key = Utils.binaryToHexa(identifier);
        const encodedData = Utils.binaryToHexa(data);
        const encodedStoredData = store.get(key);
        if (encodedStoredData !== undefined) {
            if (encodedStoredData === encodedData) {
                MemoryProvider.logger.info(`Storing the same data for the same key ${key}`)
            } else {
                MemoryProvider.logger.info(`Storing new data for key ${key}`)
            }
        } else {
            MemoryProvider.logger.info(`Storing new entry for key ${key}`)
        }
        store.set(key, encodedData);
    }
}
