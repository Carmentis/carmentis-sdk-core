import {
    AES256GCMSymmetricEncryptionKey,
    AES256GCMSymmetricEncryptionScheme,
    DecapsulationKey,
    SymmetricEncryptionKey,
    SymmetricEncryptionKeyScheme,
    SymmetricEncryptionSchemeId,
} from "./encryption/symmetric-encryption/encryption-interface";
import {MLDSA65PrivateSignatureKey, MLDSA65PublicSignatureKey, MLDSA65SignatureScheme} from "./signature/ml-dsa-65";
import {CryptographicHash, CryptographicHashSchemeId, Sha256CryptographicHash} from "./hash/hash-interface";

import {PBKDF2} from "./kdf/PBKDF2";
import {PasswordBasedKeyDerivationFunction} from "./kdf/PasswordBasedKeyDerivationFunction";
import {KeyDerivationFunction} from "./kdf/KeyDerivationFunction";
import {HKDF} from "./kdf/HKDF";
import {PasswordBasedKeyDerivationFunctionSchemeId} from "./kdf/PasswordBasedKeyDerivationFunctionSchemeId";
import {
    AbstractPrivateDecryptionKey,
    AbstractPublicEncryptionKey
} from "./encryption/public-key-encryption/PublicKeyEncryptionSchemeInterface";
import {PublicKeyEncryptionSchemeId} from "./encryption/public-key-encryption/PublicKeyEncryptionSchemeId";
import {MlKemPublicEncryptionKey} from "./encryption/public-key-encryption/MlKemPublicEncryptionKey";
import {MlKemPrivateDecryptionKey} from "./encryption/public-key-encryption/MlKemPrivateDecryptionKey";
import {PublicSignatureKey} from "./signature/PublicSignatureKey";
import {SignatureScheme} from "./signature/SignatureScheme";
import {PrivateSignatureKey} from "./signature/PrivateSignatureKey";
import {SignatureSchemeId} from "./signature/SignatureSchemeId";
import {Secp256k1SignatureScheme} from "./signature/secp256k1/Secp256k1SignatureScheme";
import {Secp256k1PublicSignatureKey} from "./signature/secp256k1/Secp256k1PublicSignatureKey";
import {Secp256k1PrivateSignatureKey} from "./signature/secp256k1/Secp256k1PrivateSignatureKey";

export class CryptoSchemeFactory {
    static createPrivateSignatureKey( schemeId: number, seed: Uint8Array ): PrivateSignatureKey {
        switch (schemeId) {
            case SignatureSchemeId.SECP256K1: return new Secp256k1PrivateSignatureKey(seed);
            case SignatureSchemeId.ML_DSA_65: return new MLDSA65PrivateSignatureKey(seed);
            default: throw `Not supported signature scheme ID: ${schemeId}`
        }
    }

    static createVirtualBlockchainPrivateSignature( kdf: KeyDerivationFunction, schemeId: SignatureSchemeId, walletSeed: Uint8Array , vbSeed: Uint8Array ): PrivateSignatureKey {
        const actorSeed = new Uint8Array([...walletSeed, ...vbSeed])
        const encoder = new TextEncoder();
        const seed = kdf.deriveKeyNoSalt(actorSeed, encoder.encode("VB_ACTOR_KEY"), 32);

        switch (schemeId) {
            case SignatureSchemeId.ML_DSA_65: return new MLDSA65PrivateSignatureKey(seed);
            case SignatureSchemeId.SECP256K1: return Secp256k1PrivateSignatureKey.genFromSeed(seed);
            default: throw `Not supported signature scheme ID: ${schemeId}`
        }
    }

    /**
     * Derives a symmetric encryption key from the provided password using the specified key derivation and encryption algorithms.
     *
     * @param {string} password - The password from which the encryption key will be derived.
     * @param {PasswordBasedKeyDerivationFunctionSchemeId} [pbkdfSchemeId=PasswordBasedKeyDerivationFunctionSchemeId.PBKDF2] - The ID of the password-based key derivation function algorithm to use.
     * @param {SymmetricEncryptionSchemeId} [symmetricEncryptionSchemeId=SymmetricEncryptionSchemeId.AES_256_GCM] - The ID of the symmetric encryption algorithm to create the key for.
     * @return {SymmetricEncryptionKey} A symmetric encryption key derived from the password using the specified algorithms.
     */
    static deriveKeyFromPassword(
        password: string,
        pbkdfSchemeId: PasswordBasedKeyDerivationFunctionSchemeId = PasswordBasedKeyDerivationFunctionSchemeId.PBKDF2,
        symmetricEncryptionSchemeId: SymmetricEncryptionSchemeId = SymmetricEncryptionSchemeId.AES_256_GCM,
    ): SymmetricEncryptionKey {
        const symmetricEncryptionScheme = CryptoSchemeFactory.createSymmetricEncryptionKeyScheme(symmetricEncryptionSchemeId);
        const keyLength = symmetricEncryptionScheme.getDefaultKeyLength();
        const pbkdf = CryptoSchemeFactory.createDefaultPBKDF();
        const rawKey = pbkdf.deriveKeyNoSalt(password, keyLength);
        return CryptoSchemeFactory.createSymmetricEncryptionKey(symmetricEncryptionSchemeId, rawKey);
    }


