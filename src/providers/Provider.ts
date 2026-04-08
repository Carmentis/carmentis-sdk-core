import {BlockchainUtils} from "../utils/BlockchainUtils";
import {Utils} from "../utils/utils";
import {CryptographicHash, Sha256CryptographicHash} from "../crypto/hash/hash-interface";
import {CryptoSchemeFactory} from "../crypto/CryptoSchemeFactory";
import {Hash} from "../entities/Hash";
import {PublicSignatureKey} from "../crypto/signature/PublicSignatureKey";
import {IllegalStateError, MicroBlockNotFoundError} from "../errors/carmentis-error";
import {Logger} from "../utils/Logger";
import {VirtualBlockchainType} from "../type/VirtualBlockchainType";
import {Microblock} from "../blockchain/microblock/Microblock";
import {IInternalProvider} from "./IInternalProvider";
import {IExternalProvider} from "./IExternalProvider";
import {AbstractProvider} from "./AbstractProvider";
import {ProtocolInternalState} from "../blockchain/internalStates/ProtocolInternalState";
import {VirtualBlockchainState} from "../type/valibot/blockchain/virtualBlockchain/virtualBlockchains";
import {MicroblockBody} from "../type/valibot/blockchain/microblock/MicroblockBody";
import {MicroblockHeader} from "../type/valibot/blockchain/microblock/MicroblockHeader";
import {VirtualBlockchainStatus} from "../type/valibot/provider/VirtualBlockchainStatus";
import {MicroblockInformation} from "../type/valibot/provider/MicroblockInformationSchema";
import {
    AccountHistoryAbciResponse,
    AccountStateAbciResponse,
    BlockContentAbciResponse,
    BlockInformationAbciResponse,
    ChainInformationAbciResponse,
    GenesisSnapshotAbciResponse,
    ObjectListAbciResponse
} from "../type/valibot/provider/abci/AbciResponse";
import {Crypto} from "../crypto/crypto";
import {VirtualBlockchain} from "../blockchain/virtualBlockchains/VirtualBlockchain";
import {NetworkProvider} from "./NetworkProvider";
import {RPCNodeStatusResponseType} from "./nodeRpc/RPCNodeStatusResponseSchema";
import {CometBFTPublicKey} from "../cometbft/CometBFTPublicKey";
import {CometBFTPublicKeyConverter} from "../utils/CometBFTPublicKeyConverter";
import {EncoderFactory} from "../utils/encoder";
import {FeesCalculationFormulaFactory} from "../blockchain/feesCalculator/FeesCalculationFormulaFactory";

/**
 * Represents a provider class that interacts with both internal and external providers for managing blockchain states and microblocks.
 */
export class Provider extends AbstractProvider {

    private logger = Logger.getProviderLogger();
    private externalProvider: IExternalProvider;
    private internalProvider: IInternalProvider;

    constructor(internalProvider: IInternalProvider, externalProvider: IExternalProvider) {
        super();
        this.internalProvider = internalProvider;
        this.externalProvider = externalProvider;
    }

    async awaitMicroblockAnchoring(hash: Uint8Array) {
        return await this.externalProvider.awaitMicroblockAnchoring(hash);
    }

    async getChainInformation() : Promise<ChainInformationAbciResponse> {
        return await this.externalProvider.getChainInformation();
    }

    async getGenesisSnapshot(): Promise<GenesisSnapshotAbciResponse> {
        return await this.externalProvider.getGenesisSnapshot();
    }

    async getBlockInformation(height: number) : Promise<BlockInformationAbciResponse> {
        return await this.externalProvider.getBlockInformation(height);
    }

    async getBlockContent(height: number) : Promise<BlockContentAbciResponse> {
        return await this.externalProvider.getBlockContent(height);
    }

    async getAccountState(accountHash: Uint8Array) : Promise<AccountStateAbciResponse> {
        return await this.externalProvider.getAccountState(accountHash);
    }

    async getAccountHistory(accountHash: Uint8Array, lastHistoryHash: Uint8Array, maxRecords: number): Promise<AccountHistoryAbciResponse> {
        return await this.externalProvider.getAccountHistory(accountHash, lastHistoryHash, maxRecords);
    }

