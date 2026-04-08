import {KeyDerivationFunctionSchemeId} from "./keyDerivationFunctionSchemeId";

export abstract class KeyDerivationFunction {
    abstract  getKeyDerivationFunctionSchemeId(): KeyDerivationFunctionSchemeId;
    abstract deriveKey(inputKeyingMaterial: Uint8Array, salt: Uint8Array, info: Uint8Array, keyLength: number): Uint8Array;
    public deriveKeyNoSalt(inputKeyingMaterial: Uint8Array, info: Uint8Array, keyLength: number): Uint8Array {
        const emptySalt = new Uint8Array(0);
        return this.deriveKey(inputKeyingMaterial, emptySalt, info, keyLength);   
    }

}