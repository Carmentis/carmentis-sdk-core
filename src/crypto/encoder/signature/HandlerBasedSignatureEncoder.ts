import {SignatureEncoderInterface} from "./SignatureEncoderInterface";
import {ISignatureDecodeHandler, ISignatureEncoderHandler} from "./ISignatureEncoderHandler";
import {PrivateSignatureKey} from "../../signature/PrivateSignatureKey";
import {PublicSignatureKey} from "../../signature/PublicSignatureKey";
import {BinaryToStringEncoderInterface} from "../../../utils/BinaryToStringEncoderInterface";
import {EncoderFactory} from "../../../utils/encoder";
import {DckfSignatureEncoder} from "./dckf/DckfSignatureEncoder";
import {Secp256k1HCVSignatureDecoder} from "./hcv/Secp256k1HCVSignatureDecoder";
import {MLDSA65HCVSignatureDecoder} from "./hcv/MLDSA65HCVSignatureDecoder";
import {PkmsSecp256k1SignatureDecoder} from "./hcv/PkmsSecp256k1SignatureDecoder";
import {DckfSignatureDecoder} from "./dckf/DckfSignatureDecoder";

/**
 * A class responsible for encoding and decoding signatures, keys, and messages using a pluggable architecture.
 * Implements the `SignatureEncoderInterface` for encoding and decoding operations.
 */
export class HandlerBasedSignatureEncoder implements SignatureEncoderInterface<string> {

    /**
     * Creates and returns a newly instantiated empty instance of `HandlerBasedSignatureEncoder`.
     *
     * @return {HandlerBasedSignatureEncoder} An empty instance of `HandlerBasedSignatureEncoder`.
     */
    static createEmpty() {
        const res = new HandlerBasedSignatureEncoder();
        res.clear();
        return res;
    }

    private encoders: ISignatureEncoderHandler[] = [
        new DckfSignatureEncoder(),
    ];

    private decoders: ISignatureDecodeHandler[] = [
        new DckfSignatureDecoder(),
        new Secp256k1HCVSignatureDecoder(),
        new MLDSA65HCVSignatureDecoder(),
        new PkmsSecp256k1SignatureDecoder()
    ];

    constructor(
        private bytesEncoder: BinaryToStringEncoderInterface = EncoderFactory.bytesToHexEncoder()
    ) {}

    /**
     * Registers a new encoder to the list of available encoders.
     * @param encoder - The encoder to be registered.
     */
    registerEncoder(encoder: ISignatureEncoderHandler) {
        this.encoders.push(encoder);
    }

    /**
     * Registers a new decoder to the list of available decoders.
     * @param decoder
     */
    registerDecoder(decoder: ISignatureDecodeHandler) {
        this.decoders.push(decoder);
    }

    decodeMessage(message: string): Uint8Array {
        return this.bytesEncoder.decode(message);
    }

    /**
     * Decodes a given private key using an appropriate decoder from the available decoders.
     *
     * @param {string} privateKey - The private key string to be decoded.
     * @return {Promise<PrivateSignatureKey>} A promise that resolves with the decoded private key, or rejects with an error if no suitable decoder is found.
     */
    async decodePrivateKey(privateKey: string) {
        for (const encoder of this.decoders) {
            if (await encoder.isAcceptingPrivateKeyDecodingRequest(privateKey)) {
                return await encoder.decodePrivateKey(privateKey);
            }
        }
        throw new Error("Invalid private key format: no decoder found");
    }

    /**
     * Decodes the provided public key string into a `PublicSignatureKey` object.
     * Iterates through available decoders to find a compatible one for decoding.
     *
     * @param {string} publicKey - The public key string to be decoded.
     * @return {Promise<PublicSignatureKey>} A promise that resolves to the decoded `PublicSignatureKey` object.
     * @throws {Error} If no compatible decoder is found for the provided public key.
     */
    async decodePublicKey(publicKey: string): Promise<PublicSignatureKey> {
        for (const encoder of this.decoders) {
            if (await encoder.isAcceptingPublicKeyDecodingRequest(publicKey)) {
                return await encoder.decodePublicKey(publicKey);
            }
        }
        throw new Error("Invalid private key format: no decoder found");
    }

    decodeSignature(signature: string): Uint8Array {
        return this.bytesEncoder.decode(signature);
    }

    encodeMessage(message: Uint8Array): string {
        return this.bytesEncoder.encode(message);
    }

    /**
     * Encodes a given private key using the first suitable encoder available.
     *
     * @param {PrivateSignatureKey} privateKey - The private key to be encoded.
     * @return {Promise<string>} A promise that resolves to the encoded private key as a string.
     * @throws {Error} Throws an error if no encoder is found to handle the encoding request.
     */
    async encodePrivateKey(privateKey: PrivateSignatureKey): Promise<string> {
        for (const encoder of this.encoders) {
            if (await encoder.isAcceptingPrivateKeyEncodingRequest(privateKey)) {
                return await encoder.encodePrivateKey(privateKey);
            }
        }
        throw new Error("No encoder found")
    }

    /**
     * Encodes a given public key using the first suitable encoder available.
     *
     * @param {PublicSignatureKey} publicKey - The public key to be encoded.
     * @return {Promise<string>} A promise that resolves to the encoded public key as a string.
     * @throws {Error} Throws an error if no encoder is found to handle the encoding request.
     */
    async encodePublicKey(publicKey: PublicSignatureKey): Promise<string> {
        for (const encoder of this.encoders) {
            if (await encoder.isAcceptingPublicKeyEncodingRequest(publicKey)) {
                return await encoder.encodePublicKey(publicKey);
            }
        }
        throw new Error("No encoder found")
    }

    encodeSignature(signature: Uint8Array): string {
        return this.bytesEncoder.encode(signature)
    }

    /**
     * Removes all encoders and decoders.
     */
    clear() {
        this.clearEncoders();
        this.clearDecoders();
    }

    /**
     * Removes all encoders.
     */
    clearEncoders() {
        this.encoders = [];
    }


    /**
     * Removes all decoders.
     */
    clearDecoders() {
        this.decoders = [];
    }
}