export interface IKeySeedProvider {
    getSeedAsBytes(): Uint8Array;
}