import {sha256, sha512} from "@noble/hashes/sha2";
import {hashes} from "@noble/ed25519";
hashes.sha512 = sha512;

export interface CryptographicHash {
    getHashSchemeId(): CryptographicHashSchemeId;
    hash(data: Uint8Array): Uint8Array;
}

export enum CryptographicHashSchemeId {
    SHA256,
}

export class Sha256CryptographicHash implements CryptographicHash {
    getHashSchemeId(): CryptographicHashSchemeId {
        return CryptographicHashSchemeId.SHA256;
    }

    hash(data: Uint8Array): Uint8Array {
        return sha256(data);
    }
}