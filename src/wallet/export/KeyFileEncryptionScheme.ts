import * as v from "valibot";

/**
 * An encryption method for key files: how a password is turned into a key and how that key
 * protects the payload. Each scheme owns the schema of the parameters it stores in the file
 * header, and is designated by the `scheme` member of those parameters.
 */
export interface KeyFileEncryptionScheme<P extends { scheme: string } = { scheme: string }> {
    getSchemeId(): string;

    getParamsSchema(): v.BaseSchema<unknown, P, v.BaseIssue<unknown>>;

    /** Creates fresh parameters (salt, cost...) for a new encryption. */
    generateParams(): P;

    /**
     * @param aad - The serialized header, authenticated together with the ciphertext.
     * @return The ciphertext, including whatever the scheme needs besides the parameters (e.g. the IV).
     */
    encrypt(params: P, plaintext: Uint8Array, password: string, aad: Uint8Array): Promise<Uint8Array>;

    /** @throws DecryptionError if the password is wrong or the data has been altered. */
    decrypt(params: P, ciphertext: Uint8Array, password: string, aad: Uint8Array): Promise<Uint8Array>;
}
