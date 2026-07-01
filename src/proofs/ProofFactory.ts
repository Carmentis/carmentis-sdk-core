import * as v from "valibot";
import { WrappedProof, WrappedProofSchema } from "../type/valibot/proofs/CarmentisProof";
import { AccountProofWrapper } from "./AccountProofWrapper";
import { AppLedgerProofWrapper } from "./AppLedgerProofWrapper";
import { MicroblockProofWrapper } from "./MicroblockProofWrapper";

export class ProofFactory {
    static importProof(wrappedProof: WrappedProof) {
        v.parse(WrappedProofSchema, wrappedProof);
        switch (wrappedProof.type) {
            case "accountProof": {
                return new AccountProofWrapper(wrappedProof);
            }
            case "appLedgerProof": {
                return new AppLedgerProofWrapper(wrappedProof);
            }
            case "microblockProof": {
                return new MicroblockProofWrapper(wrappedProof);
            }
        }
    }
}
