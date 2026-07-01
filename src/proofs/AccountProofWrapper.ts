import * as v from "valibot";
import { Json } from "../type/valibot/json/Json"
import { ProofWrapper } from './ProofWrapper';
import { WrappedAccountProof, WrappedAccountProofSchema } from "../type/valibot/proofs/CarmentisProof"

const ACCOUNT_PROOF_VERSION = 1;

export class AccountProofWrapper extends ProofWrapper<WrappedAccountProof> {
    constructor(wrapper: WrappedAccountProof) {
        super(wrapper);
    }

    static createEmptyProof() {
        const wrapper: WrappedAccountProof = {
            type: "accountProof",
            info: ProofWrapper.getDefaultInfo(ACCOUNT_PROOF_VERSION),
            proof: {
                accounts: [],
            }
        }
        return new AccountProofWrapper(wrapper);
    }

    static fromObject(json: Json) {
        const wrapper = v.parse(WrappedAccountProofSchema, json);
        return new AccountProofWrapper(wrapper);
    }
}
