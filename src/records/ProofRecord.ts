import {Utils} from '../utils/utils';
import {MerkleTree} from "../trees/merkleTree";
import {MerkleLeaf} from "./MerkleLeaf";
import {MerkleRecord} from "./MerkleRecord";
import {
    Path,
    ProofField,
    ProofChannel,
    ProofFieldTypeEnum,
    JsonData,
} from './types';
import {PositionedLeaf} from "./PositionedLeaf";

type ChannelMapEntry = {
    nLeaves: number,
    leaves: (PositionedLeaf | null)[],
    tree: MerkleTree,
    witnesses: Uint8Array[],
}

export class ProofRecord {
    private channelMap: Map<number, ChannelMapEntry>;
    private fieldMap: Map<string, { channelId: number, index: number }>;
    private publicChannels: Set<number>;

    constructor() {
        this.channelMap = new Map;
        this.fieldMap = new Map;
        this.publicChannels = new Set;
    }

    static fromMerkleRecord(merkleRecord: MerkleRecord) {
        const proofRecord = new ProofRecord();
        proofRecord.setChannelsFromMerkleRecord(merkleRecord);
        return proofRecord;
    }

    static fromProofChannels(proofChannels: ProofChannel[]) {
        const proofRecord = new ProofRecord();
        proofRecord.setChannelsFromProofChannels(proofChannels);
        return proofRecord;
    }

    private setChannelsFromMerkleRecord(merkleRecord: MerkleRecord) {
        this.publicChannels = merkleRecord.getPublicChannels();
        const leavesByChannelMap = merkleRecord.getLeavesByChannelMap();
        for (const [ channelId, leaves ] of leavesByChannelMap) {
            this.channelMap.set(
                channelId,
                {
                    nLeaves: leaves.length,
                    leaves,
                    tree: new MerkleTree,
                    witnesses: [],
                }
            );
        }
        this.buildTrees();
        this.buildFieldMap();
    }

    private setChannelsFromProofChannels(proofChannels: ProofChannel[]) {
        for (const proofChannel of proofChannels) {
            const leaves: PositionedLeaf[] = [];
            for (const field of proofChannel.fields) {
                const leaf = MerkleLeaf.fromProofFormat(field);
                const index = field.type == ProofFieldTypeEnum.Public ? 0 : field.index;
                leaves.push({
                    leaf,
                    path: field.path,
                    index,
                });
            }
            const witnessesHexList = proofChannel.witnesses;
            const witnesses = witnessesHexList.map((hex) =>
                Utils.binaryFromHexa(hex)
            );
            if (proofChannel.is_public) {
                this.publicChannels.add(proofChannel.id);
            }
            this.channelMap.set(
                proofChannel.id,
                {
                    nLeaves: proofChannel.n_leaves,
                    leaves,
                    tree: new MerkleTree,
                    witnesses,
                }
            );
        }
        this.buildTrees();
        this.buildFieldMap();
    }

    toJson(withDisclosureTypes: boolean = false): JsonData {
        const object: {[key: string]: any} = {};
        const list: PositionedLeaf[] = [];
        for (const {leaves} of this.channelMap.values()) {
            for (const leaf of leaves) {
                if (leaf === null) continue;
                list.push(leaf);
            }
        }
        for(const {path, leaf} of list) {
            const pathWithRoot = [ 'root', ...path ];
            let node = object;
            for(let n = 0; n < pathWithRoot.length; n++) {
                const key = pathWithRoot[n];
                const isLast = n == pathWithRoot.length - 1;
                if(isLast) {
                    node[key] = withDisclosureTypes ? leaf.getTypedValue() : leaf.getRawValue();
                }
                else {
                    const shouldBeArray = typeof pathWithRoot[n + 1] == 'number';
                    if (node[key] === undefined) {
                        node[key] = shouldBeArray ? [] : {};
                    }
                    else if (Array.isArray(node[key]) !== shouldBeArray) {
                        const fieldPath = pathWithRoot.slice(0, n + 1).join('.');
                        throw new Error(`${fieldPath} is defined as both an array and an object`);
                    }
                    node = node[key];
                }
            }
        }
        return object.root;
    }

