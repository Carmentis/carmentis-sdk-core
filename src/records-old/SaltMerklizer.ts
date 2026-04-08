import {Merklizer} from "./Merklizer";
import {Utils} from "../utils/utils";
import {Crypto} from "../crypto/crypto";

export class SaltMerklizer extends Merklizer {
    nLeaves: any;
    witnesses: any;

    constructor(nLeaves: any, witnesses: any) {
        super();
        this.nLeaves = nLeaves;
        this.witnesses = (witnesses.match(/.{64}/g) || []).map((s: any) => Utils.binaryFromHexa(s));
    }

    addLeaf(item: any, data: any) {
        this.tree.setLeaf(item.leafIndex, Crypto.Hashes.sha256AsBinary(data));
    }

    generateTree() {
        this.tree.finalize(this.nLeaves);
        this.tree.setWitnesses(this.witnesses);

        const rootHash = this.tree.getRootHash();

        return {
            nLeaves: this.tree.getNumberOfLeaves(),
            rootHash: Utils.binaryToHexa(rootHash)
        };
    }

    addRawItem(item: any, info: any) {
        const salt = Utils.binaryFromHexa(item.salt);

        this.addLeaf(item, Utils.binaryFrom(salt, info, item.valueBinary));
    }

    addHashableItem(item: any, info: any) {
        const salt = Utils.binaryFromHexa(item.salt);

        let hash;

        if (item.hash) {
            hash = Utils.binaryFromHexa(item.hash);
        } else {
            hash = Crypto.Hashes.sha256AsBinary(item.valueBinary);
            item.hash = hash;
        }

        this.addLeaf(item, Utils.binaryFrom(salt, info, item.valueBinary));
    }

    addMaskableItem(item: any, info: any) {
        const visibleSalt = Utils.binaryFromHexa(item.visibleSalt),
            visibleHash = Crypto.Hashes.sha256AsBinary(Utils.binaryFrom(visibleSalt, info, item.visiblePartsBinary));

        let hiddenHash;

        if (item.hiddenHash) {
            hiddenHash = Utils.binaryFromHexa(item.hiddenHash);
        } else {
            const hiddenSalt = Utils.binaryFromHexa(item.hiddenSalt);

            hiddenHash = Crypto.Hashes.sha256AsBinary(Utils.binaryFrom(hiddenSalt, item.hiddenPartsBinary));
            item.hiddenHash = Utils.binaryToHexa(hiddenHash);
        }

        this.addLeaf(item, Utils.binaryFrom(visibleHash, hiddenHash));
    }
}