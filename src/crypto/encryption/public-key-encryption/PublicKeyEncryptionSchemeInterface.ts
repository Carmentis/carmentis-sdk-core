import {PublicKeyEncryptionSchemeId} from "./PublicKeyEncryptionSchemeId";
import {EncoderFactory, EncoderInterface} from "../../../utils/encoder";

export interface PublicKeyEncryptionScheme {
    /**
     * Returns the identifier of the scheme.
     */
    getSchemeId(): PublicKeyEncryptionSchemeId;
}

export abstract class AbstractPublicKeyEncryptionScheme implements PublicKeyEncryptionScheme {
    /**
     * Returns the identifier of the scheme.
     */
    abstract getSchemeId(): PublicKeyEncryptionSchemeId;
}

export interface PublicEncryptionKey {
    getScheme(): PublicKeyEncryptionScheme;
    encrypt( message: Uint8Array ): Promise<Uint8Array>;
    getRawPublicKey(): Promise<Uint8Array>;
    encode(encoder?: EncoderInterface<Uint8Array, string>): Promise<string>;
}

export abstract class AbstractPublicEncryptionKey implements PublicEncryptionKey {
    abstract getScheme(): AbstractPublicKeyEncryptionScheme;
    abstract encrypt( message: Uint8Array ): Promise<Uint8Array>;
    abstract getRawPublicKey(): Promise<Uint8Array>;

    async encode(encoder: EncoderInterface<Uint8Array, string> = EncoderFactory.defaultBytesToStringEncoder()): Promise<string> {
        return encoder.encode(await this.getRawPublicKey());
    }

    getSchemeId() {
        return this.getScheme().getSchemeId();
    }
}

export interface PrivateDecryptionKey {
    getScheme(): AbstractPublicKeyEncryptionScheme;

    decrypt(ciphertext: Uint8Array): Promise<Uint8Array>;

    getRawPrivateKey(): Uint8Array;

    getPublicKey(): Promise<AbstractPublicEncryptionKey>;

    encode(encoder: EncoderInterface<Uint8Array, string>): string;

    /**
     * Returns the supported seed lengths for the scheme.
     * @returns {number[]} An array of supported seed lengths.
     */
    getSupportedSeedLength(): number[];
}

export abstract class AbstractPrivateDecryptionKey implements PrivateDecryptionKey {
    abstract getScheme(): AbstractPublicKeyEncryptionScheme;
    abstract decrypt(ciphertext: Uint8Array): Promise<Uint8Array>;
    abstract getRawPrivateKey(): Uint8Array;
    abstract getPublicKey(): Promise<AbstractPublicEncryptionKey>;
    encode(encoder: EncoderInterface<Uint8Array, string> = EncoderFactory.defaultBytesToStringEncoder()): string {
        return encoder.encode(this.getRawPrivateKey());
    }

    /**
     * Returns the supported seed lengths for the scheme.
     * @returns {number[]} An array of supported seed lengths.
     */
    abstract getSupportedSeedLength(): number[];
}