    async getAccountByPublicKeyHash(publicKeyHash: Uint8Array) {
        const internalAccountHash = await this.internalProvider.getAccountByPublicKeyHash(publicKeyHash);

        if(internalAccountHash !== null) {
          return internalAccountHash;
        }

        const externalAccountHash = await this.externalProvider.getAccountByPublicKeyHash(publicKeyHash);
        const logger = Logger.getLogger([Provider.name]);
        logger.debug(`Account hash ${externalAccountHash} is associated to public key hash ${publicKeyHash}`)

        // TODO: save it locally
        return externalAccountHash.accountHash;
    }

    async getVirtualBlockchainState(virtualBlockchainId: Uint8Array): Promise<VirtualBlockchainState | null> {
        this.logger.info(`Getting state for virtual blockchain ${Utils.binaryToHexa(virtualBlockchainId)}`);
        const serializedVirtualBlockchainState = await this.internalProvider.getSerializedVirtualBlockchainState(virtualBlockchainId);
        if (serializedVirtualBlockchainState !== null) {
            this.logger.info(`State for virtual blockchain ${Utils.binaryToHexa(virtualBlockchainId)} found locally`);
            return BlockchainUtils.decodeVirtualBlockchainState(serializedVirtualBlockchainState)
        } else {
            const receivedSerializedVirtualBlockchainState = await this.externalProvider.getSerializedVirtualBlockchainState(virtualBlockchainId);
            if (receivedSerializedVirtualBlockchainState) {
                this.logger.info(`State for virtual blockchain ${Utils.binaryToHexa(virtualBlockchainId)} found online`);
                await this.internalProvider.setSerializedVirtualBlockchainState(virtualBlockchainId, receivedSerializedVirtualBlockchainState);
                return BlockchainUtils.decodeVirtualBlockchainState(receivedSerializedVirtualBlockchainState);
            } else {
                return null;
            }
        }
    }

    async getAccountIdByPublicKey(
        publicKey: PublicSignatureKey,
    ) {
        const rawPublicKey = await publicKey.getPublicKeyAsBytes();
        const publicKeyHash = Crypto.Hashes.sha256AsBinary(rawPublicKey);
        return await this.getAccountByPublicKeyHash(publicKeyHash);
    }

    async getProtocolState(): Promise<ProtocolInternalState> {
        const id = await this.getProtocolVirtualBlockchainId();
        const state = await this.getVirtualBlockchainState(id.toBytes());
        if (state === null) {
          throw new Error(`Cannot get protocol parameters from the internal provider`);
        }
        if (state.type !== VirtualBlockchainType.PROTOCOL_VIRTUAL_BLOCKCHAIN) throw new Error(
            `Expected protocol virtual blockchain, got ${VirtualBlockchainType[state.type]}`
        )
        return ProtocolInternalState.createFromObject(state.internalState);
    }

    async getProtocolVirtualBlockchainId(): Promise<Hash> {
        const list = await this.getObjectList(VirtualBlockchainType.PROTOCOL_VIRTUAL_BLOCKCHAIN);
        const foundVirtualBlockchainCount = list.list.length;
        if (foundVirtualBlockchainCount === 0) {
            this.logger.error('No protocol virtual blockchain found: Expecting exactly one protocol virtual blockchain.')
            throw new Error("No protocol virtual blockchain found");
        }
        if (foundVirtualBlockchainCount !== 1) {
            this.logger.warning("Found " + foundVirtualBlockchainCount + " protocol virtual blockchains, expecting exactly one");
        }
        return Hash.from(list.list[0])
    }

    async getAllAccounts(): Promise<Hash[]> {
        const list = await this.getObjectList(VirtualBlockchainType.ACCOUNT_VIRTUAL_BLOCKCHAIN);
        return list.list.map(Hash.from)
    }

    /**
     * Returns the list of validator node identifiers.
     *
     * Note: to recover more data from the validator node, load the node virtual blockchain.
     */
    async getAllValidatorNodes(): Promise<Hash[]> {
        const list = await this.getObjectList(VirtualBlockchainType.NODE_VIRTUAL_BLOCKCHAIN);
        return list.list.map(Hash.from)
    }

