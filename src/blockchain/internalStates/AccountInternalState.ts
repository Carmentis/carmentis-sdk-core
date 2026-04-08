import {IInternalState} from "./IInternalState";
import {AccountVBInternalStateObject} from "../../type/valibot/blockchain/virtualBlockchain/internalStates";

export class AccountInternalState implements IInternalState {
    constructor(private internalState: AccountVBInternalStateObject) {
    }

    static createFromObject(internalState: unknown) {
        return new AccountInternalState(<AccountVBInternalStateObject>internalState);
    }

    static createInitialState() {
        return new AccountInternalState({
            signatureSchemeId: 0,
            publicKeyHeight: 0
        });
    }

    toObject(): AccountVBInternalStateObject {
        return this.internalState;
    }

    updateSignatureScheme(signatureSchemeId: number) {
        this.internalState.signatureSchemeId = signatureSchemeId;
    }

    updatePublicKeyHeight(publicKeyHeight: number) {
        this.internalState.publicKeyHeight = publicKeyHeight;
    }

    getPublicKeyHeight() {
        return this.internalState.publicKeyHeight;
    }

    getPublicKeySchemeId() {
        return this.internalState.signatureSchemeId;
    }
}