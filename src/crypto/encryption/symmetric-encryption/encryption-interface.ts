import {gcm} from "@noble/ciphers/aes";
import {CarmentisError, DecryptionError} from "../../../errors/carmentis-error";


export interface SymmetricEncryptionKeyScheme {
    getSymmetricEncryptionSchemeId(): number;
    getSupportedKeyLengths(): number[];
    getDefaultKeyLength(): number;
}

/**
 * Represents a symmetric encryption key capable of performing encryption and decryption
 * operations, as well as providing the associated encryption algorithm identifier and raw key.
 */
export interface SymmetricEncryptionKey  {
    /**
     * Retrieves the unique identifier of the encryption algorithm being used.
     *
     * @return {number} The unique algorithm identifier as a numeric value.
     */
    getSymmetricEncryptionSchemeId(): number;

    /**
     * Encrypts the given plaintext using a predefined encryption algorithm.
     *
     * @param {Uint8Array} plaintext - The plaintext data to be encrypted.
     * @return {Promise<Uint8Array>} The encrypted data as a Uint8Array.
     */
    encrypt(plaintext: Uint8Array): Promise<Uint8Array>;
    /**
     * Decrypts the given ciphertext and returns the resulting plaintext.
     *
     * @param {Uint8Array} ciphertext - The encrypted data to be decrypted.
     * @return {Promise<Uint8Array>} The decrypted plaintext as a Uint8Array.
     */
    decrypt(ciphertext: Uint8Array): Promise<Uint8Array>;
    /**
     * Retrieves the raw secret key as a Uint8Array.
     *
     * @return {Uint8Array} The raw secret key in binary format.
     */
    getRawSecretKey(): Uint8Array;
}


/**
 * Enumeration representing identifiers for symmetric encryption algorithms.
 *
 * This enum is used to specify the symmetric encryption algorithm to be utilized,
 * enabling cryptographic operations such as encryption and decryption with specific
 * algorithmic requirements. It currently supports the following algorithm:
 *
 * - AES-256-GCM: Advanced Encryption Standard with a 256-bit key in Galois/Counter Mode.
 *
 * The identifiers in this enum can be utilized to indicate the intended algorithm
 * within encryption workflows or cryptographic libraries requiring algorithm specification.
 */
export enum SymmetricEncryptionSchemeId {
    AES_256_GCM,
}

export class AES256GCMSymmetricEncryptionScheme implements SymmetricEncryptionKeyScheme {
    private static KEY_LENGTH_IN_BYTES = 32;

    getSymmetricEncryptionSchemeId(): number {
        return SymmetricEncryptionSchemeId.AES_256_GCM;
    }

    getSupportedKeyLengths(): number[] {
        return [AES256GCMSymmetricEncryptionScheme.KEY_LENGTH_IN_BYTES];
    }

    getDefaultKeyLength(): number {
        return AES256GCMSymmetricEncryptionScheme.KEY_LENGTH_IN_BYTES;
    }
}

/**
 * This class provides methods for creating, managing, and utilizing a symmetric encryption key specifically
 * designed for AES-256-GCM encryption. It implements the `SymmetricEncryptionKey` interface, enabling compatibility
 * with other cryptographic operations requiring symmetric key encryption.
 *
 * AES-256-GCM (Advanced Encryption Standard with 256-bit keys in Galois/Counter Mode) ensures high-level cryptographic
 * security with authenticated encryption, combining data confidentiality with integrity protection.
 */
export class AES256GCMSymmetricEncryptionKey implements SymmetricEncryptionKey {
    constructor(private key: Uint8Array) {}

    /**
     * Generates a new AES-256-GCM symmetric encryption key.
     *
     * @return {AES256GCMSymmetricEncryptionKey} An instance of AES256GCMSymmetricEncryptionKey containing a randomly generated 256-bit encryption key.
     */
    public static async generate(): Promise<AES256GCMSymmetricEncryptionKey> {
        const key = new Uint8Array(32);
        crypto.getRandomValues(key);
        return new AES256GCMSymmetricEncryptionKey(key);
    }

    /**
     * Creates an instance of AES256GCMSymmetricEncryptionKey from the given byte array.
     *
     * @param {Uint8Array} keyBytes - The byte array representing the encryption key.
     * @return {AES256GCMSymmetricEncryptionKey} A new instance of AES256GCMSymmetricEncryptionKey initialized with the provided key bytes.
     */
    public static createFromBytes(keyBytes: Uint8Array): AES256GCMSymmetricEncryptionKey {
        return new AES256GCMSymmetricEncryptionKey(keyBytes);
    }

    /**
     * Retrieves the raw secret key as a Uint8Array.
     * This method provides access to the underlying key data stored in this instance.
     *
     * @return {Uint8Array} The raw secret key.
     */
    getRawSecretKey(): Uint8Array {
        return this.key;
    }