    async getAllOrganizationIds(): Promise<Hash[]> {
        const list = await this.getObjectList(VirtualBlockchainType.ORGANIZATION_VIRTUAL_BLOCKCHAIN);
        return list.list.map(Hash.from)
    }

    async getAllApplicationIds(): Promise<Hash[]> {
        const list = await this.getObjectList(VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN);
        return list.list.map(Hash.from)
    }

    async getObjectList(type: VirtualBlockchainType): Promise<ObjectListAbciResponse> {
        return await this.externalProvider.getObjectList(type);
    }

    async getMicroblockInformation(hash: Uint8Array): Promise<MicroblockInformation|null> {
        const data = await this.internalProvider.getInformationOfVirtualBlockchainContainingMicroblock(hash);
        const header = await this.internalProvider.getMicroblockHeader(hash);

        if(data && header) {
          return {
            ...data,
            header
          };
        }

        const info = await this.externalProvider.getMicroblockInformation(hash);
        if (info) {
            const data = BlockchainUtils.encodeVirtualBlockchainInfo({
                virtualBlockchainId: info.virtualBlockchainId,
                virtualBlockchainType: info.virtualBlockchainType,
            });
            await this.internalProvider.setMicroblockVbInformation(hash, data);
            await this.internalProvider.setMicroblockHeader(hash, info.header);
            return info;
        }
        return null;
    }

    async getListOfMicroblockBody(hashes: Uint8Array[]) {
        // get as much data as possible from the internal provider
        const res: {hash: Uint8Array, body: MicroblockBody}[] = [];
        const missingHashes: Uint8Array[] = [];

        // we first search in the internal provider to retrieve information locally
        let index = 0;
        for (const hash of hashes) {
            const serializedBody = await this.internalProvider.getMicroblockBody(hash);
            if (serializedBody) {
                const body = BlockchainUtils.decodeMicroblockBody(serializedBody);
                res.push({hash, body});
            } else {
                missingHashes.push(hash);
            }
            index += 1;
        }

        // if necessary, request missing data from the external provider
        if (missingHashes.length) {
            const microblockBodysResponse = await this.externalProvider.getMicroblockBodys(missingHashes);

            if (microblockBodysResponse === null) {
              throw new Error(`Unable to load microblock bodies`);
            }

            // save missing data in the internal provider and update res[]
            for (const { microblockBody, microblockHash } of microblockBodysResponse.list) {
                const serializedBody = BlockchainUtils.encodeMicroblockBody(microblockBody);
                await this.internalProvider.setSerializedMicroblockBody(microblockHash, serializedBody);
                res.push({ hash: microblockHash, body: microblockBody });
            }

            // for convenience, we sort the list according to the original query order
            res.sort((a, b) => hashes.indexOf(a.hash) - hashes.indexOf(b.hash));
        }

        return res.map(a => a.body);
    }

    async getMicroblockBody(microblockHash: Hash): Promise<MicroblockBody | null> {
        this.logger.info(`Looking for body for microblock ${microblockHash.encode()}`)
        const serializedBody = await this.internalProvider.getMicroblockBody(microblockHash.toBytes());
        if (serializedBody instanceof Uint8Array) {
            this.logger.info(`Body for microblock ${microblockHash.encode()} found locally`)
            return BlockchainUtils.decodeMicroblockBody(serializedBody)
        } else {
            const externalData = await this.externalProvider.getMicroblockBodys([
                microblockHash.toBytes()
            ]);
            if (externalData !== null && externalData.list.length !== 0) {
                const bodyResponse = externalData.list[0];
                const microblockBody = bodyResponse.microblockBody;
                await this.internalProvider.setMicroblockBody(microblockHash.toBytes(), microblockBody);
                this.logger.info(`Body for microblock ${microblockHash.encode()} found online`)
                return microblockBody;
            }
        }
        // we do not have found the microblock body
        this.logger.warning(`Body for microblock ${microblockHash.encode()} not found`)
        return null;
    }
    async getMicroblockHeader(microblockHash: Hash): Promise<MicroblockHeader | null> {
        this.logger.info(`Looking for header for microblock ${microblockHash.encode()}`)
        const serializedHeader = await this.internalProvider.getSerializedMicroblockHeader(microblockHash.toBytes());
        if (serializedHeader instanceof Uint8Array) {
            const headerHash = Crypto.Hashes.sha256(serializedHeader);
            const header =  BlockchainUtils.decodeMicroblockHeader(serializedHeader);
            this.logger.info(`Header for microblock ${microblockHash.encode()} found locally (sha256:${headerHash}): {header}`, {
                header: JSON.stringify(header)
            });
            return header
        }
        const receivedSerializedHeader = await this.externalProvider.getMicroblockInformation(microblockHash.toBytes());
        if (receivedSerializedHeader !== null) {
            this.logger.info(`Header for microblock ${microblockHash.encode()} found online: {header}:`, { header: receivedSerializedHeader.header });
            return receivedSerializedHeader.header;
        } else {
            throw new MicroBlockNotFoundError();
        }
    }

