import {CarmentisErrorCode, InternalError} from "./carmentis-error";

export class TypeCheckingFailureError extends InternalError {
    constructor(message: string) {
        super(message, CarmentisErrorCode.TYPE_CHECKING_FAILURE_ERROR);
    }
}