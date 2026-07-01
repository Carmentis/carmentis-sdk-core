import * as v from "valibot";
import { Json } from "../type/valibot/json/Json"
import { ProofWrapper } from './ProofWrapper';
import { WrappedMicroblockProof, WrappedMicroblockProofSchema } from "../type/valibot/proofs/CarmentisProof"

const MICROBLOCK_PROOF_VERSION = 1;

export class MicroblockProofWrapper extends ProofWrapper<WrappedMicroblockProof> {
    constructor(wrapper: WrappedMicroblockProof) {
        super(wrapper);
    }

    static createEmptyProof() {
        const wrapper: WrappedMicroblockProof = {
            type: "microblockProof",
            info: ProofWrapper.getDefaultInfo(MICROBLOCK_PROOF_VERSION),
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
}
