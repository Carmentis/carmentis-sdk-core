import {Base64} from "../data/base64";
import {Utils} from "../utils/utils";
import * as v from 'valibot';
import axios, {AxiosError} from "axios";
import {
    IllegalParameterError,
    NodeConnectionRefusedError,
    NodeEndpointClosedWhileCatchingUpError,
    NodeError
} from "../errors/carmentis-error";
import {CometBFTErrorCode} from "../errors/CometBFTErrorCode";
import {RPCNodeStatusResponseSchema} from "./nodeRpc/RPCNodeStatusResponseSchema";
import {Logger} from "../utils/Logger";
import {IExternalProvider} from "./IExternalProvider";
import {CMTSToken} from "../economics/currencies/token";
import {MicroblockInformation, MicroblockInformationSchema} from "../type/valibot/provider/MicroblockInformationSchema";
import {AbciRequest, AbciRequestType} from "../type/valibot/provider/abci/AbciRequest";
import {
    AbciResponse,
    AbciResponseType,
    AccountByPublicKeyHashAbciResponseSchema,
    AccountHistoryAbciResponseSchema,
    AccountStateAbciResponseSchema,
    BlockContentAbciResponseSchema,
    BlockInformationAbciResponseSchema,
    ChainInformationAbciResponseSchema,
    GenesisSnapshotAbciResponse,
    GenesisSnapshotAbciResponseSchema,
    MicroblockBodysAbciResponse,
    MicroblockBodysAbciResponseSchema,
    MicroblockInformationAbciResponseSchema,
    ObjectListAbciResponseSchema,
    ValidatorNodeByAddressAbciResponseSchema,
    VirtualBlockchainStateAbciResponseSchema,
    VirtualBlockchainUpdateAbciResponseSchema
} from "../type/valibot/provider/abci/AbciResponse";
import {AbciQueryEncoder} from "../utils/AbciQueryEncoder";
import {EncoderFactory} from "../utils/encoder";

export class NetworkProvider implements IExternalProvider {
    private static staticLogger = Logger.getNetworkProviderLogger();
    private logger = NetworkProvider.staticLogger;
    private requestLogger = NetworkProvider.staticLogger.getChild("request");
    private responseLogger = NetworkProvider.staticLogger.getChild("response");

    static createFromUrl(url: string): NetworkProvider {
        const logger = NetworkProvider.staticLogger;
        logger.debug(`NetworkProvider constructor -> nodeUrl: ${url}`);
        try {
            new URL(url);
            return new NetworkProvider(url);
        } catch(e) {
            throw new IllegalParameterError(`Invalid node URL: got ${url}`);
        }
    }

    constructor(private readonly nodeUrl: string) {}

    async sendSerializedMicroblock(serializedMicroblock: Uint8Array) {
        this.requestLogger.info(`Sending serialized microblock (${serializedMicroblock.length} bytes)`);
        const answer = await this.broadcastTx(serializedMicroblock);

        this.responseLogger.info(`Received response: <- {data}`, () => ({
            data: answer?.data
        }));
        return answer;
    }

    async awaitMicroblockAnchoring(hash: Uint8Array) {
        const hashString =  Utils.binaryToHexa(hash);
        this.requestLogger.info(`Awaiting microblock {hash} to be published...`, () => ({
            hash: hashString
        }));

        const answer = await this.abciQuery({
            requestType: AbciRequestType.AWAIT_MICROBLOCK_ANCHORING,
            hash: hash
        });
        return v.parse(MicroblockInformationSchema, answer);
    }

    async getChainInformation() {
        this.requestLogger.info(`Requesting chain information`);

        const answer = await this.abciQuery({
            requestType: AbciRequestType.GET_CHAIN_INFORMATION,
        });

        return v.parse(ChainInformationAbciResponseSchema, answer);
    }