    createDecapsulationKey( schemeId: number, walletSeed: Uint8Array  ): DecapsulationKey {
        switch (schemeId) {
            default: throw `Not supported encryption scheme ID: ${schemeId}`
        }
    }

    createVirtualBlockchainDecapsulationKey( schemeId: number, walletSeed: Uint8Array, vbSeed: Uint8Array ): DecapsulationKey {
        switch (schemeId) {
            default: throw `Not supported encryption scheme ID: ${schemeId}`
        }
    }

    async createPublicSignatureKey( schemeId: number, publicKey: Uint8Array ): Promise<PublicSignatureKey> {
       return CryptoSchemeFactory.createPublicSignatureKey(schemeId, publicKey);
    }

    static async createPublicSignatureKey( schemeId: number, publicKey: Uint8Array ): Promise<PublicSignatureKey> {
        switch (schemeId) {
            case SignatureSchemeId.SECP256K1: return new Secp256k1PublicSignatureKey(publicKey);
            case SignatureSchemeId.ML_DSA_65: return new MLDSA65PublicSignatureKey(publicKey);
            default: throw new Error(`Not supported signature scheme ID: ${schemeId}`)
        }
    }

    static async createPublicEncryptionKey( schemeId: number, publicKey: Uint8Array ): Promise<AbstractPublicEncryptionKey> {
        switch (schemeId) {
            case PublicKeyEncryptionSchemeId.ML_KEM_768_AES_256_GCM: return new MlKemPublicEncryptionKey(publicKey)
            default: throw Error(`Not supported scheme ID: ${schemeId}`)
        }
    }

    static async createPrivateDecryptionKey(schemeId: number, privateKeyOrSeed: Uint8Array): Promise<AbstractPrivateDecryptionKey> {
        switch (schemeId) {
            case PublicKeyEncryptionSchemeId.ML_KEM_768_AES_256_GCM: return await MlKemPrivateDecryptionKey.genFromSeed(privateKeyOrSeed)
            default: throw Error(`Not supported scheme ID: ${schemeId}`)
        }
    }

    /**
     * Creates a symmetric encryption key based on the provided encryption scheme ID and raw key data.
     *
     * @param {number} symmetricEncryptionSchemeId - The ID of the symmetric encryption scheme to use.
     * @param {Uint8Array<ArrayBufferLike>} rawKey - The raw key data used to create the symmetric encryption key.
     * @return {SymmetricEncryptionKey} The generated symmetric encryption key.
     */
    createSymmetricEncryptionKey(symmetricEncryptionSchemeId: number, rawKey: Uint8Array<ArrayBufferLike>): SymmetricEncryptionKey {
        return CryptoSchemeFactory.createSymmetricEncryptionKey(symmetricEncryptionSchemeId, rawKey);
    }

    static createSymmetricEncryptionKey(symmetricEncryptionSchemeId: number, rawKey: Uint8Array<ArrayBufferLike>): SymmetricEncryptionKey {
        switch (symmetricEncryptionSchemeId) {
            case SymmetricEncryptionSchemeId.AES_256_GCM:
                return AES256GCMSymmetricEncryptionKey.createFromBytes(rawKey);
            default:
                throw `Not supported encryption scheme ID: ${symmetricEncryptionSchemeId}`
        }
    }

    static createSymmetricEncryptionKeyScheme(symmetricEncryptionSchemeId: number): SymmetricEncryptionKeyScheme {
        switch (symmetricEncryptionSchemeId) {
            case SymmetricEncryptionSchemeId.AES_256_GCM: return new AES256GCMSymmetricEncryptionScheme();
            default: throw `Not supported encryption scheme ID: ${symmetricEncryptionSchemeId}`
        }
    }

    static createCryptographicHash(schemeId: CryptographicHashSchemeId): CryptographicHash {
        switch (schemeId) {
            case CryptographicHashSchemeId.SHA256: return new Sha256CryptographicHash();
            default: throw `Not supported hash scheme ID: ${schemeId}`
        }
    }


    static createDefaultCryptographicHash(): CryptographicHash {
        return new Sha256CryptographicHash()
    }

    static createDefaultPBKDF(): PasswordBasedKeyDerivationFunction {
        return new PBKDF2();
    }

    static createDefaultKDF() {
        return new HKDF();
    }

    static createSignatureScheme(schemeId: SignatureSchemeId): SignatureScheme {
        switch (schemeId) {
            case SignatureSchemeId.SECP256K1: return new Secp256k1SignatureScheme();
            case SignatureSchemeId.ML_DSA_65: return new MLDSA65SignatureScheme();
            default: throw new Error(`Not supported signature scheme ID: ${schemeId}`)
        }
    }
}