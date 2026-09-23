import * as v from "valibot";
import { Json, JsonObject } from "../type/valibot/json/Json"
import { ProofWrapper } from "./ProofWrapper"
import { WrappedResolutionProof, WrappedResolutionProofSchema } from "../type/valibot/proofs/CarmentisProof"
import { ResolutionProofProofs, ResolutionProofOffchainData } from "../type/valibot/proofs/ResolutionProof";

const RESOLUTION_PROOF_VERSION = 1;

export class ResolutionProofWrapper extends ProofWrapper<WrappedResolutionProof> {
    constructor(wrapper: WrappedResolutionProof) {
        super(wrapper);
    }

    static createEmptyProof(chainId: string) {
        const wrapper: WrappedResolutionProof = {
            type: "resolutionProof",
            info: ProofWrapper.getDefaultInfo(RESOLUTION_PROOF_VERSION, chainId),
            proof: {
                linkedJson: {},
                resolvedJson: {},
                offchainData: {},
                proofs: {},
            }
        }
        return new ResolutionProofWrapper(wrapper);
    }

    static fromObject(json: Json) {
        const wrapper = v.parse(WrappedResolutionProofSchema, json);
        return new ResolutionProofWrapper(wrapper);
    }

    setLinkedJson(jsonObject: JsonObject) {
        this.wrapper.proof.linkedJson = jsonObject;
    }

    setResolvedJson(jsonObject: JsonObject) {
        this.wrapper.proof.resolvedJson = jsonObject;
    }

    setOffchainData(offchainData: ResolutionProofOffchainData) {
        this.wrapper.proof.offchainData = offchainData;
    }

    setProofs(proofs: ResolutionProofProofs) {
        this.wrapper.proof.proofs = proofs;
    }
}