    async getBlockInformation(height: number) {
        this.requestLogger.info(`Requesting block information at height: ${height}`);

        const answer = await this.abciQuery({
            requestType: AbciRequestType.GET_BLOCK_INFORMATION,
            height: height
        });

        this.responseLogger.info(`Received block information at height ${height}`)
        return v.parse(BlockInformationAbciResponseSchema, answer);
    }

    async getBlockContent(height: number) {
        this.requestLogger.info(`Requesting block content for height ${height}`);

        const answer = await this.abciQuery({
            requestType: AbciRequestType.GET_BLOCK_CONTENT,
            height: height
        });
        const blockContentResponse = v.parse(BlockContentAbciResponseSchema, answer);

        this.responseLogger.info(`Received block content for height ${height}: ${blockContentResponse.microblocks.length} microblocks received`);
        return blockContentResponse
    }

    async getValidatorNodeByAddress(address: Uint8Array) {
        this.requestLogger.info(`Requesting validator node id for address {address}`, () => ({
            address: Utils.binaryToHexa(address)}
        ));

        const answer = await this.abciQuery({
            requestType: AbciRequestType.GET_VALIDATOR_NODE_BY_ADDRESS,
            address: address
        });

        this.responseLogger.info(`Receiving validator node id {id}`, () => ({
            id: Utils.binaryToHexa(address)
        }));
        return v.parse(ValidatorNodeByAddressAbciResponseSchema, answer);
    }

    async getAccountState(accountHash: Uint8Array) {
        this.requestLogger.info(`Requesting account state for account hash {accountHash}`, () => ({
            accountHash: Utils.binaryToHexa(accountHash)
        }));

        const answer = await this.abciQuery({
            requestType: AbciRequestType.GET_ACCOUNT_STATE,
            accountHash: accountHash
        });

        const response = v.parse(AccountStateAbciResponseSchema, answer);
        this.responseLogger.info(`Receiving account state: height={height}, balance={balance}`, () => {
            const height = response.height;
            const balance = CMTSToken.createAtomic(response.balance).toString();
            return {height, balance}
        });
        return response;
    }

    async getAccountHistory(accountHash: Uint8Array, lastHistoryHash: Uint8Array, maxRecords: number) {
        this.requestLogger.info(`Requesting account history for account hash: ${Utils.binaryToHexa(accountHash)}, lastHistoryHash: ${Utils.binaryToHexa(lastHistoryHash)}, maxRecords: ${maxRecords}`);

        const answer = await this.abciQuery({
            requestType: AbciRequestType.GET_ACCOUNT_HISTORY,
            accountHash: accountHash,
            lastHistoryHash: lastHistoryHash,
            maxRecords
        });

        const response = v.parse(AccountHistoryAbciResponseSchema, answer);
        this.responseLogger.info(`Receiving account history with ${response.list.length} entries` );
        return response;
    }

    async getAccountByPublicKeyHash(publicKeyHash: Uint8Array) {
        this.requestLogger.info(`Requesting account hash by public key hash: ${Utils.binaryToHexa(publicKeyHash)}`);

        const answer = await this.abciQuery(
            {
                requestType: AbciRequestType.GET_ACCOUNT_BY_PUBLIC_KEY_HASH,
                publicKeyHash: publicKeyHash
            }
        );

        const response = v.parse(AccountByPublicKeyHashAbciResponseSchema, answer);
        this.responseLogger.info(`Received account hash {accountHash}`, () => ({
            accountHash: Utils.binaryToHexa(response.accountHash)
        }));
        return response;
    }

    async getObjectList(type: number) {
        this.requestLogger.info(`Requesting list of objects of type ${type}`);

        const answer = await this.abciQuery({
                requestType: AbciRequestType.GET_OBJECT_LIST,
                type: type
        });

        const response = v.parse(ObjectListAbciResponseSchema, answer);
        this.responseLogger.info(`Receiving object lists with ${response.list.length} elements)`);
        return response;
    }

