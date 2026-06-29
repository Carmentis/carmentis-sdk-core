// generic-symmetric-key-encoder.spec.ts
import {GenericSymmetricKeyEncoder} from '../../src/crypto/encryption/symmetric-encryption/generic-symmetric-key-encoder';
import {AES256GCMSymmetricEncryptionKey, SymmetricEncryptionSchemeId} from "../../src/crypto/encryption/symmetric-encryption/encryption-interface";
import {describe, it, expect, beforeEach} from 'vitest';
describe('GenericSymmetricKeyEncoder', () => {
    let encoder: GenericSymmetricKeyEncoder;

    beforeEach(() => {
        encoder = new GenericSymmetricKeyEncoder();
    });

    describe('AES-256-CGM correct encoding', () => {
        it('should correctly encode a symmetric encryption key into Uint8Array', async () => {
            const key = await AES256GCMSymmetricEncryptionKey.generate();
            const encodedKey = encoder.encodeAsUint8Array(key);
            const decodedKey = encoder.decodeFromUint8Array(encodedKey);
            expect(key.getSymmetricEncryptionSchemeId()).toBe(SymmetricEncryptionSchemeId.AES_256_GCM);
            expect(decodedKey.getSymmetricEncryptionSchemeId()).toBe(SymmetricEncryptionSchemeId.AES_256_GCM);
            expect(key.getRawSecretKey()).toEqual(decodedKey.getRawSecretKey());
        });
    });
});