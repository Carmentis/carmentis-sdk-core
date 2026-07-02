import {ISignatureDecodeHandler} from "../ISignatureEncoderHandler";
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
    SECRET_KEY_TAG,
} from "../../../../type/Resolver";
import {EncoderFactory} from "../../../../utils/encoder";

interface DecodedKey {
    schemeTags: string[];
    typeTag: string;
    payload: string;
};

export class DckfSignatureDecoder implements ISignatureDecodeHandler {
    protected bytesEncoder = EncoderFactory.bytesToHexEncoder();

    static getAcceptedSchemeTags() {
        return [
            [ SECP256K1_TAG ],
            [ MLDSA65_TAG ],
            [ PKMS_TAG, SECP256K1_TAG ],
        ];
    }

    async isAcceptingPublicKeyDecodingRequest(encodedPublicKey: string): Promise<boolean> {
        const keyParts = this.getKeyParts(encodedPublicKey);
        return keyParts !== null && keyParts.typeTag === PUBLIC_KEY_TAG;
    }

    async isAcceptingPrivateKeyDecodingRequest(encodedPrivateKey: string): Promise<boolean> {
        const keyParts = this.getKeyParts(encodedPrivateKey);
        return keyParts !== null && keyParts.typeTag === SECRET_KEY_TAG;
    }

    async decodePublicKey(encodedPublicKey: string): Promise<PublicSignatureKey> {
        const keyParts = this.getKeyParts(encodedPublicKey);
        if (keyParts === null) {
            throw new Error('invalid key format');
        }
        if (keyParts.typeTag !== PUBLIC_KEY_TAG) {
            throw new Error('not a public key format');
        }
        switch (keyParts.schemeTags[0]) {
            case SECP256K1_TAG: {
                const publicKeyBytes = this.bytesEncoder.decode(keyParts.payload);
                return new Secp256k1PublicSignatureKey(publicKeyBytes)
            }
            case MLDSA65_TAG: {
                const publicKeyBytes = this.bytesEncoder.decode(keyParts.payload);
                return new MLDSA65PublicSignatureKey(publicKeyBytes)
            }
            case PKMS_TAG: {
                if (keyParts.schemeTags[1] === SECP256K1_TAG) {
                    const publicKeyBytes = this.bytesEncoder.decode(keyParts.payload);
                    return new PkmsSecp256k1PublicSignatureKey(publicKeyBytes);
                }
                break;
            }
        }
        throw new Error('unsupported key format');
    }

    async decodePrivateKey(encodedPrivateKey: string): Promise<PrivateSignatureKey> {
        const keyParts = this.getKeyParts(encodedPrivateKey);
        if (keyParts === null) {
            throw new Error('invalid key format');
        }
        if (keyParts.typeTag !== SECRET_KEY_TAG) {
            throw new Error('not a private key format');
        }
        switch (keyParts.schemeTags[0]) {
            case SECP256K1_TAG: {
                const privateKeyBytes = this.bytesEncoder.decode(keyParts.payload);
                return new Secp256k1PrivateSignatureKey(privateKeyBytes)
            }
            case MLDSA65_TAG: {
                const privateKeyBytes = this.bytesEncoder.decode(keyParts.payload);
                return new MLDSA65PrivateSignatureKey(privateKeyBytes)
            }
            case PKMS_TAG: {
                if (keyParts.schemeTags[1] === SECP256K1_TAG) {
                    const privateKeyId = keyParts.payload;
                    return new PkmsSecp256k1PrivateSignatureKey(privateKeyId);
                }
                break;
            }
        }
        throw new Error('unsupported key format');
    }

    private getKeyParts(encodedKey: string): DecodedKey | null {
        const parts = encodedKey.split(":");
        let ptr = 0;

        const sigTag = parts[ptr++];
        if (sigTag !== SIGNATURE_TAG) {
            return null;
        }
        const schemeTags: string[] = [];
        const leadingSchemeTag = parts[ptr++];
        schemeTags.push(leadingSchemeTag);
        if (leadingSchemeTag === PKMS_TAG) {
            schemeTags.push(parts[ptr++]);
        }
        const acceptedKeySchemeTags = DckfSignatureDecoder.getAcceptedSchemeTags();
        if (!acceptedKeySchemeTags.some((tagList) =>
            schemeTags.length === tagList.length &&
            schemeTags.every((tag, ndx) => tagList[ndx] === tag)
        )) {
            return null;
        }
        const typeTag = parts[ptr++];
        if (typeTag !== PUBLIC_KEY_TAG && typeTag !== SECRET_KEY_TAG) {
            return null;
        }
        const payload = parts[ptr++];
        if (payload === undefined || parts[ptr] !== undefined) {
            return null;
        }
        return {
            schemeTags,
            typeTag,
            payload,
        };
    }
}