    async getMicroblockInformation(hash: Uint8Array): Promise<MicroblockInformation | null>  {
        this.requestLogger.info(`Requesting microblock information for hash ${Utils.binaryToHexa(hash)}`);

        const answer = await this.abciQuery({
            requestType: AbciRequestType.GET_MICROBLOCK_INFORMATION,
            hash
        });

        const response = v.parse(MicroblockInformationAbciResponseSchema, answer);
        this.responseLogger.info(`Received microblock information: vbType={vbType}, vbId={vbId}`, () => ({
            vbType: response.virtualBlockchainType,
            vbId: Utils.binaryToHexa(response.virtualBlockchainId),
        }));


        // TODO: remove or downgrade to debug
        this.logger.info(`Received microblock information body hash for microblock ${Utils.binaryToHexa(hash)}: ${Utils.binaryToHexa(response.header.bodyHash)}`)
        return v.parse(MicroblockInformationSchema, response);
    }

    async getMicroblockBodys(hashes: Uint8Array[]): Promise<MicroblockBodysAbciResponse | null>  {
        this.requestLogger.info(`Requesting microblock bodys for microblock hashes ${hashes.length}`);
        this.requestLogger.info(`Lisf of requested hashes: {hashes}`, () => ({
            hashes: hashes.map(h => Utils.binaryToHexa(h)).join(', ')
        }))

        const answer = await this.abciQuery({
            requestType: AbciRequestType.GET_MICROBLOCK_BODYS,
            hashes: hashes
        });

        const response = v.parse(MicroblockBodysAbciResponseSchema, answer);
        this.responseLogger.info(`Returned number of microblock bodys: ${response.list.length}`);
        return response;
    }

    async getVirtualBlockchainUpdate(virtualBlockchainId: Uint8Array, knownHeight: number) {
        this.requestLogger.info(`Request virtual blockchain update for virtualBlockchainId: ${Utils.binaryToHexa(virtualBlockchainId)}, knownHeight: ${knownHeight}`);
        const answer = await this.abciQuery({
            requestType: AbciRequestType.GET_VIRTUAL_BLOCKCHAIN_UPDATE,
            virtualBlockchainId: virtualBlockchainId,
            knownHeight: knownHeight
        });

        this.responseLogger.info(`Receiving virtual blockchain update`);
        return v.parse(VirtualBlockchainUpdateAbciResponseSchema, answer);
    }

    async getSerializedVirtualBlockchainState(virtualBlockchainId: Uint8Array) {
        this.requestLogger.info(`Requesting virtual blockchain state for vb id {vbId}`, () => ({
            vbId: Utils.binaryToHexa(virtualBlockchainId)
        }));

        const answer = await this.abciQuery({
            requestType: AbciRequestType.GET_VIRTUAL_BLOCKCHAIN_STATE,
            virtualBlockchainId: virtualBlockchainId
        });

        const response = v.parse(VirtualBlockchainStateAbciResponseSchema, answer);
        this.responseLogger.info(`Receiving virtual blockchain state: ${response.serializedVirtualBlockchainState.length} bytes`);
        return response.serializedVirtualBlockchainState;
    }


