import {MerkleTree} from "../trees/merkleTree";
import {PathManager} from "./pathManager";
import {Utf8Encoder} from "../data/utf8Encoder";
import {Utils} from "../utils/utils";
import {DATA} from '../constants/constants';

export abstract class Merklizer {
    //addHashableItem: any;
    //addMaskableItem: any;
    //addRawItem: any;

    nLeaves: any;
    tree: any;

    constructor() {
        this.tree = new MerkleTree;
    }

    abstract addHashableItem(item: any, info: any): void;

    abstract addMaskableItem(item: any, info: any): void;

    abstract addRawItem(item: any, info: any): void;

    addItem(item: any, parents: any) {
        const info = this.getLeafInfo(item, parents);

        if (item.attributes & DATA.MASKABLE) {
            this.addMaskableItem(item, info);
        } else if (item.attributes & DATA.HASHABLE) {
            this.addHashableItem(item, info);
        } else {
            this.addRawItem(item, info);
        }
    }

    getLeafInfo(item: any, parents: any) {
        const path = PathManager.fromParents(parents),
            utf8Path = Utf8Encoder.encode(path);

        if (utf8Path.length > 0xFFFF) {
            throw "path too long";
        }

        const info = new Uint8Array(utf8Path.length + 3);

        info[0] = item.type;
        info[1] = utf8Path.length >> 8;
        info[2] = utf8Path.length & 0xFF;
        info.set(utf8Path, 3);

        return info;
    }

    getWitnesses(knownPositions: any) {
        const unknownPositions = [];

        for (let index = 0; index < this.nLeaves; index++) {
            if (!knownPositions.has(index)) {
                unknownPositions.push(index);
            }
        }

        const witnesses = this.tree.getWitnesses(unknownPositions);

        return witnesses.map((arr: any) => Utils.binaryToHexa(arr)).join("");
    }
}