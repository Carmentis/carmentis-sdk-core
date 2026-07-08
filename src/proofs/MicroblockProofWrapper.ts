import * as v from "valibot";
import { Json } from "../type/valibot/json/Json"
import { ProofWrapper } from "./ProofWrapper"
import { WrappedMicroblockProof, WrappedMicroblockProofSchema } from "../type/valibot/proofs/CarmentisProof"
import { MicroblockProofEntry } from "../type/valibot/proofs/MicroblockProof"

const MICROBLOCK_PROOF_VERSION = 1;

export class MicroblockProofWrapper extends ProofWrapper<WrappedMicroblockProof> {
    constructor(wrapper: WrappedMicroblockProof) {
        super(wrapper);
    }

    static createEmptyProof(chainId: string) {
        const wrapper: WrappedMicroblockProof = {
            type: "microblockProof",
            info: ProofWrapper.getDefaultInfo(MICROBLOCK_PROOF_VERSION, chainId),
            proof: {
                microblocks: [],
            }
        }
        return new MicroblockProofWrapper(wrapper);
    }

    static fromObject(json: Json) {
        const wrapper = v.parse(WrappedMicroblockProofSchema, json);
        return new MicroblockProofWrapper(wrapper);
    }

    addMicroblock(mb: MicroblockProofEntry) {
        this.wrapper.proof.microblocks.push(mb);
    }

    getMicroblocks() {
        return this.wrapper.proof.microblocks;
    }
}
