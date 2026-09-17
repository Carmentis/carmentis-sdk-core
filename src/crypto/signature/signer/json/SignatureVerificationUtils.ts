import {SignatureContext, SignatureVerification} from "../../../../type/JsonSignatureSchemas";

export class SignatureVerificationUtils {
    static invalidSignature(): SignatureVerification {
        return {
            verified: false,
            errors: ['Invalid signature']
        }
    }

    static malformed(): SignatureVerification {
        return {
            verified: false,
            errors: ['Malformed signature']
        }
    }

    static verified(context: SignatureContext, payload: unknown): SignatureVerification {
        return {
            verified: true,
            context,
            payload
        }
    }

    static notValidYet(): SignatureVerification {
        return {
            verified: false,
            errors: ['Not valid yet']
        }
    }

    static expired(): SignatureVerification {
        return {
            verified: false,
            errors: ['Expired']
        }
    }

    static allowedOnChainNotMatch(): SignatureVerification {
        return {
            verified: false,
            errors: ['Allowed on chain not match']
        }
    }
}