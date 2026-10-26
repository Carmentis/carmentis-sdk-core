import {argon2id} from "@noble/hashes/argon2.js";
import {PasswordBasedKeyDerivationFunctionSchemeId} from "./PasswordBasedKeyDerivationFunctionSchemeId";
import {PasswordBasedKeyDerivationFunction} from "./PasswordBasedKeyDerivationFunction";

export interface Argon2idParams {
    /** Number of passes over the memory. */
    t: number;
    /** Memory cost, in KiB. */
    m: number;
    /** Degree of parallelism. */
    p: number;
}

export const DEFAULT_ARGON2ID_PARAMS: Argon2idParams = {t: 3, m: 64 * 1024, p: 1};

/**
 * Argon2id (RFC 9106, version 0x13) password-based key derivation.
 *
 * Unlike the other password-based derivations, the cost parameters are carried by the
 * instance, so that they can be stored next to the data they protect and replayed on decryption.
 */
export class Argon2id extends PasswordBasedKeyDerivationFunction {
    constructor(private readonly params: Argon2idParams = DEFAULT_ARGON2ID_PARAMS) {
        super();
    }

    getKeyDerivationFunctionSchemeId(): PasswordBasedKeyDerivationFunctionSchemeId {
        return PasswordBasedKeyDerivationFunctionSchemeId.ARGON2ID;
    }

    getParams(): Argon2idParams {
        return {...this.params};
    }

    deriveKey(password: string, salt: string | Uint8Array, keyLength: number): Uint8Array {
        return argon2id(password, salt, {...this.params, dkLen: keyLength});
    }
}
