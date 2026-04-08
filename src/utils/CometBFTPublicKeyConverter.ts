import {Sha256CryptographicHash} from "../crypto/hash/hash-interface";
import {Hashes} from "../crypto/hashes";

export class CometBFTPublicKeyConverter {
    public static convertRawPublicKeyIntoAddress(publicKey: Uint8Array): Uint8Array {
        return Hashes.sha256AsBinary(publicKey).slice(0, 20);
    }
}