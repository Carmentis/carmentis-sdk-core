export interface ISigner {
    sign(data: Uint8Array): Promise<Uint8Array>;
}