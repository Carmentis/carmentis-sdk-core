export interface IDecryptor {
    decrypt(ciphertext: Uint8Array): Promise<Uint8Array>;
}