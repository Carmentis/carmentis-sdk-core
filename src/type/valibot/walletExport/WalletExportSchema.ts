import * as v from "valibot";
import {uint8array} from "../primitives";

/** Version of the structure of the key file (envelope and payload). */
export const KEY_FILE_FORMAT_VERSION = 1;
export const KEY_FILE_MAGIC = "CMTS-KEYFILE";

export enum KeyType {
    SEED = "seed",
    JWK = "jwk",
}

export const JwkSchema = v.looseObject({kty: v.string()});

export const SeedKeySchema = v.object({
    keyType: v.literal(KeyType.SEED),
    schemeId: v.number(),
    seed: v.string(),
    passphrase: v.optional(v.string()),
});
export type SeedKey = v.InferOutput<typeof SeedKeySchema>;

export const JwkKeySchema = v.object({
    keyType: v.literal(KeyType.JWK),
    jwk: JwkSchema,
});
export type JwkKey = v.InferOutput<typeof JwkKeySchema>;

/** Extensible by adding a variant: the discriminator is `keyType`. */
export const ExportedKeySchema = v.variant("keyType", [SeedKeySchema, JwkKeySchema]);
export type ExportedKey = v.InferOutput<typeof ExportedKeySchema>;

export const ConnectivitySchema = v.object({
    networkName: v.string(),
    nodeEndpoint: v.string(),
    rpcEndpoint: v.string(),
});
export type Connectivity = v.InferOutput<typeof ConnectivitySchema>;

export const ExportedWalletSchema = v.object({
    name: v.pipe(v.string(), v.minLength(1)),
    createdAt: v.pipe(v.string(), v.isoTimestamp()),
    privateKey: ExportedKeySchema,
    actorPassphrase: v.string(),
    connectivity: v.optional(ConnectivitySchema),
});
export type ExportedWallet = v.InferOutput<typeof ExportedWalletSchema>;

/** The plaintext protected by the encryption of the key file. */
export const KeyFilePayloadSchema = v.looseObject({
    exportedAt: v.pipe(v.string(), v.isoTimestamp()),
    wallets: v.pipe(v.array(ExportedWalletSchema), v.minLength(1)),
});
export type KeyFilePayload = v.InferOutput<typeof KeyFilePayloadSchema>;

/**
 * The encryption block is validated by the scheme it designates (see `KeyFileEncryptionScheme`),
 * so that schemes registered at runtime can be read without touching this file.
 */
export const KeyFileEncryptionParamsSchema = v.looseObject({scheme: v.string()});

export const KeyFileEnvelopeV1Schema = v.object({
    magic: v.literal(KEY_FILE_MAGIC),
    formatVersion: v.literal(1),
    encryption: KeyFileEncryptionParamsSchema,
    ciphertext: uint8array(),
});

/** Extensible by adding a variant: the discriminator is `formatVersion`. */
export const KeyFileEnvelopeSchema = v.variant("formatVersion", [KeyFileEnvelopeV1Schema]);
export type KeyFileEnvelope = v.InferOutput<typeof KeyFileEnvelopeSchema>;

/** The part of the envelope authenticated as associated data. */
export type KeyFileHeader = Omit<KeyFileEnvelope, "ciphertext">;
