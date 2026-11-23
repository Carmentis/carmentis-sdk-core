import {PrivateSignatureKey} from "../crypto/signature/PrivateSignatureKey";
import {JsonEncoder} from "../crypto/signature/signer/json/JsonEncoder";
import {JsonCanonicalizationMethod} from "../crypto/signature/signer/json/JsonCanonicalizationMethod";
import {CryptoEncoderFactory} from "../crypto/encoder/CryptoEncoderFactory";
import {CarmentisKmsClient} from "./CarmentisKmsClient";
import {KmsTokenProvider} from "./KmsTypes";
import {bytesToBase64} from "./KmsBase64";

export interface KmsSessionOptions {
    /** Base URL of the KMS. */
    baseUrl: string;
    /** The user's own key: it identifies the user and is the userspace access key. */
    accessKey: PrivateSignatureKey;
    /** Renew the token this many seconds before it expires (default 30). */
    refreshMarginSeconds?: number;
    fetch?: typeof fetch;
    /** Clock, in milliseconds (default Date.now). */
    now?: () => number;
}

/**
 * Authenticates against the KMS by signing a challenge with the access key, and keeps
 * the resulting JWT fresh. Concurrent callers share a single login.
 */
export class KmsSession implements KmsTokenProvider {
    private token?: string;
    private expiresAt = 0;
    private pending?: Promise<string>;
    private readonly authClient: CarmentisKmsClient;

    constructor(private readonly options: KmsSessionOptions) {
        this.authClient = new CarmentisKmsClient({baseUrl: options.baseUrl, fetch: options.fetch});
    }

    /** Builds a client whose requests are authenticated by this session. */
    createClient(): CarmentisKmsClient {
        return new CarmentisKmsClient({baseUrl: this.options.baseUrl, tokenProvider: this, fetch: this.options.fetch});
    }

    async getToken(): Promise<string> {
        const now = (this.options.now ?? Date.now)();
        if (this.token && now < this.expiresAt) return this.token;
        this.pending ??= this.login().finally(() => { this.pending = undefined; });
        return this.pending;
    }

    invalidate(): void {
        this.token = undefined;
        this.expiresAt = 0;
    }

    private async login(): Promise<string> {
        const challenge = await this.authClient.requestChallenge();
        const payload = {challenge};
        const message = JsonEncoder.encode(payload, JsonCanonicalizationMethod.JSON_CANONICAL);
        const signature = await this.options.accessKey.sign(message);
        const publicKey = await CryptoEncoderFactory.defaultStringSignatureEncoder()
            .encodePublicKey(await this.options.accessKey.getPublicKey());
        const result = await this.authClient.login({
            challenge,
            publicKey,
            signature: bytesToBase64(signature),
            payload,
        });
        const margin = this.options.refreshMarginSeconds ?? 30;
        this.token = result.token;
        this.expiresAt = (this.options.now ?? Date.now)() + Math.max(0, result.expiresIn - margin) * 1000;
        return result.token;
    }
}
