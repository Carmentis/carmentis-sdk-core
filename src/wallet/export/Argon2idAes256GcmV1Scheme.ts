import * as v from "valibot";
import {KeyFileEncryptionScheme} from "./KeyFileEncryptionScheme";
import {Argon2id, Argon2idParams, DEFAULT_ARGON2ID_PARAMS} from "../../crypto/kdf/Argon2id";
import {AES256GCMSymmetricEncryptionKey} from "../../crypto/encryption/symmetric-encryption/encryption-interface";
import {Random} from "../../crypto/random";
import {DecryptionError, IllegalParameterError} from "../../errors/carmentis-error";
import {uint8array} from "../../type/valibot/primitives";

export const ARGON2ID_AES256GCM_V1 = "argon2id-aes256gcm-v1";

const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

// Bounds accepted when reading a file, so that a hostile header cannot force an absurd cost.
export const Argon2idAes256GcmV1ParamsSchema = v.object({
    scheme: v.literal(ARGON2ID_AES256GCM_V1),
    kdf: v.pipe(
        v.object({
            salt: v.pipe(
                uint8array(),
                v.check(salt => salt.length >= SALT_LENGTH && salt.length <= 64, "salt must hold 16 to 64 bytes"),
            ),
            t: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(10)),
            m: v.pipe(v.number(), v.integer(), v.minValue(8), v.maxValue(1024 * 1024)),
            p: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(16)),
        }),
        v.check(kdf => kdf.m >= 8 * kdf.p, "m must be at least 8 * p"),
    ),
});
export type Argon2idAes256GcmV1Params = v.InferOutput<typeof Argon2idAes256GcmV1ParamsSchema>;

/**
 * Argon2id derives a 256-bit key from the password; AES-256-GCM protects the payload, with
 * the header authenticated as associated data. The IV is prepended to the ciphertext.
 */
export class Argon2idAes256GcmV1Scheme implements KeyFileEncryptionScheme<Argon2idAes256GcmV1Params> {
    constructor(private readonly cost: Argon2idParams = DEFAULT_ARGON2ID_PARAMS) {}

    getSchemeId(): string {
        return ARGON2ID_AES256GCM_V1;
    }

    getParamsSchema() {
        return Argon2idAes256GcmV1ParamsSchema;
    }

    generateParams(): Argon2idAes256GcmV1Params {
        return {
            scheme: ARGON2ID_AES256GCM_V1,
            kdf: {salt: Random.getBytes(SALT_LENGTH), ...this.cost},
        };
    }

    async encrypt(params: Argon2idAes256GcmV1Params, plaintext: Uint8Array, password: string, aad: Uint8Array) {
        const rawKey = this.deriveKey(params, password);
        try {
            return await AES256GCMSymmetricEncryptionKey.createFromBytes(rawKey).encrypt(plaintext, aad);
        } finally {
            rawKey.fill(0);
        }
    }

    async decrypt(params: Argon2idAes256GcmV1Params, ciphertext: Uint8Array, password: string, aad: Uint8Array) {
        const rawKey = this.deriveKey(params, password);
        try {
            return await AES256GCMSymmetricEncryptionKey.createFromBytes(rawKey).decrypt(ciphertext, aad);
        } catch {
            // Do not tell a wrong password apart from an altered file.
            throw new DecryptionError("Cannot decrypt the key file: wrong password or corrupted file");
        } finally {
            rawKey.fill(0);
        }
    }

    private deriveKey({kdf}: Argon2idAes256GcmV1Params, password: string): Uint8Array {
        if (typeof password !== "string" || password.length === 0) {
            throw new IllegalParameterError("The key file password must be a non-empty string");
        }
        return new Argon2id({t: kdf.t, m: kdf.m, p: kdf.p}).deriveKey(password.normalize("NFKC"), kdf.salt, KEY_LENGTH);
    }
}
