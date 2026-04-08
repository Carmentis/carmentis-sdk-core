import {SignatureEncoderInterface} from "./SignatureEncoderInterface";
import {PublicSignatureKey} from "../../signature/PublicSignatureKey";
import {utf8ToBytes} from "@noble/hashes/utils";
import {bytesToHex, bytesToUtf8, hexToBytes} from "@noble/ciphers/utils";
import {CryptoSchemeFactory} from "../../CryptoSchemeFactory";
import {PrivateSignatureKey} from "../../signature/PrivateSignatureKey";

/**
 * Class responsible for encoding and decoding digital signature-related data.
 * Provides methods to convert signatures, public keys, and private keys between raw formats and serialized representations.
 */
export class BytesSignatureEncoder implements SignatureEncoderInterface<Uint8Array> {
    encodeSignature(signature: Uint8Array): Uint8Array<ArrayBufferLike> {
        return signature
    }

    decodeSignature(signature: Uint8Array<ArrayBufferLike>): Uint8Array {
        return signature;
    }

    encodeMessage(message: Uint8Array): Uint8Array<ArrayBufferLike> {
        return message;
    }

    decodeMessage(message: Uint8Array<ArrayBufferLike>): Uint8Array {
        return message;
    }


    async encodePublicKey(publicKey: PublicSignatureKey): Promise<Uint8Array> {
        return utf8ToBytes(JSON.stringify({
            signatureSchemeId: publicKey.getSignatureSchemeId(),
            publicKey: bytesToHex(await publicKey.getPublicKeyAsBytes())
        }));
    }


    async decodePublicKey(publicKey: Uint8Array): Promise<PublicSignatureKey> {
        const items = JSON.parse(bytesToUtf8(publicKey));
        if (items && typeof items.signatureSchemeId === "number" && typeof items.publicKey === "string") {
            const rawPublicKey = hexToBytes(items.publicKey);
            const factory = new CryptoSchemeFactory();
            return factory.createPublicSignatureKey(items.signatureSchemeId, rawPublicKey);
        } else {
            throw "Invalid public key format: expected raw-encoded JSON object with signatureSchemeId and publicKey fields."
        }
    }

    async encodePrivateKey(privateKey: PrivateSignatureKey) {
        return utf8ToBytes(JSON.stringify({
            signatureSchemeId: privateKey.getSignatureSchemeId(),
            privateKey: bytesToHex(privateKey.getPrivateKeyAsBytes())
        }));
    }


    async decodePrivateKey(privateKey: Uint8Array) {
        const items = JSON.parse(bytesToUtf8(privateKey));
        if (items && typeof items.signatureSchemeId === "number" && typeof items.privateKey === "string") {
            const rawPublicKey = hexToBytes(items.privateKey);
            return CryptoSchemeFactory.createPrivateSignatureKey(items.signatureSchemeId, rawPublicKey);
        } else {
            throw "Invalid public key format: expected raw-encoded JSON object with signatureSchemeId and privateKey fields."
        }
    }
}