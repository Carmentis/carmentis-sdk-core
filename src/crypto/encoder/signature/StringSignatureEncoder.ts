export {}
/*
import {SignatureEncoderInterface} from "./SignatureEncoderInterface";
import {EncoderFactory, EncoderInterface} from "../../../utils/encoder";
import {PublicSignatureKey} from "../../signature/PublicSignatureKey";
import {PrivateSignatureKey} from "../../signature/PrivateSignatureKey";

import {BytesSignatureEncoder} from "./BytesSignatureEncoder";


export class StringSignatureEncoder implements SignatureEncoderInterface<string> {


    constructor(
        private bytesEncoder: EncoderInterface<Uint8Array, string>,
        private signatureEncoder: SignatureEncoderInterface<Uint8Array> = new BytesSignatureEncoder()
    ) {
    }


    async encodePublicKey(publicKey: PublicSignatureKey): Promise<string> {
        return this.bytesEncoder.encode(
            await this.signatureEncoder.encodePublicKey(publicKey)
        )
    }

    async decodePublicKey(publicKey: string): Promise<PublicSignatureKey> {
        return this.signatureEncoder.decodePublicKey(
            this.bytesEncoder.decode(publicKey)
        )
    }



    async decodePrivateKey(privateKey: string): Promise<PrivateSignatureKey> {
        return this.signatureEncoder.decodePrivateKey(
            this.bytesEncoder.decode(privateKey)
        );
    }

    decodeSignature(signature: string): Uint8Array {
        return this.signatureEncoder.decodeSignature(
            this.bytesEncoder.decode(signature)
        );
    }


    async encodePrivateKey(privateKey: PrivateSignatureKey): Promise<string> {
        return this.bytesEncoder.encode(
            await this.signatureEncoder.encodePrivateKey(privateKey)
        );
    }

    encodeSignature(signature: Uint8Array): string {
        return this.bytesEncoder.encode(
            this.signatureEncoder.encodeSignature(signature)
        )
    }


    decodeMessage(message: string): Uint8Array {
        return this.bytesEncoder.decode(message);
    }


    encodeMessage(message: Uint8Array): string {
        return this.bytesEncoder.encode(message);
    }
}
*/