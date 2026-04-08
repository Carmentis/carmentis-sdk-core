import {scrypt} from "@noble/hashes/scrypt.js";
import {PasswordBasedKeyDerivationFunctionSchemeId} from "./PasswordBasedKeyDerivationFunctionSchemeId";
import {PasswordBasedKeyDerivationFunction} from "./PasswordBasedKeyDerivationFunction";

export class Scrypt extends PasswordBasedKeyDerivationFunction {
    getKeyDerivationFunctionSchemeId(): PasswordBasedKeyDerivationFunctionSchemeId {
        return PasswordBasedKeyDerivationFunctionSchemeId.SCRYPT;
    }

    deriveKey(password: string, salt: string, keyLength: number): Uint8Array {
        return scrypt(password, salt, { N: 2 ** 16, r: 8, p: 1, dkLen: keyLength });
    }
}