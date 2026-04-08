import {pbkdf2} from "@noble/hashes/pbkdf2.js";
import {sha256} from "@noble/hashes/sha2.js";
import {PasswordBasedKeyDerivationFunctionSchemeId} from "./PasswordBasedKeyDerivationFunctionSchemeId";
import {PasswordBasedKeyDerivationFunction} from "./PasswordBasedKeyDerivationFunction";

export class PBKDF2 extends PasswordBasedKeyDerivationFunction {
    getKeyDerivationFunctionSchemeId(): PasswordBasedKeyDerivationFunctionSchemeId {
        return PasswordBasedKeyDerivationFunctionSchemeId.PBKDF2;
    }

    deriveKey(password: string, salt: string, keyLength: number): Uint8Array {
        return pbkdf2(sha256, password, salt, {c: 100000, dkLen: keyLength});
    }
}