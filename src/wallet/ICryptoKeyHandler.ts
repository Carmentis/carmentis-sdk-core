import {SignatureSchemeId} from "../crypto/signature/SignatureSchemeId";
import {PublicKeyEncryptionSchemeId} from "../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeId";
import {PrivateSignatureKey} from "../crypto/signature/PrivateSignatureKey";
import {PublicSignatureKey} from "../crypto/signature/PublicSignatureKey";
import {
    PrivateDecryptionKey,
    PublicEncryptionKey
} from "../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeInterface";
import {IKeySeedProvider} from "../crypto/IKeySeedProvider";

export interface ICryptoKeyHandler extends IKeySeedProvider {
    getPrivateSignatureKey(schemeId?: SignatureSchemeId): Promise<PrivateSignatureKey>;
    getPublicSignatureKey(schemeId?: SignatureSchemeId): Promise<PublicSignatureKey>;
    getPrivateDecryptionKey(schemeId?: PublicKeyEncryptionSchemeId): Promise<PrivateDecryptionKey>;
    getPublicEncryptionKey(schemeId?: PublicKeyEncryptionSchemeId): Promise<PublicEncryptionKey>;
}