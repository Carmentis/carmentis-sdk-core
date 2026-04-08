import {SignatureSchemeId} from "../crypto/signature/SignatureSchemeId";
import {PublicKeyEncryptionSchemeId} from "../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeId";
import {PrivateSignatureKey} from "../crypto/signature/PrivateSignatureKey";
import {PublicSignatureKey} from "../crypto/signature/PublicSignatureKey";
import {
    PrivateDecryptionKey,
    PublicEncryptionKey
} from "../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeInterface";

export interface ICryptoKeyHandler {
    getPrivateSignatureKey(schemeId: SignatureSchemeId): Promise<PrivateSignatureKey>;
    getPublicSignatureKey(schemeId: SignatureSchemeId): Promise<PublicSignatureKey>;
    getPrivateDecryptionKey(schemeId: PublicKeyEncryptionSchemeId): Promise<PrivateDecryptionKey>;
    getPublicEncryptionKey(schemeId: PublicKeyEncryptionSchemeId): Promise<PublicEncryptionKey>;
    getSeedAsBytes(): Uint8Array;
}