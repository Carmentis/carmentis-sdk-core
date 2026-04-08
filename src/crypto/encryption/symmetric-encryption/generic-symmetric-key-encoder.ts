import {CryptoSchemeFactory} from "../../CryptoSchemeFactory";
import {bytesToHex, bytesToUtf8, hexToBytes} from "@noble/ciphers/utils";
import {utf8ToBytes} from "@noble/hashes/utils";
import {SymmetricEncryptionKey} from "./encryption-interface";


/**
 * A class responsible for encoding and decoding symmetric encryption keys.
 * It provides functionalities to serialize and deserialize symmetric encryption keys to and from a Uint8Array.
 */
export class GenericSymmetricKeyEncoder  {

    /**
     * Encodes a given symmetric encryption key as a Uint8Array.
     *
     * @param {SymmetricEncryptionKey} key - The symmetric encryption key to encode.
     *                                        It must provide methods to retrieve the encryption scheme ID
     *                                        and the raw secret key as a hexadecimal string.
     * @return {Uint8Array} The encoded representation of the symmetric encryption key in Uint8Array format.
     */
    encodeAsUint8Array(key: SymmetricEncryptionKey): Uint8Array {
        return utf8ToBytes(JSON.stringify({
            symmetricEncryptionSchemeId: key.getSymmetricEncryptionSchemeId(),
            key: bytesToHex(key.getRawSecretKey())
        }));
    }

    /**
     * Decodes a Uint8Array into a SymmetricEncryptionKey object.
     *
     * @param {Uint8Array} key - The Uint8Array containing the encoded symmetric encryption key.
     * @return {SymmetricEncryptionKey} Returns the decoded symmetric encryption key object.
     * @throws {Error} Throws an error if the input format is invalid or does not meet the expected structure.
     */
    decodeFromUint8Array(key: Uint8Array): SymmetricEncryptionKey {
        const items = JSON.parse(bytesToUtf8(key));
        if (items && typeof items.symmetricEncryptionSchemeId === "number" && typeof items.key === "string") {
            const rawKey = hexToBytes(items.key);
            const factory = new CryptoSchemeFactory();
            return factory.createSymmetricEncryptionKey(items.symmetricEncryptionSchemeId, rawKey);
        } else {
            throw "Invalid symmetric encryption key format: expected raw-encoded JSON object with symmetricEncryptionSchemeId and key fields."
        }
    }
}