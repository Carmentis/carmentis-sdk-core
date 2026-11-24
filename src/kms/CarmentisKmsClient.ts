import {KmsError} from "./KmsError";
import {KmsPlugin, KmsSignedRequest} from "./KmsTypes";
import {SignatureJwk} from "../crypto/signature/jwk/JwkSignatureAlgorithm";
import {KmsWalletClient} from "./KmsWalletClient";

export interface CarmentisKmsClientOptions {
    /** Base URL of the KMS, e.g. `https://kms.example.com`. */
    baseUrl: string;
    /** Request timeout in milliseconds (default 10000). */
    timeoutMs?: number;
    /** Custom fetch implementation (default: global fetch). */
    fetch?: typeof fetch;
}

export interface KmsRequestOptions {
    body?: unknown;
    headers?: Record<string, string>;
}

/**
 * HTTP client for the Carmentis KMS.
 *
 * It exposes the public endpoints directly (plugins, public keys, challenges, signed requests).
 * Authenticated usages are built on top of it:
 * - {@link KmsWalletAdmin}: wallet administration through requests signed by the admin key;
 * - {@link KmsWalletClient}: wallet usage (signing, certificates) with the wallet API key;
 * - {@link KmsManagementClient}: wallet management with a global API key or an administrator JWT.
 */
export class CarmentisKmsClient {
    private readonly baseUrl: string;
    private readonly timeoutMs: number;

    constructor(private readonly options: CarmentisKmsClientOptions) {
        this.baseUrl = options.baseUrl.replace(/\/+$/, "");
        this.timeoutMs = options.timeoutMs ?? 10000;
    }

    /** Client using a wallet through its wallet API key (`wlt_…`). */
    wallet(walletId: string, apiKey: string): KmsWalletClient {
        return new KmsWalletClient(this, walletId, apiKey);
    }

    // --- public endpoints ---

    listPlugins(): Promise<KmsPlugin[]> {
        return this.request("GET", "/api/plugins");
    }

    /** Single-use, short-lived nonce to embed in the next signed request. */
    async requestChallenge(): Promise<string> {
        const res = await this.request<{ challenge: string }>("POST", "/api/wallets/challenge");
        return res.challenge;
    }

    /** Public JWK of a wallet (no authentication). */
    getPublicJwk(walletId: string): Promise<SignatureJwk> {
        return this.request("GET", `/api/wallets/${enc(walletId)}/public-key?format=jwk`);
    }

    /** Public key of a wallet in the Carmentis encoding (no authentication). */
    async getPublicKey(walletId: string): Promise<string> {
        const res = await this.request<{ publicKey: string }>(
            "GET", `/api/wallets/${enc(walletId)}/public-key?format=carmentis`);
        return res.publicKey;
    }

    /**
     * Sends a request whose body was signed by an admin key. `signed.payload.method` and
     * `signed.payload.path` must match `method` and `path`.
     */
    sendSignedRequest<T>(method: string, path: string, signed: KmsSignedRequest): Promise<T> {
        return this.request(method, path, {body: signed});
    }

    // --- transport ---

    async request<T>(method: string, path: string, options: KmsRequestOptions = {}): Promise<T> {
        const {body} = options;
        const headers: Record<string, string> = {Accept: "application/json", ...options.headers};
        if (body !== undefined) headers["Content-Type"] = "application/json";

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        let res: Response;
        try {
            res = await (this.options.fetch ?? fetch)(this.baseUrl + path, {
                method,
                headers,
                body: body === undefined ? undefined : JSON.stringify(body),
                signal: controller.signal,
            });
        } finally {
            clearTimeout(timer);
        }

        const text = await res.text();
        let parsed: unknown = undefined;
        if (text.length > 0) {
            try { parsed = JSON.parse(text); } catch { parsed = text; }
        }
        if (!res.ok) throw new KmsError(res.status, parsed);
        return parsed as T;
    }
}

function enc(segment: string): string {
    return encodeURIComponent(segment);
}
