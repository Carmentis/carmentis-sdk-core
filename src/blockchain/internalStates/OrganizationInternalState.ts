import {Utils} from "../../utils/utils";
import {Hash} from "../../entities/Hash";
import {OrganizationVBInternalStateObject} from "../../type/valibot/blockchain/virtualBlockchain/internalStates";

export class OrganizationInternalState {
    constructor(private internalState: OrganizationVBInternalStateObject) {
    }

    static createFromObject(localState: unknown) {
        return new OrganizationInternalState(<OrganizationVBInternalStateObject>localState);
    }

    static createInitialState() {
        return new OrganizationInternalState({
            accountId: Utils.getNullHash(),
            descriptionHeight: 0
        });
    }

    toObject(): OrganizationVBInternalStateObject {
        return this.internalState;
    }

    getAccountIdAsBytes() {
        return this.internalState.accountId;
    }

    getAccountId() {
        return Hash.from(this.internalState.accountId);
    }

    setAccountId(accountId: Uint8Array) {
        return this.internalState.accountId = accountId;
    }

    getDescriptionHeight() {
        return this.internalState.descriptionHeight;
    }

    updateDescriptionHeight(height: number) {
        this.internalState.descriptionHeight = height;
    }
}