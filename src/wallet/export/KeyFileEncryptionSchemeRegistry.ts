import {KeyFileEncryptionScheme} from "./KeyFileEncryptionScheme";
import {Argon2idAes256GcmV1Scheme} from "./Argon2idAes256GcmV1Scheme";
import {WalletKeyFileError} from "../../errors/carmentis-error";

/**
 * Looks encryption schemes up by the identifier stored in key file headers. Keeping the older
 * schemes registered is what lets files written long ago remain readable once the default changes.
 */
export class KeyFileEncryptionSchemeRegistry {
    private readonly schemes = new Map<string, KeyFileEncryptionScheme<any>>();
    private defaultSchemeId: string;

    constructor(defaultScheme: KeyFileEncryptionScheme<any> = new Argon2idAes256GcmV1Scheme()) {
        this.schemes.set(defaultScheme.getSchemeId(), defaultScheme);
        this.defaultSchemeId = defaultScheme.getSchemeId();
    }

    static createDefault(): KeyFileEncryptionSchemeRegistry {
        return new KeyFileEncryptionSchemeRegistry();
    }

    register(scheme: KeyFileEncryptionScheme<any>, makeDefault = false): this {
        this.schemes.set(scheme.getSchemeId(), scheme);
        if (makeDefault) this.defaultSchemeId = scheme.getSchemeId();
        return this;
    }

    get(schemeId: string): KeyFileEncryptionScheme<any> {
        const scheme = this.schemes.get(schemeId);
        if (!scheme) throw new WalletKeyFileError(`unsupported encryption scheme '${schemeId}'`);
        return scheme;
    }

    getDefault(): KeyFileEncryptionScheme<any> {
        return this.get(this.defaultSchemeId);
    }
}
