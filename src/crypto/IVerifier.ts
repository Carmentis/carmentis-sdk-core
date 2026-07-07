export interface IVerifier {
    verify(data: Uint8Array, signature: Uint8Array): Promise<boolean>;
}