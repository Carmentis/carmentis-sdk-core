import {ISignatureEncoderHandler} from "../ISignatureEncoderHandler";
import {PrivateSignatureKey} from "../../../signature/PrivateSignatureKey";
import {PublicSignatureKey} from "../../../signature/PublicSignatureKey";
import {Secp256k1PublicSignatureKey} from "../../../signature/secp256k1/Secp256k1PublicSignatureKey";
import {Secp256k1PrivateSignatureKey} from "../../../signature/secp256k1/Secp256k1PrivateSignatureKey";
import {MLDSA65PrivateSignatureKey, MLDSA65PublicSignatureKey} from "../../../signature/ml-dsa-65";
import {
    PkmsSecp256k1PrivateSignatureKey,
    PkmsSecp256k1PublicSignatureKey
} from "../../../signature/pkms/PkmsSecp256k1PrivateSignatureKey";
import {
    SIGNATURE_TAG,
    SECP256K1_TAG,
    MLDSA65_TAG,
    PKMS_TAG,
    PUBLIC_KEY_TAG,
    SECRET_KEY_TAG, JWK_TAG,
} from "../../../../type/Resolver";
import {EncoderFactory} from "../../../../utils/encoder";
import {JwkPublicSignatureKey} from "../../../signature/jwk/JwkPublicSignatureKey";
import {base64url} from "jose";
import {JwkPrivateSignatureKey} from "../../../signature/jwk/JwkPrivateSignatureKey";

export class DckfSignatureEncoder implements ISignatureEncoderHandler {
    protected bytesEncoder = EncoderFactory.bytesToHexEncoder();

    async isAcceptingPublicKeyEncodingRequest(publicKey: PublicSignatureKey): Promise<boolean> {
        return this.getPublicKeySchemeTags(publicKey).length > 0;
    }

    async isAcceptingPrivateKeyEncodingRequest(privateKey: PrivateSignatureKey): Promise<boolean> {
        return this.getPrivateKeySchemeTags(privateKey).length > 0;
    }

    async encodePublicKey(publicKey: PublicSignatureKey): Promise<string> {
        if (!this.isAcceptingPublicKeyEncodingRequest(publicKey)) {
            throw new Error('unexpected public key type');
        }
        if (publicKey instanceof JwkPublicSignatureKey) {
            // The JWK is already canonical, members included: `JSON.stringify` walks them
            // in insertion order, so the identifier is a function of the key alone.
            return `did:jwk:${base64url.encode(JSON.stringify(publicKey.getPublicJwk()))}`;
        }
        const schemeTags = this.getPublicKeySchemeTags(publicKey);
        const keyPayload = await this.getPublicKeyPayload(publicKey);
        return [
            SIGNATURE_TAG,
            ...schemeTags,
            PUBLIC_KEY_TAG,
            keyPayload,
        ].join(":");
    }

    async encodePrivateKey(privateKey: PrivateSignatureKey): Promise<string> {
        if (!this.isAcceptingPrivateKeyEncodingRequest(privateKey)) {
            throw new Error('unexpected private key type');
        }
        const schemeTags = this.getPrivateKeySchemeTags(privateKey);
        const keyPayload = await this.getPrivateKeyPayload(privateKey);
        return [
            SIGNATURE_TAG,
            ...schemeTags,
            SECRET_KEY_TAG,
            keyPayload,
        ].join(":");
    }

    private async getPublicKeyPayload(publicKey: PublicSignatureKey) {
        return this.bytesEncoder.encode(await publicKey.getPublicKeyAsBytes());
    }

    private async getPrivateKeyPayload(privateKey: PrivateSignatureKey) {
        if (privateKey instanceof PkmsSecp256k1PrivateSignatureKey) {
            return privateKey.getKeyId();
        }
        return this.bytesEncoder.encode(privateKey.getPrivateKeyAsBytes());
    }

    private getPublicKeySchemeTags(publicKey: PublicSignatureKey): string[] {
        if (publicKey instanceof Secp256k1PublicSignatureKey) {
            return [ SECP256K1_TAG ];
        }
        if (publicKey instanceof MLDSA65PublicSignatureKey) {
            return [ MLDSA65_TAG ];
        }
        if (publicKey instanceof PkmsSecp256k1PublicSignatureKey) {
            return [ PKMS_TAG, SECP256K1_TAG ];
        }
        if (publicKey instanceof JwkPublicSignatureKey) {
            return [ JWK_TAG ];
        }
        return [];
    }

    private getPrivateKeySchemeTags(privateKey: PrivateSignatureKey): string[] {
        if (privateKey instanceof Secp256k1PrivateSignatureKey) {
            return [ SECP256K1_TAG ];
        }
        if (privateKey instanceof MLDSA65PrivateSignatureKey) {
            return [ MLDSA65_TAG ];
        }
        if (privateKey instanceof PkmsSecp256k1PrivateSignatureKey) {
            return [ PKMS_TAG, SECP256K1_TAG ];
        }
        if (privateKey instanceof JwkPrivateSignatureKey) {
            return [ JWK_TAG ];
        }
        return [];
    }
}
