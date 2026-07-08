import * as v from "valibot";
import { Json } from "../type/valibot/json/Json"
import { ProofWrapper } from "./ProofWrapper";
import { WrappedAppLedgerProof, WrappedAppLedgerProofSchema } from "../type/valibot/proofs/CarmentisProof";
import { AppLedgerProofVB } from "./AppLedgerProofVB";

const APP_LEDGER_PROOF_VERSION = 1;

export class AppLedgerProofWrapper extends ProofWrapper<WrappedAppLedgerProof> {
    constructor(wrapper: WrappedAppLedgerProof) {
        super(wrapper);
    }

    static createEmptyProof(chainId: string) {
        const wrapper: WrappedAppLedgerProof = {
            type: "appLedgerProof",
            info: ProofWrapper.getDefaultInfo(APP_LEDGER_PROOF_VERSION, chainId),
            proof: {
                virtualBlockchains: [],
            }
        }
        return new AppLedgerProofWrapper(wrapper);
    }

    static fromObject(json: Json) {
        const wrapper = v.parse(WrappedAppLedgerProofSchema, json);
        return new AppLedgerProofWrapper(wrapper);
    }

    addVirtualBlockchain(proofDocumentVB: AppLedgerProofVB) {
        this.wrapper.proof.virtualBlockchains.push(proofDocumentVB.toObject());
    }

    getSingleVirtualBlockchainOrFail() {
        const virtualBlockchains = this.getVirtualBlockchains();
        if (virtualBlockchains.length == 0) {
            throw new Error(`no virtual blockchain is defined in this proof`);
        }
        if (virtualBlockchains.length > 1) {
            throw new Error(`proofs with multiple virtual blockchains are not supported at this time`);
        }
        return virtualBlockchains[0];
    }

    getVirtualBlockchain(id: string) {
        const virtualBlockchain = this.wrapper.proof.virtualBlockchains.find((vb) => vb.id === id);
        if (!virtualBlockchain) {
            throw new Error(`no virtual blockchain found with ID ${id}`);
        }
        return virtualBlockchain;
    }

    getVirtualBlockchains() {
        return this.wrapper.proof.virtualBlockchains.map((vb) =>
            AppLedgerProofVB.fromObject(vb)
        );
    }
}
