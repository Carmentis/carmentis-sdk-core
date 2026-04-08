import {AbstractPrivateDecryptionKey} from "./PublicKeyEncryptionSchemeInterface";
import {ml_kem768} from "@noble/post-quantum/ml-kem";
import {randomBytes} from "@noble/post-quantum/utils";
import {AES256GCMSymmetricEncryptionKey} from "../symmetric-encryption/encryption-interface";
import {MlKemPublicEncryptionKey} from "./MlKemPublicEncryptionKey";
import {MlKemPublicKeyEncryptionScheme} from "./MlKemPublicKeyEncryptionScheme";
import {MlKemCiphertextEncoder} from "./MlKemCiphertextEncoder";
import {CarmentisError, DecryptionError} from "../../../errors/carmentis-error";

export class MlKemPrivateDecryptionKey extends AbstractPrivateDecryptionKey {
    /**
     * Generates a private decryption key from a seed.
     * @param seed
     */
    static async genFromSeed(seed: Uint8Array) {
        if (seed.length !== 64) {
            throw new Error(`Seed must be 64 bytes long: got length: ${seed?.length} bytes`);
        }
        return new MlKemPrivateDecryptionKey(seed);
    }

    /**
     * Generates a random private decryption key.
     */
    static async gen() {
        const random = randomBytes(64);
        return new MlKemPrivateDecryptionKey(random);
    }

    private readonly privateKey: Uint8Array;
    private readonly publicKey: Uint8Array;

    private constructor(private readonly seed: Uint8Array) {
        super()
        const {secretKey, publicKey} = ml_kem768.keygen(seed);
        this.privateKey = secretKey;
        this.publicKey = publicKey;
    }

    getSupportedSeedLength(): number[] {
        return [64]
    }

    getScheme(): MlKemPublicKeyEncryptionScheme {
        return new MlKemPublicKeyEncryptionScheme();
    }

    async getPublicKey(): Promise<MlKemPublicEncryptionKey> {
        return new MlKemPublicEncryptionKey(this.publicKey);
    }

    getRawPrivateKey(): Uint8Array {
        return this.privateKey;
    }

    async decrypt(ciphertext: Uint8Array): Promise<Uint8Array> {
        try {
            const encoder = new MlKemCiphertextEncoder();
            const {
                encryptedMessage,
                encryptedSharedSecret
            } = encoder.decode(ciphertext);
            const sharedSecret = ml_kem768.decapsulate(encryptedSharedSecret, this.privateKey);
            const cipher = AES256GCMSymmetricEncryptionKey.createFromBytes(sharedSecret);
            const plaintext = cipher.decrypt(encryptedMessage);
            return plaintext;
        } catch (e) {
            if (CarmentisError.isCarmentisError(e)) {
                throw new DecryptionError();
            } else {
                throw e;
            }
        }
    }
}
