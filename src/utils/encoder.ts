import {bytesToHex, hexToBytes} from "@noble/ciphers/utils";
import {Base64} from "../data/base64";


/**
 * Interface representing a generic encoder capable of encoding and decoding data.
 *
 * @template L - The type of the input data to be encoded.
 * @template R - The type of the output data after encoding and also the input for decoding.
 */
export interface EncoderInterface<L,R> {
    /**
     * Encodes the given data into the desired format or structure.
     *
     * @param {L} data - The input data to be encoded.
     * @return {R} The encoded result.
     */
    encode(data: L): R;
    /**
     * Decodes the provided data into a specific format or type.
     *
     * @param {R} data - The input data to decode.
     * @return {L} The decoded output.
     */
    decode(data: R): L;
}

/**
 * EncoderFactory is a class responsible for providing encoder instances.
 * It contains static utility methods to create and retrieve encoders for specific purposes.
 */
export class EncoderFactory {
    /**
     * Provides the default encoder for converting `Uint8Array` bytes to a hexadecimal string representation.
     *
     * @return {EncoderInterface<Uint8Array, string>} An instance of `BytesToHexEncoder` for encoding bytes to strings.
     */
    static defaultBytesToStringEncoder(): EncoderInterface<Uint8Array, string> {
        return new BytesToHexEncoder();
    }

    /**
     * Provides an encoder for converting `Uint8Array` bytes to a base64 string representation.
     *
     * @return {EncoderInterface<Uint8Array, string>} An instance of `BytesToBase64Encoder` for encoding bytes to base64 strings.
     */
    static bytesToBase64Encoder(): EncoderInterface<Uint8Array, string> {
        return new BytesToBase64Encoder();
    }

    /**
     * Retrieves an encoder instance that converts bytes (Uint8Array) into a hexadecimal string representation.
     *
     * @return {EncoderInterface<Uint8Array, string>} An encoder capable of transforming a Uint8Array into a hexadecimal string.
     */
    static bytesToHexEncoder(): EncoderInterface<Uint8Array, string> {
        return new BytesToHexEncoder();
    }
}

/**
 * A class that implements an encoder to convert between byte arrays (Uint8Array)
 * and base64 string representations. It provides methods for both encoding
 * byte arrays to base64 strings and decoding base64 strings back to byte arrays.
 *
 * This class adheres to the `EncoderInterface` interface, parameterized with
 * `Uint8Array` for the input/output data type and `string` for the encoded format.
 *
 * Methods:
 * - encode: Converts a given Uint8Array into its base64 string equivalent.
 * - decode: Converts a base64 string back into a Uint8Array representation.
 */
export class BytesToBase64Encoder implements EncoderInterface<Uint8Array, string> {

    /**
     * Statically decodes a base64 string into a Uint8Array.
     *
     * @param {string} data The base64 string to decode.
     * @return {Uint8Array} The Uint8Array representation of the decoded data.
     */
    static decode(data: string): Uint8Array {
        return Base64.decodeBinary(data, Base64.BASE64);
    }

    /**
     * Statically encodes the given Uint8Array data into a base64 string representation.
     *
     * @param {Uint8Array} data - The byte array to be encoded.
     * @return {string} The base64 string representation of the input data.
     */
    static encode(data: Uint8Array): string {
        return Base64.encodeBinary(data, Base64.BASE64, true);
    }

    /**
     * Decodes a base64 string into a Uint8Array.
     *
     * @param {string} data The base64 string to decode.
     * @return {Uint8Array} The Uint8Array representation of the decoded data.
     */
    decode(data: string): Uint8Array {
        return Base64.decodeBinary(data, Base64.BASE64);
    }

    /**
     * Encodes the given Uint8Array data into a base64 string representation.
     *
     * @param {Uint8Array} data - The byte array to be encoded.
     * @return {string} The base64 string representation of the input data.
     */
    encode(data: Uint8Array): string {
        return Base64.encodeBinary(data, Base64.BASE64, true);
    }
}

/**
 * A class that implements an encoder to convert between byte arrays (Uint8Array)
 * and hexadecimal string representations. It provides methods for both encoding
 * byte arrays to hex strings and decoding hex strings back to byte arrays.
 *
 * This class adheres to the `EncoderInterface` interface, parameterized with
 * `Uint8Array` for the input/output data type and `string` for the encoded format.
 *
 * Methods:
 * - encode: Converts a given Uint8Array into its hexadecimal string equivalent.
 * - decode: Converts a hexadecimal string back into a Uint8Array representation.
 */
export class BytesToHexEncoder implements EncoderInterface<Uint8Array, string> {
    /**
     * Decodes a hexadecimal string into a Uint8Array.
     *
     * @param {string} data The hexadecimal string to decode.
     * @return {Uint8Array} The Uint8Array representation of the decoded data.
     */
    decode(data: string): Uint8Array {
        return hexToBytes(data);
    }

    /**
     * Encodes the given Uint8Array data into a hexadecimal string representation.
     *
     * @param {Uint8Array} data - The byte array to be encoded.
     * @return {string} The hexadecimal string representation of the input data.
     */
    encode(data: Uint8Array): string {
        if (!(data instanceof Uint8Array)) throw new TypeError(`Encoding data must be a Uint8Array, got ${typeof data}`);
        return bytesToHex(data);
    }
}



