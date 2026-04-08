import {Merklizer} from "./Merklizer";
import {Crypto} from "../crypto/crypto";
import {Utils} from "../utils/utils";

export class PepperMerklizer extends Merklizer {
    leaves: any;
    pepper: any;
    saltCounter: any;
    sha512: any;

    constructor(pepper: any) {
        super();
        // @ts-expect-error TS(2339): Property 'generatePepper' does not exist on type '... Remove this comment to see the full error message
        this.pepper = pepper || this.constructor.generatePepper();
        this.saltCounter = 0;
        this.leaves = [];
    }

    static generatePepper() {
        return Crypto.Random.getBytes(32);
    }

    addLeaf(item: any, data: any) {
        this.leaves.push({
            item: item,
            hash: Crypto.Hashes.sha256AsBinary(data)
        });
    }

    generateTree() {
        this.nLeaves = this.leaves.length;
        this.leaves.sort((a: any, b: any) => Utils.binaryCompare(a.hash, b.hash));

        for (const n in this.leaves) {
            this.tree.addLeaf(this.leaves[+n].hash);
            this.leaves[+n].item.leafIndex = +n;
        }

        this.tree.finalize();

        const rootHash = this.tree.getRootHash();

        return {
            nLeaves: this.leaves.length,
            rootHash: Utils.binaryToHexa(rootHash),
            pepper: Utils.binaryToHexa(this.pepper)
        };
    }

    addRawItem(item: any, info: any) {
        const salt = this.getSalt();

        item.salt = Utils.binaryToHexa(salt);
        this.addLeaf(item, Utils.binaryFrom(salt, info, item.valueBinary));
    }

    addHashableItem(item: any, info: any) {
        const salt = this.getSalt(),
            hash = Crypto.Hashes.sha256AsBinary(item.valueBinary);

        item.hash = Utils.binaryToHexa(hash);
        item.salt = Utils.binaryToHexa(salt);
        this.addLeaf(item, Utils.binaryFrom(salt, info, hash));
    }

    addMaskableItem(item: any, info: any) {
        const visibleSalt = this.getSalt(),
            visibleHash = Crypto.Hashes.sha256AsBinary(Utils.binaryFrom(visibleSalt, info, item.visiblePartsBinary)),
            hiddenSalt = this.getSalt(),
            hiddenHash = Crypto.Hashes.sha256AsBinary(Utils.binaryFrom(hiddenSalt, item.hiddenPartsBinary));

        item.visibleSalt = Utils.binaryToHexa(visibleSalt);
        item.hiddenSalt = Utils.binaryToHexa(hiddenSalt);
        item.hiddenHash = Utils.binaryToHexa(hiddenHash);
        this.addLeaf(item, Utils.binaryFrom(visibleHash, hiddenHash));
    }

    getSalt() {
        const n = this.saltCounter & 3,
            k = this.saltCounter++ >> 2;

        if (!n) {
            this.sha512 = Crypto.Hashes.sha512AsBinary(Utils.binaryFrom(this.pepper, k));
        }
        return this.sha512.slice(n << 4, (n + 1) << 4);
    }
}