    private buildTrees() {
        for (const [ channelId, channel ] of this.channelMap) {
            if (this.publicChannels.has(channelId)) {
                continue;
            }
            for (const entry of channel.leaves) {
                if (entry === null) continue;
                channel.tree.setLeaf(entry.index, entry.leaf.getHash());
            }
            channel.tree.finalize(channel.nLeaves);
            channel.tree.setWitnesses(channel.witnesses);
        }
    }

    private buildWitnesses() {
        for (const [ channelId, channel ] of this.channelMap) {
            if (this.publicChannels.has(channelId)) {
                continue;
            }
            const knownPositions = new Set<number>;
            for (const entry of channel.leaves) {
                if (entry === null) continue;
                knownPositions.add(entry.index);
            }
            const unknownPositions: number[] = [];
            for (let index = 0; index < channel.nLeaves; index++) {
                if (!knownPositions.has(index)) {
                    unknownPositions.push(index);
                }
            }
            channel.witnesses = channel.tree.getWitnesses(unknownPositions);
        }
    }

    private buildFieldMap() {
        this.fieldMap.clear();
        for (const [ channelId, channel ] of this.channelMap) {
            for (let index = 0; index < channel.leaves.length; index++) {
                const entry = channel.leaves[index];
                if (entry === null) continue;
                const path = entry.path;
                const normalizedPath = JSON.stringify(path);
                this.fieldMap.set(normalizedPath, { channelId, index });
            }
        }
    }

    private getLeafByPath(path: Path) {
        const { channelId, index } = this.getFieldByPath(path);
        const channel = this.getChannel(channelId);
        const entry = channel.leaves[index];

        if (entry === null) {
            throw new Error(`this field has been removed`);
        }
        return entry.leaf;
    }

    private getFieldByPath(path: Path) {
        const normalizedPath = JSON.stringify(path);
        const entry = this.fieldMap.get(normalizedPath);

        if (entry === undefined) {
            throw new Error(`unknown path ${normalizedPath}`);
        }
        return entry;
    }

    private getChannel(channelId: number) {
        const channel = this.channelMap.get(channelId);

        if (channel === undefined) {
            throw new Error(`unknown channel ID ${channelId}`);
        }
        return channel;
    }

    removeField(path: Path) {
        const { channelId, index } = this.getFieldByPath(path);
        const channel = this.getChannel(channelId);
        channel.leaves[index] = null;
    }

    setFieldToHashed(path: Path) {
        const leaf = this.getLeafByPath(path);
        leaf.setToHashed();
    }

    setFieldToMasked(path: Path) {
        const leaf = this.getLeafByPath(path);
        leaf.setToMasked();
    }

    getRootHashAsBinary(channelId: number) {
        const channel = this.getChannel(channelId);
        if (this.publicChannels.has(channelId)) {
            return Utils.getNullHash();
        }
        const rootHash = channel.tree.getRootHash();
        return rootHash;
    }

    getRootHashAsHexString(channelId: number) {
        const rootHash = this.getRootHashAsBinary(channelId);
        const hexString = Utils.binaryToHexa(rootHash);
        return hexString;
    }

    toProofChannels(): ProofChannel[] {
        this.buildWitnesses();
        const proofChannels: ProofChannel[] = [];

        for (const [ channelId, channel ] of this.channelMap) {
            const isPublic = this.publicChannels.has(channelId);
            const fields: ProofField[] = [];
            for (const entry of channel.leaves) {
                if (entry === null) continue;
                const field: ProofField = entry.leaf.toProofFormat(entry.path, entry.index);
                fields.push(field);
            }
            const witnesses = channel.witnesses.map((witness) =>
                Utils.binaryToHexa(witness)
            );
            proofChannels.push({
                id: channelId,
                is_public: isPublic,
                n_leaves: channel.nLeaves,
                fields,
                witnesses,
            });
        }
        return proofChannels;
    }
}
