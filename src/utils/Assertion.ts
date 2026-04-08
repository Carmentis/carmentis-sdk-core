import {InternalError} from "../errors/carmentis-error";

export class Assertion {
    static assert(isVerified: boolean, messageOnUnverified: string = "Unspecified verification") {
        if (!isVerified) throw new InternalError(`Assertion failed: ${messageOnUnverified}`)
    }
}