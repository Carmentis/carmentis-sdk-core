import { ProofBlock } from "../../type/valibot/stateProofs/ProofBlock";
import { AccountProof } from "../../type/valibot/stateProofs/AccountProof";
import { MicroblockProof } from "../../type/valibot/stateProofs/MicroblockProof";
import { Crypto } from "../../crypto/crypto";
import { Utils } from "../../utils/utils";
import { BlockchainUtils } from "../../utils/BlockchainUtils";
import { Base64 } from "../../data/base64";
import { verifyRadixProof } from "../../trees/radixChecker";

export interface JsonProofBlock {
    height: number,
    vbRadixHash: string,
    tokenRadixHash: string,
    storageHash: string,
    appHash: string,
}

export interface JsonAccountProof {
    block: JsonProofBlock,
    account: {
        virtualBlockchainId: string,
        serializedState: string,
        radixProof: string[],
    },
}

export interface JsonMicroblockProof {
    block: JsonProofBlock,
    microblock: {
        virtualBlockchainId: string,
        height: number,
        hash: string,
    },
    virtualBlockchain: {
        serializedState: string,
        merkleWitnesses: string[],
        radixProof: string[],
    },
}

export class StateChecker {
    static verifyAccountProofFromObject(proof: AccountProof): Uint8Array {
        const accountState = proof.account.state;
        const encodedAccountState = BlockchainUtils.encodeAccountState(accountState);
        const accountStateHash = Crypto.Hashes.sha256AsBinary(encodedAccountState);

        StateChecker.verifyRadixProof(
            proof.account.virtualBlockchainId,
            accountStateHash,
            proof.account.radixProof,
            proof.block.vbRadixHash,
        );

        return StateChecker.verifyAppHash(proof.block);
    }

    static verifyAccountProofFromJson(jsonProof: JsonAccountProof): Uint8Array {
        const { block, account } = jsonProof;
        const radixProof = account.radixProof.map((hex) =>
            Utils.binaryFromHexa(hex)
        );
        const encodedState = Base64.decodeBinary(account.serializedState, Base64.BASE64);
        const state = BlockchainUtils.decodeAccountState(encodedState);
        const proof: AccountProof = {
            block: StateChecker.decodeJsonBlock(block),
            account: {
                virtualBlockchainId: Utils.binaryFromHexa(account.virtualBlockchainId),
                state,
                radixProof,
            },
        };
        return StateChecker.verifyAccountProofFromObject(proof);
    }

    static verifyMicroblockProofFromObject(proof: MicroblockProof): Uint8Array {
        const merkleTreeHeight = 33 - Math.clz32(proof.virtualBlockchain.state.height - 1);
        const witnesses = proof.virtualBlockchain.merkleWitnesses;
        const leafIndex = proof.microblock.height - 1;
        let currentHash = proof.microblock.hash;

        if (witnesses.length !== merkleTreeHeight - 1) {
            console.log(witnesses, merkleTreeHeight);
            throw new Error("State proof failure: inconsistent list of Merkle witnesses");
        }

        for (let row = 0; row < merkleTreeHeight - 1; row++) {
            const witness = witnesses[row];
            if (leafIndex >>> row & 1) {
                currentHash = StateChecker.mergeHashes(witness, currentHash);
            }
            else {
                currentHash = StateChecker.mergeHashes(currentHash, witness);
            }
        }

        const vbState = proof.virtualBlockchain.state;

        if (!Utils.binaryIsEqual(vbState.merkleRootHash, currentHash)) {
            throw new Error("State proof failure: invalid Merkle root hash");
        }

        const encodedVbState = BlockchainUtils.encodeVirtualBlockchainState(vbState);
        const vbStateHash = Crypto.Hashes.sha256AsBinary(encodedVbState);

        StateChecker.verifyRadixProof(
            proof.microblock.virtualBlockchainId,
            vbStateHash,
            proof.virtualBlockchain.radixProof,
            proof.block.vbRadixHash,
        );

        return StateChecker.verifyAppHash(proof.block);
    }

    static verifyMicroblockProofFromJson(jsonProof: JsonMicroblockProof): Uint8Array {
        const { block, microblock, virtualBlockchain } = jsonProof;
        const merkleWitnesses = virtualBlockchain.merkleWitnesses.map((hex) =>
            Utils.binaryFromHexa(hex)
        );
        const radixProof = virtualBlockchain.radixProof.map((hex) =>
            Utils.binaryFromHexa(hex)
        );
        const encodedState = Base64.decodeBinary(virtualBlockchain.serializedState, Base64.BASE64);
        const state = BlockchainUtils.decodeVirtualBlockchainState(encodedState);
        const proof: MicroblockProof = {
            block: StateChecker.decodeJsonBlock(block),
            microblock: {
                virtualBlockchainId: Utils.binaryFromHexa(microblock.virtualBlockchainId),
                height: microblock.height,
                hash: Utils.binaryFromHexa(microblock.hash),
            },
            virtualBlockchain: {
                state,
                merkleWitnesses,
                radixProof,
            },
        };
        return StateChecker.verifyMicroblockProofFromObject(proof);
    }

    private static decodeJsonBlock(block: JsonProofBlock) {
        return {
            height: block.height,
            vbRadixHash: Utils.binaryFromHexa(block.vbRadixHash),
            tokenRadixHash: Utils.binaryFromHexa(block.tokenRadixHash),
            storageHash: Utils.binaryFromHexa(block.storageHash),
            appHash: Utils.binaryFromHexa(block.appHash),
        };
    }

    private static mergeHashes(leftChild: Uint8Array, rightChild: Uint8Array): Uint8Array {
        const concatenation = new Uint8Array(64);
        concatenation.set(leftChild, 0);
        concatenation.set(rightChild, 32);
        return Crypto.Hashes.sha256AsBinary(concatenation);
    }

    private static verifyRadixProof(key: Uint8Array, value: Uint8Array, proof: Uint8Array[], rootHash: Uint8Array) {
        const computedRootHash = verifyRadixProof(key, value, proof);

        if (computedRootHash === null) {
            throw new Error("State proof failure: inconsistent Radix proof");
        }
        if (!Utils.binaryIsEqual(computedRootHash, rootHash)) {
            throw new Error("State proof failure: invalid Radix root hash");
        }
    }

    private static verifyAppHash(block: ProofBlock): Uint8Array {
        const radixHash = Crypto.Hashes.sha256AsBinary(
            Utils.binaryFrom(block.vbRadixHash, block.tokenRadixHash),
        );
        const appHash = Crypto.Hashes.sha256AsBinary(Utils.binaryFrom(radixHash, block.storageHash));
        if (!Utils.binaryIsEqual(appHash, block.appHash)) {
            throw new Error(`State proof failure: computed app hash does not match the one declared in the block`);
        }
        return appHash;
    }
}
