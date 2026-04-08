import {PublicSignatureKey} from "../../signature/PublicSignatureKey";
import {PrivateSignatureKey} from "../../signature/PrivateSignatureKey";

/**
 * An interface for encoding and decoding cryptographic signature keys and signatures.
 *
 * Provides methods to encode and decode public keys, private keys, and signatures
 * into or from a specified format `T`.
 *
 * @template T - The format type for encoded keys and signatures.
 */
export interface SignatureEncoderInterface<T> {
    /**
     * Encodes the given public signature key into a specific format.
     *
     * @param {PublicSignatureKey} publicKey - The public signature key that needs to be encoded.
     * @return {T} The encoded representation of the public signature key.
     */
    encodePublicKey(publicKey: PublicSignatureKey): Promise<T>;

    /**
     * Decodes a given public key object into a public signature key.
     *
     * @param {T} publicKey - The public key object that needs to be decoded.
     * @return {PublicSignatureKey} The decoded public signature key.
     */
    decodePublicKey(publicKey: T): Promise<PublicSignatureKey>;

    /**
     * Encodes the given private key into a specific format.
     *
     * @param {PrivateSignatureKey} privateKey - The private key to be encoded.
     * @return {T} The encoded representation of the private key.
     */
    encodePrivateKey(privateKey: PrivateSignatureKey): Promise<T>;

    /**
     * Decodes the provided private key and returns a private signature key object.
     *
     * @param {T} privateKey - The private key to decode.
     * @return {PrivateSignatureKey} A decoded private signature key object.
     */
    decodePrivateKey(privateKey: T): Promise<PrivateSignatureKey>;

    /**
     * Encodes a given digital signature into a specific format.
     *
     * @param {Uint8Array} signature - The digital signature to be encoded. It should be provided as a Uint8Array.
     * @return {T} The encoded signature in the required format, where T represents the resulting type of the encoded output.
     */
    encodeSignature(signature: Uint8Array): T;

    /**
     * Decodes the provided signature into a Uint8Array.
     *
     * @param {T} signature - The signature to be decoded.
     * @return {Uint8Array} The decoded signature as a Uint8Array.
     */
    decodeSignature(signature: T): Uint8Array;

    /**
     * Encodes a given message into a specific format.
     *
     * @param {Uint8Array} message - The message to be encoded, provided as a Uint8Array.
     * @return {T} The encoded message in the specified format.
     */
    encodeMessage(message: Uint8Array): T;

    /**
     * Decodes the provided message into a Uint8Array.
     *
     * @param {T} message - The message to be decoded. The type of the message is generic and should be specified upon usage.
     * @return {Uint8Array} - The decoded representation of the input message as a Uint8Array.
     */
    decodeMessage(message: T): Uint8Array;
}