    /**
     * Retrieves the identifier of the encryption algorithm being used.
     *
     * @return {number} The numerical ID corresponding to the encryption algorithm.
     */
    getSymmetricEncryptionSchemeId(): number {
        return SymmetricEncryptionSchemeId.AES_256_GCM;
    }

    /**
     * Encrypts the given plaintext using AES-GCM encryption.
     * A random initialization vector (IV) is generated for each encryption operation.
     * The result is a concatenation of the IV and the encrypted ciphertext.
     *
     * @param {Uint8Array} plaintext - The plaintext data to be encrypted.
     * @return {Uint8Array} A Uint8Array containing the IV followed by the encrypted ciphertext.
     */
    async encrypt(plaintext: Uint8Array): Promise<Uint8Array> {
        const iv = new Uint8Array(12);
        crypto.getRandomValues(iv);
        const stream = gcm(this.key, iv);
        const encrypted = stream.encrypt(plaintext);
        const result = new Uint8Array(iv.length + encrypted.length);
        result.set(iv);
        result.set(encrypted, iv.length);
        return result;
    }

    /**
     * Decrypts the provided ciphertext using the GCM block cipher mode with the instance's key.
     *
     * @param {Uint8Array} ciphertext - The encrypted data to be decrypted. The first 12 bytes are assumed to be the initialization vector (IV), and the rest is the encrypted content.
     * @return {Uint8Array} The decrypted plaintext as a Uint8Array.
     */
    async decrypt(ciphertext: Uint8Array): Promise<Uint8Array> {
        try {
            const iv = ciphertext.slice(0, 12);
            const encrypted = ciphertext.slice(12);
            const stream = gcm(this.key, iv);
            return stream.decrypt(encrypted);
        } catch (e) {
            if (CarmentisError.isCarmentisError(e)) {
                throw new DecryptionError();
            } else {
                throw e;
            }
        }
    }
}


/**
 * A class that extends the functionality of a symmetric encryption key.
 * This class enables encryption and decryption of strings,
 * while delegating the underlying encryption and decryption operations to a wrapped key.
 */
export class ExtendedSymmetricEncryptionKey implements SymmetricEncryptionKey {
    constructor(private wrappedKey: SymmetricEncryptionKey) {
    }

    /**
     * Encrypts a given plaintext string and returns the encrypted data as a Base64-encoded string.
     *
     * @param {string} plaintext - The plain text string to be encrypted.
     * @return {string} The Base64-encoded string representation of the encrypted data.
     */
    public async encryptString(plaintext: string): Promise<string> {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(plaintext);
        const encrypted = await this.encrypt(bytes);
        return Buffer.from(encrypted).toString('base64');
    }

    /**
     * Decrypts a given string that is encoded in Base64 format.
     *
     * @param ciphertext The Base64 encoded string to be decrypted.
     * @return The decrypted string.
     */
    public async decryptString(ciphertext: string): Promise<string> {
        const encrypted = Buffer.from(ciphertext, 'base64');
        const decrypted = await this.decrypt(encrypted);
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    }

    /**
     * Retrieves the identifier of the encryption algorithm used.
     *
     * @return {number} The identifier of the encryption algorithm.
     */
    getSymmetricEncryptionSchemeId(): number {
        return this.wrappedKey.getSymmetricEncryptionSchemeId();
    }

    /**
     * Encrypts the given plaintext using the wrapped key.
     *
     * @param {Uint8Array} plaintext - The data to be encrypted.
     * @return {Uint8Array} The encrypted ciphertext as a Uint8Array.
     */
    async encrypt(plaintext: Uint8Array): Promise<Uint8Array> {
        return this.wrappedKey.encrypt(plaintext);
    }

    /**
     * Decrypts the provided ciphertext using the wrapped key.
     *
     * @param {Uint8Array} ciphertext - The ciphertext to be decrypted.
     * @return {Uint8Array} The decrypted plaintext as a Uint8Array.
     */
    async decrypt(ciphertext: Uint8Array): Promise<Uint8Array> {
        return this.wrappedKey.decrypt(ciphertext);
    }

    /**
     * Retrieves the raw secret key from the wrapped key.
     *
     * @return {Uint8Array} The raw secret key as a Uint8Array.
     */
    getRawSecretKey(): Uint8Array {
        return this.wrappedKey.getRawSecretKey();
    }
}

export interface DecapsulationKey  {
    decapsulate(ct: string): SymmetricEncryptionKey;
    getEncapsulationKey(): EncapsulationKey;
}

export interface EncapsulationKey  {
    encapsulate(): { key: SymmetricEncryptionKey, ct: string };
}

export interface EncapsulationKeyEncoder<T> {
    encode( key: T ): string;
    decode( key: string ): T;
}

export enum KeyExchangeSchemeId {
    ML_KEM,
}