    async getVirtualBlockchainIdContainingMicroblock(microblockHash: Hash): Promise<Hash> {
        this.logger.info(`Searching for virtual blockchain containing microblock ${microblockHash.encode()}`)
        const info = await this.internalProvider.getInformationOfVirtualBlockchainContainingMicroblock(microblockHash.toBytes());
        if (info !== null) {
             return Hash.from(info.virtualBlockchainId);
        } else {
            const receivedInfo = await this.externalProvider.getMicroblockInformation(microblockHash.toBytes());
            if (receivedInfo !== null) {
                return Hash.from(receivedInfo.virtualBlockchainId);
            } else {
                throw new MicroBlockNotFoundError();
            }
        }
    }

    async getVirtualBlockchainHashes( virtualBlockchainId: Uint8Array ): Promise<Uint8Array[]> {
        const content = await this.getVirtualBlockchainStatus(virtualBlockchainId);
        if (content === undefined || content?.microblockHashes === undefined) throw new Error('Cannot access the virtual blockchain')
        return content.microblockHashes;
    }

    async getVirtualBlockchainHeaders(virtualBlockchainId: Uint8Array, knownHeight: number) {
        // we first search on the internal provider for the state of this VB
        const stateData = await this.internalProvider.getSerializedVirtualBlockchainState(virtualBlockchainId);
        if (stateData instanceof Uint8Array) {
            // recover the state of the virtual blockchain
            const state = BlockchainUtils.decodeVirtualBlockchainState(stateData);
            let height = state.height;
            let microblockHash = state.lastMicroblockHash;

            // load all the headers from the known height to the initial block
            const headers = [];
            while (height > knownHeight) {
                const header = await this.internalProvider.getSerializedMicroblockHeader(microblockHash);
                if (header instanceof Uint8Array) {
                    headers.push(header);
                    microblockHash = BlockchainUtils.previousHashFromHeader(header);
                    height--;
                } else {
                    throw new IllegalStateError(`Cannot get the headers of a non-existing microblock ${Utils.binaryToHexa(microblockHash)}`);
                }
            }

            return headers;
        } else {
            throw new IllegalStateError("Cannot get the headers of a non-existing VB");
        }
    }

