import {SignatureEncoderInterface} from "./SignatureEncoderInterface";
import {ISignatureDecodeHandler, ISignatureEncoderHandler} from "./ISignatureEncoderHandler";
import {PrivateSignatureKey} from "../../signature/PrivateSignatureKey";
import {PublicSignatureKey} from "../../signature/PublicSignatureKey";
import {BinaryToStringEncoderInterface} from "../../../utils/BinaryToStringEncoderInterface";
import {EncoderFactory} from "../../../utils/encoder";
import {Secp256k1HCVSignatureEncoder} from "./hcv/Secp256k1HCVSignatureEncoder";
import {MLDSA65HCVSignatureEncoder} from "./hcv/MLDSA65HCVSignatureEncoder";
import {PkmsSecp256k1SignatureEncoder} from "./hcv/PkmsSecp256k1SignatureEncoder";
import {Secp256k1HCVSignatureDecoder} from "./hcv/Secp256k1HCVSignatureDecoder";
import {MLDSA65HCVSignatureDecoder} from "./hcv/MLDSA65HCVSignatureDecoder";
import {PkmsSecp256k1SignatureDecoder} from "./hcv/PkmsSecp256k1SignatureDecoder";


/**
 * A class responsible for encoding and decoding signatures, keys, and messages using a pluggable architecture.
 * Implements the `SignatureEncoderInterface` for encoding and decoding operations.
 */
export class HandlerBasedSignatureEncoder implements SignatureEncoderInterface<string> {
    private encoders: ISignatureEncoderHandler[] = [
        new Secp256k1HCVSignatureEncoder(),
        new MLDSA65HCVSignatureEncoder(),
        new PkmsSecp256k1SignatureEncoder(),
    ];

    private decoders: ISignatureDecodeHandler[] = [
        new Secp256k1HCVSignatureDecoder(),
        new MLDSA65HCVSignatureDecoder(),
        new PkmsSecp256k1SignatureDecoder()
    ];



    constructor(
        private bytesEncoder: BinaryToStringEncoderInterface = EncoderFactory.bytesToHexEncoder()
    ) {}


    registerEncoder(encoder: ISignatureEncoderHandler) {
        this.encoders.push(encoder);
    }

    registerDecoder(decoder: ISignatureDecodeHandler) {
        this.decoders.push(decoder);
    }

    decodeMessage(message: string): Uint8Array {
        return this.bytesEncoder.decode(message);
    }

    async decodePrivateKey(privateKey: string) {
        for (const encoder of this.decoders) {
            if (await encoder.isAcceptingPrivateKeyDecodingRequest(privateKey)) {
                return await encoder.decodePrivateKey(privateKey);
            }
        }
        throw new Error("Invalid private key format: no decoder found");
    }

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

    async encodePrivateKey(privateKey: PrivateSignatureKey): Promise<string> {
        for (const encoder of this.encoders) {
            if (await encoder.isAcceptingPrivateKeyEncodingRequest(privateKey)) {
                return await encoder.encodePrivateKey(privateKey);
            }
        }
        throw new Error("No encoder found")
    }

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
}