    private static async query(urlObject: any, postBody: object = {}): Promise<{data: string}> {
        try {
            const response = await axios.post(urlObject, postBody, {
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Accept': 'application/json',
                }
            });
            const data = response.data
            return data;
        } catch (e) {
            if (e instanceof AxiosError) {
                // connection refused
                if (e.code === 'ECONNREFUSED') {
                    throw new NodeConnectionRefusedError(urlObject)
                }

                // internal server error
                if (e.status === 500) {
                    throw new NodeError(`Internal error in the node: ${e.message}`)
                }

            }
            throw e
        }
    }

    async broadcastTx(data: Uint8Array) {
        const urlObject = new URL(this.nodeUrl);

        this.logger.info(`broadcastTx -> ${data.length} bytes to ${this.nodeUrl}`);

        //urlObject.pathname = "broadcast_tx_sync";
        //urlObject.searchParams.append("tx", "0x" + Utils.binaryToHexa(data));
        const encoder = EncoderFactory.bytesToBase64Encoder();
        const result = await NetworkProvider.query(urlObject, {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "broadcast_tx_sync", // TODO(sync): use async
            "params": {
                "tx": encoder.encode(data)
            }
        });
        return result;
    }

    async abciQuery(request: AbciRequest): Promise<AbciResponse> {
        if (request === undefined) throw new IllegalParameterError("Cannot send an undefined request");
        this.logger.debug(`Sending ABCI request:`, request)
        const encodedRequest = AbciQueryEncoder.encodeAbciRequest(request);
        return await NetworkProvider.sendABCIQueryToNodeServer(this.nodeUrl, encodedRequest);
    }

    static async sendABCIQueryToNodeServer(nodeUrl: string, serializedRequest: Uint8Array): Promise<AbciResponse> {
        NetworkProvider.staticLogger.debug(`Sending ABCI Query to node server at ${nodeUrl} (${serializedRequest.length} bytes) `);
        //const serializer = new MessageSerializer(SCHEMAS.NODE_MESSAGES);
        //const unserializer = new MessageUnserializer(SCHEMAS.NODE_MESSAGES);
        //const data = serializer.serialize(msgId, msgData);
        const urlObject = new URL(nodeUrl);

        urlObject.pathname = "abci_query";
        urlObject.searchParams.append("path", '"/carmentis"');
        urlObject.searchParams.append("data", "0x" + Utils.binaryToHexa(serializedRequest));

        const responseData = await NetworkProvider.query(urlObject);
        //const binary = Base64.decodeBinary(responseData.data);
        // @ts-ignore
        const rawBase64EncodedResponse = responseData?.result?.response?.value;
        if (typeof rawBase64EncodedResponse !== "string") {
            this.staticLogger.error("Invalid response type detected:", responseData)
            this.staticLogger.error("rawBase64EncodedResponse: ", rawBase64EncodedResponse);
            throw new NodeError("Invalid response detected")
        }
        const binary = Base64.decodeBinary(rawBase64EncodedResponse);
        const abciResponse = AbciQueryEncoder.decodeAbciResponse(binary);

        // we raise an exception if the response is an error
        if (abciResponse.responseType == AbciResponseType.ERROR) {
            const errorMsg = abciResponse.error;
            NetworkProvider.staticLogger.error(`sendABCIQueryToNodeServer <- {*}`, () => ({error: errorMsg}));
            throw new NodeError(`Remote error: ${errorMsg}`);
        }

        NetworkProvider.staticLogger.debug(`Returning ABCI response`, );
        return abciResponse;
    }

    static async sendStatusQueryToNodeServer(nodeUrl: string) {
        NetworkProvider.staticLogger.debug(`sendStatusQueryToNodeServer -> nodeUrl: ${nodeUrl}`);
        const urlObject = new URL(nodeUrl);
        urlObject.pathname = "status";
        const data  = await NetworkProvider.query(urlObject) as any;
        const parsingResult = v.safeParse(RPCNodeStatusResponseSchema, data);
        if (parsingResult.success) {
            NetworkProvider.staticLogger.debug(`sendStatusQueryToNodeServer <- received valid status response`);
            return parsingResult.output;
        }
        NetworkProvider.staticLogger.debug(`sendStatusQueryToNodeServer <- parsing error: ${parsingResult.issues}`);
        throw new NodeError(parsingResult.issues.map(i => i.message).join(", "));
    }

    async getGenesisSnapshot(): Promise<GenesisSnapshotAbciResponse> {
        this.requestLogger.info(`Requesting genesis snapshot`);

        const answer = await this.abciQuery({
            requestType: AbciRequestType.GET_GENESIS_SNAPSHOT,
        });

        const genesisSnapshotResponse = v.parse(GenesisSnapshotAbciResponseSchema, answer);
        this.responseLogger.info(`Received genesis snapshots containing {chunksNumber} chunks`, () => ({
            chunksNumber: genesisSnapshotResponse.base64EncodedChunks.length,
        }));
        return genesisSnapshotResponse;
    }
}