    /**
     * Returns the virtual blockchain content (state and hashes) from the internal and external providers.
     *
     * @param virtualBlockchainId The identifier of the virtual blockchain.
     */
    async getVirtualBlockchainStatus(virtualBlockchainId: Uint8Array): Promise<VirtualBlockchainStatus | null> {
        let microblockHashes: Uint8Array[] = [];
        let vbState: VirtualBlockchainState | null = null;

        // We start by retrieving the virtual blockchain state locally.
        // If found, we make sure that we still have all the microblock headers up to the height associated to this state
        // and that they are consistent
        const serializedState = await this.internalProvider.getSerializedVirtualBlockchainState(virtualBlockchainId);
        if (serializedState !== null) {
            vbState = BlockchainUtils.decodeVirtualBlockchainState(serializedState);
            let height = vbState.height;
            let microblockHash = vbState.lastMicroblockHash;
            const headers = [];

            while(height) {
                const header = await this.internalProvider.getSerializedMicroblockHeader(microblockHash);
                if (!header) {
                    break;
                }
                headers.push(header);
                microblockHash = BlockchainUtils.previousHashFromHeader(header);
                height--;
            }

            if (height == 0) {
                const check = BlockchainUtils.checkHeaderList(headers);
                if (check.valid) {
                    check.hashes.reverse();
                    if(Utils.binaryIsEqual(check.hashes[0], virtualBlockchainId)) {
                        microblockHashes = check.hashes;
                    } else {
                        this.logger.warning("WARNING - genesis microblock hash from internal storage does not match VB identifier");
                    }
                } else {
                    this.logger.warning("WARNING - inconsistent hash chain in internal storage");
                }
            } else {
                // TODO: we can do a check, even for incomplete hashes
            }
        }

        // query our external provider for state update and new headers, starting at the known height
        const knownHeight = microblockHashes.length;
        const vbUpdate = await this.externalProvider.getVirtualBlockchainUpdate(
            virtualBlockchainId,
            knownHeight
        );

        if (!vbUpdate.exists) return null;
        if (vbUpdate.changed) {
            // check the consistency of the new headers
            const check = BlockchainUtils.checkHeaderList(vbUpdate.serializedHeaders);

            if (!check.valid) {
                throw new Error(`received headers are inconsistent`);
            }

            // make sure that the 'previous hash' field of the first new microblock matches the last known hash
            if (knownHeight) {
                const numberOfHeadersReturned = vbUpdate.serializedHeaders.length;
                const firstNewHeader = vbUpdate.serializedHeaders[numberOfHeadersReturned - 1];
                const linkedHash = BlockchainUtils.previousHashFromHeader(firstNewHeader);

                if(!Utils.binaryIsEqual(linkedHash, microblockHashes[knownHeight - 1])) {
                    throw new Error(`received headers do not link properly to the last known header`);
                }
            }

            // update the VB state in our internal provider
            await this.internalProvider.setSerializedVirtualBlockchainState(virtualBlockchainId, vbUpdate.serializedVirtualBlockchainState);

            vbState = BlockchainUtils.decodeVirtualBlockchainState(vbUpdate.serializedVirtualBlockchainState);

            // update the microblock information and header in our internal provider
            for(let n = 0; n < vbUpdate.serializedHeaders.length; n++) {
                await this.internalProvider.setMicroblockVbInformation(
                    check.hashes[n],
                    BlockchainUtils.encodeVirtualBlockchainInfo({
                        virtualBlockchainType: vbState.type,
                        virtualBlockchainId
                    })
                );
                await this.internalProvider.setSerializedMicroblockHeader(
                    check.hashes[n],
                    vbUpdate.serializedHeaders[n]
                );
            }

            // add the new hashes to the hash list
            microblockHashes = [ ...microblockHashes, ...check.hashes.reverse() ];
        }

        //
        if (vbState === null) return null;

        return { state: vbState, microblockHashes };
    }

    async getAccountIdFromPublicKey(publicKey: PublicSignatureKey) {
        const hashScheme = new Sha256CryptographicHash();
        const answer = await this.externalProvider.getAccountByPublicKeyHash(
            hashScheme.hash(await publicKey.getPublicKeyAsBytes())
        );
        return Hash.from(answer.accountHash);
    }

    async publishMicroblock(microblockToPublish: Microblock): Promise<Hash> {
        this.logger.info(`Publishing microblock ${microblockToPublish.getHash().encode()}`)
        const {microblockData} = microblockToPublish.serialize();
        await this.externalProvider.sendSerializedMicroblock(microblockData)
        return microblockToPublish.getHash();
    }

    async getNodeStatus(nodeUrl: string): Promise<RPCNodeStatusResponseType> {
        return NetworkProvider.sendStatusQueryToNodeServer(nodeUrl);
    }


    /**
     * Returns the validator node id by address
     * @param address
     */
    async getValidatorNodeIdByAddress(address: Hash) {
         const response = await this.externalProvider.getValidatorNodeByAddress(address.toBytes());
         return response.validatorNodeHash;
    }

    async getValidatorNodeIdByCometbftPublicKey(b64EncodedCometbftPublicKey: string) {
        const b64 = EncoderFactory.bytesToBase64Encoder();
        const address = CometBFTPublicKeyConverter.convertRawPublicKeyIntoAddress(
            b64.decode(b64EncodedCometbftPublicKey)
        );
        return this.getValidatorNodeIdByAddress(Hash.from(address))
    }
}
