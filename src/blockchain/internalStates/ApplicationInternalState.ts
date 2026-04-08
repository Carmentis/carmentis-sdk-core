import {Utils} from "../../utils/utils";
import {Hash} from "../../entities/Hash";
import {IInternalState} from "./IInternalState";
import {ApplicationVBInternalStateObject} from "../../type/valibot/blockchain/virtualBlockchain/internalStates";

export class ApplicationInternalState implements IInternalState {
    constructor(private internalState: ApplicationVBInternalStateObject) {
    }

    static createFromObject(internalState: unknown) {
        return new ApplicationInternalState(<ApplicationVBInternalStateObject>internalState);
    }

    static createInitialState() {
        return new ApplicationInternalState({
            organizationId: Utils.getNullHash(),
            descriptionHeight: 0
        });
    }

    clone() {
        return new ApplicationInternalState({...this.internalState})
    }

    toObject(): ApplicationVBInternalStateObject {
        return this.internalState;
    }


    setOrganizationId(organizationId: Uint8Array) {
        this.internalState.organizationId = organizationId;
    }

    setDescriptionHeight(descriptionHeight: number) {
        this.internalState.descriptionHeight = descriptionHeight;
    }

    getOrganizationId(): Hash {
        return Hash.from(this.internalState.organizationId);
    }

    getDescriptionHeight() {
        return this.internalState.descriptionHeight;
    }
}