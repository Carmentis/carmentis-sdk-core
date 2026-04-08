import {Crypto} from "../crypto/crypto";
import {Utils} from "../utils/utils";

export class MerkleTree {
    leaves: Uint8Array[];
    nLeaves: number;
    tree: Uint8Array[][];

    constructor() {
        this.leaves = [];
        this.nLeaves = 0;
        this.tree = [];
    }

    addLeaf(hash: Uint8Array) {
        this.checkHash(hash);
        this.leaves.push(hash);
    }

    setLeaf(index: number, hash: Uint8Array) {
        this.checkHash(hash);
        this.leaves[index] = hash;
    }

    checkHash(hash: Uint8Array) {
        if(hash.length != 32) {
            throw new Error(`invalid hash: expected size is 32 bytes, got ${hash.length}`);
        }
    }

    finalize(nLeaves: number|undefined = undefined) {
        this.nLeaves = nLeaves === undefined ? this.leaves.length : nLeaves;
        this.buildTreeStructure();
    }

    getNumberOfLeaves() {
        return this.nLeaves;
    }

    getRootHash() {
        const rootDepth = this.tree.length - 1;

        for(let depth = 0; depth < rootDepth; depth++) {
            const row = this.tree[depth];

            for(let index = 0; index < row.length; index += 2) {
                if(row[index] && row[index + 1]) {
                    this.tree[depth + 1][index >> 1] = this.mergeHashes(depth + 1, row[index], row[index + 1]);
                }
            }
        }
        return this.tree[rootDepth][0];
    }

    getWitnesses(unknownPositions: number[]) {
        const unknownPositionSet = new Set(unknownPositions);
        const witnessPositions = this.getWitnessPositions(unknownPositionSet);
        const witnesses = [];

        for(let index = 0; index < this.tree[0].length; index++) {
            if(!unknownPositionSet.has(index) && !this.tree[0][index]) {
                throw new Error(`cannot find leaf at index ${index}`);
            }
        }

        for(const [ depth, index ] of witnessPositions) {
            const witness = this.tree[depth][index];

            if(!witness) {
                throw new Error(`cannot find witness hash at depth ${depth}, index ${index}`);
            }
            witnesses.push(witness);
        }
        return witnesses;
    }

    setWitnesses(witnesses: Uint8Array[]) {
        const unknownPositionSet = new Set<number>;

        for(let index = 0; index < this.nLeaves; index++) {
            if(!this.leaves[index]) {
                unknownPositionSet.add(index);
            }
        }

        const witnessPositions = this.getWitnessPositions(unknownPositionSet);

        if(witnesses.length != witnessPositions.length) {
            throw new Error(`invalid witness list: expected ${witnessPositions.length} witness(es), got ${witnesses.length}`);
        }

        let ptr = 0;

        for(const [ depth, index ] of witnessPositions) {
            this.checkHash(witnesses[ptr]);
            this.tree[depth][index] = witnesses[ptr++];
        }
    }

    buildTreeStructure() {
        let nLeaves = this.nLeaves;

        this.tree = [];

        while(nLeaves) {
            const row = Array(nLeaves).fill(null);

            if(nLeaves > 1 && nLeaves & 1) {
                row.push(Utils.getNullHash());
                nLeaves++;
            }
            this.tree.push(row);
            nLeaves >>= 1;
        }

        for(let index = 0; index < this.nLeaves; index++) {
            if(this.leaves[index]) {
                this.tree[0][index] = this.leaves[index];
            }
        }
    }

    getWitnessPositions(unknownPositionSet: Set<number>) {
        let nLeaves = this.nLeaves;
        const witnessPositions = [];

        for(let depth = 0; nLeaves; depth++) {
            const newUnknownPositionSet = new Set<number>;

            for(let index = 0; index < nLeaves; index += 2) {
              const unknownLeft = unknownPositionSet.has(index);
              const unknownRight = index + 1 < nLeaves && unknownPositionSet.has(index + 1);

              if(unknownLeft && unknownRight) {
                  newUnknownPositionSet.add(index >> 1);
              }
              else if(unknownLeft || unknownRight) {
                  witnessPositions.push([ depth, unknownRight ? index + 1 : index ]);
              }
            }
            unknownPositionSet = newUnknownPositionSet;
            nLeaves = nLeaves + (nLeaves > 1 ? 1 : 0) >> 1;
        }
        return witnessPositions;
    }

    mergeHashes(depth: number, left: Uint8Array, right: Uint8Array) {
        const data = new Uint8Array(65);

        data[0] = +(depth == this.tree.length - 1);
        data.set(left, 1);
        data.set(right, 33);

        return Crypto.Hashes.sha256AsBinary(data);
    }
}
