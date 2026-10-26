import {KeyFileCodec} from "./KeyFileCodec";
import {KeyFileEncryptionSchemeRegistry} from "./KeyFileEncryptionSchemeRegistry";
import {WalletKeyFileBuilder} from "./WalletKeyFileBuilder";
import {
    KEY_FILE_FORMAT_VERSION,
    KEY_FILE_MAGIC,
    KeyFileHeader,
    KeyFilePayload,
} from "../../type/valibot/walletExport/WalletExportSchema";
import {WalletKeyFileError} from "../../errors/carmentis-error";
import * as v from "valibot";

export interface WalletKeyFileExportOptions {
    /** Identifier of the encryption scheme; the registry default when omitted. */
    schemeId?: string;
}

/**
 * Exports wallets to a password-protected file, and reads them back.
 *
 * The file is a CBOR envelope — format version and encryption parameters in clear — around
 * the encrypted CBOR payload. The envelope header is authenticated with the payload, so the
 * version, scheme or cost parameters cannot be altered without detection.
 */
export class WalletKeyFileService {
    constructor(
        private readonly registry: KeyFileEncryptionSchemeRegistry = KeyFileEncryptionSchemeRegistry.createDefault(),
        private readonly codec: KeyFileCodec = new KeyFileCodec(),
    ) {}

    async export(
        source: KeyFilePayload | WalletKeyFileBuilder,
        password: string,
        options: WalletKeyFileExportOptions = {},
    ): Promise<Uint8Array> {
        const payload = source instanceof WalletKeyFileBuilder ? source.build() : source;
        const scheme = options.schemeId ? this.registry.get(options.schemeId) : this.registry.getDefault();

        const plaintext = this.codec.encodePayload(payload);
        try {
            const params = scheme.generateParams();
            const header: KeyFileHeader = {magic: KEY_FILE_MAGIC, formatVersion: KEY_FILE_FORMAT_VERSION, encryption: params};
            const ciphertext = await scheme.encrypt(params, plaintext, password, this.codec.buildAad(header));
            return this.codec.encodeEnvelope({...header, ciphertext});
        } finally {
            plaintext.fill(0);
        }
    }

    async import(bytes: Uint8Array, password: string): Promise<KeyFilePayload> {
        const envelope = this.codec.decodeEnvelope(bytes);
        const scheme = this.registry.get(envelope.encryption.scheme);

        const params = v.safeParse(scheme.getParamsSchema(), envelope.encryption);
        if (!params.success) throw new WalletKeyFileError("invalid encryption parameters");

        // The raw header is authenticated, not the parsed one, which may have dropped members.
        const {ciphertext, ...header} = envelope;
        const plaintext = await scheme.decrypt(params.output, ciphertext, password, this.codec.buildAad(header));
        try {
            return this.codec.decodePayload(plaintext);
        } finally {
            plaintext.fill(0);
        }
    }

    async exportToBase64(source: KeyFilePayload | WalletKeyFileBuilder, password: string, options?: WalletKeyFileExportOptions): Promise<string> {
        return this.codec.toBase64(await this.export(source, password, options));
    }

    async importFromBase64(text: string, password: string): Promise<KeyFilePayload> {
        return this.import(this.codec.fromBase64(text), password);
    }
}
