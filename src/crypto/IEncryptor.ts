export interface IEncryptor {
    encrypt(plaintext: Uint8Array): Promise<Uint8Array>;
}