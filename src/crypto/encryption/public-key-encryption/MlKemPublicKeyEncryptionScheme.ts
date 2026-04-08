import {AbstractPublicKeyEncryptionScheme} from "./PublicKeyEncryptionSchemeInterface";
import {PublicKeyEncryptionSchemeId} from "./PublicKeyEncryptionSchemeId";

export class MlKemPublicKeyEncryptionScheme extends AbstractPublicKeyEncryptionScheme {
    getSchemeId(): PublicKeyEncryptionSchemeId {
        return PublicKeyEncryptionSchemeId.ML_KEM_768_AES_256_GCM;
    }

    getSupportedSeedLength(): number[] {
        return [32];
    }
}