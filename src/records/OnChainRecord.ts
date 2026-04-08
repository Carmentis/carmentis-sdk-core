import * as v from "valibot";
import {Utils} from '../utils/utils';
import {RecordByChannels} from "./RecordByChannels";
import {MerkleRecord} from "./MerkleRecord";
import {Record} from "./Record";
import {
    OnChainChannel,
    OnChainItem,
    FlatItem,
    OnChainChannelSchema,
    OnChainItemListSchema,
} from "./types";
import {Logger} from "../utils/Logger";
import {CBORCryptoBinaryEncoder} from "../crypto/encoder/CryptoEncoderFactory";

type ChannelMapEntry = {
    rootHash: Uint8Array,
    pepper: Uint8Array,
    onChainItems: OnChainItem[],
}

export class OnChainRecord {
    private encoder = new CBORCryptoBinaryEncoder()
    private channelMap: Map<number, ChannelMapEntry>;
    private publicChannels: Set<number>;

    constructor() {
        this.channelMap = new Map;
        this.publicChannels = new Set();
    }

    static fromMerkleRecord(merkleRecord: MerkleRecord) {
        const onChainRecord = new OnChainRecord();
        onChainRecord.setChannelsFromMerkleRecord(merkleRecord);
        return onChainRecord;
    }

    private logger = Logger.getLogger([OnChainRecord.name]);
    private setChannelsFromMerkleRecord(merkleRecord: MerkleRecord) {
        this.publicChannels = merkleRecord.getPublicChannels();
        const recordByChannels = merkleRecord.getRecordByChannels();
        const channelIds = merkleRecord.getChannelIds();

        for (const channelId of channelIds) {
            const pepper = merkleRecord.getChannelPepper(channelId);
            const rootHash = merkleRecord.getChannelRootHash(channelId);
            const flatItems = recordByChannels.getFlatItems(channelId);
            const onChainItems: OnChainItem[] = flatItems.map((flatItem) => {
                return {
                    path: flatItem.path,
                    value: flatItem.item.value,
                    ...flatItem.item.transformation ? {transformation: flatItem.item.transformation} : {}
                }
            });
            this.channelMap.set(
                channelId,
                {
                    rootHash,
                    pepper,
                    onChainItems,
                }
            );
        }
    }

    getChannelIds() {
        return [...this.channelMap.keys()].sort((a, b) => a - b);
    }

    getOnChainData(channelId: number, pack = false) {
        const channel = this.getChannel(channelId);
        const encoder = new CBORCryptoBinaryEncoder();
        //const encoder = new Encoder({pack});
        const encodedPayload = encoder.encode(channel.onChainItems);
        const onChainData: OnChainChannel = {
            pepper: channel.pepper,
            data: encodedPayload,
        };
        const encodedOnChainData = this.encoder.encode(onChainData);
        const isPublic = this.publicChannels.has(channelId);
        return {
            isPublic,
            merkleRootHash: channel.rootHash,
            data: encodedOnChainData,
        };
    }

    addOnChainData(channelId: number, isPublic: boolean, rootHash: Uint8Array, encodedData: Uint8Array) {
        if (this.channelMap.has(channelId)) {
            throw new Error(`channel ${channelId} has already been set`);
        }
        if (isPublic) {
            this.publicChannels.add(channelId);
        }
        else {
            this.publicChannels.delete(channelId);
        }
        const onChainData: OnChainChannel = this.encoder.decode(encodedData);
        v.parse(OnChainChannelSchema, onChainData);
        const pepper = onChainData.pepper;
        const onChainItems: OnChainItem[] = this.encoder.decode(onChainData.data);
        v.parse(OnChainItemListSchema, onChainItems);
        this.channelMap.set(
            channelId,
            {
                rootHash,
                pepper,
                onChainItems,
            }
        );
    }

    toMerkleRecord(checkHashes = true) {
        const recordByChannels = new RecordByChannels;
        const peppers: Map<number, Uint8Array> = new Map();
        for (const [ channelId, channel ] of this.channelMap) {
            const flatItems: FlatItem[] = channel.onChainItems.map((field: OnChainItem) => {
                const item = {
                    channelId,
                    type: Record.getPrimitiveValueType(field.value),
                    value: field.value,
                    ...field.transformation ? {transformation: field.transformation} : {},
                }
                return {
                    path: field.path,
                    item,
                };
            });
            const isPublic = this.publicChannels.has(channelId);
            recordByChannels.setChannel(channelId, isPublic, flatItems);
            peppers.set(channelId, channel.pepper);
        }
        const merkleRecord = MerkleRecord.fromRecordByChannels(recordByChannels, peppers);

        // optionally check root hashes
        if (checkHashes) {
            for (const [channelId, channel] of this.channelMap) {
                if (!this.publicChannels.has(channelId)) {
                    const rootHash = merkleRecord.getChannelRootHash(channelId);
                    if (!Utils.binaryIsEqual(rootHash, channel.rootHash)) {
                        throw new Error(
                            `inconsistent Merkle root hash for private channel ${channelId} ` +
                            `(computed ${Utils.binaryToHexa(rootHash)}, ` +
                            `on-chain value is ${Utils.binaryToHexa(channel.rootHash)})`
                        )
                    }
                }
            }
        }
        return merkleRecord;
    }

    private getChannel(channelId: number) {
        const channel = this.channelMap.get(channelId);
        if (channel === undefined) {
            throw new Error(`channel ${channelId} not found`);
        }
        return channel;
    }
}
