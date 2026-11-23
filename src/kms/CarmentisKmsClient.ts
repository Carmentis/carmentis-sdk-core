import {KmsError} from "./KmsError";
import {
    KmsAccessKey,
    KmsCertificateParams,
    KmsPublicKeyFormat,
    KmsSignJsonParams,
    KmsSignJsonResult,
    KmsKeyCapability,
    KmsLoginResult,
    KmsPlugin,
    KmsSignedChallenge,
    KmsSigningKey,
    KmsTokenProvider,
    KmsUserspace,
} from "./KmsTypes";
import {SignatureJwk} from "../crypto/signature/jwk/JwkSignatureAlgorithm";
import {base64ToBytes, bytesToBase64} from "./KmsBase64";

export interface CarmentisKmsClientOptions {
    /** Base URL of the KMS, e.g. `https://kms.example.com`. */
    baseUrl: string;
    /** Supplies the bearer JWT. Optional for the unauthenticated login endpoints. */
    tokenProvider?: KmsTokenProvider;
    /** Request timeout in milliseconds (default 10000). */
    timeoutMs?: number;
    /** Custom fetch implementation (default: global fetch). */
    fetch?: typeof fetch;
}

/**
 * Typed HTTP client for the Carmentis KMS (user-facing endpoints).
 *
 * When a request is rejected with 401, the token is invalidated and the request is
 * retried once with a fresh token.
 */
export class CarmentisKmsClient {
    private readonly baseUrl: string;
    private readonly timeoutMs: number;

    constructor(private readonly options: CarmentisKmsClientOptions) {
        this.baseUrl = options.baseUrl.replace(/\/+$/, "");
        this.timeoutMs = options.timeoutMs ?? 10000;
    }

    // --- authentication (no token required) ---

    async requestChallenge(): Promise<string> {
        const res = await this.request<{ challenge: string }>("POST", "/api/auth/user/challenge", undefined, false);
        return res.challenge;
    }

    async login(signed: KmsSignedChallenge): Promise<KmsLoginResult> {
        return this.request("POST", "/api/auth/user/login", signed, false);
    }

    // --- userspaces ---

    listMyUserspaces(): Promise<KmsUserspace[]> {
        return this.request("GET", "/api/me/userspaces");
    }

    /** Creates a userspace whose access key is the current session key (public mode only). */
    createPublicUserspace(params: { label?: string; metadata?: Record<string, unknown> } = {}): Promise<KmsUserspace> {
        return this.request("POST", "/api/public/userspaces", params);
    }

    getUserspace(userspaceId: string): Promise<KmsUserspace> {
        return this.request("GET", `/api/userspaces/${enc(userspaceId)}`);
    }

    updateUserspace(userspaceId: string, params: { label?: string; metadata?: Record<string, unknown> }): Promise<unknown> {
        return this.request("PATCH", `/api/userspaces/${enc(userspaceId)}`, params);
    }

    async deleteUserspace(userspaceId: string): Promise<void> {
        await this.request("DELETE", `/api/userspaces/${enc(userspaceId)}`);
    }

    addAccessKey(userspaceId: string, publicKey: string, label?: string): Promise<KmsAccessKey> {
        return this.request("POST", `/api/userspaces/${enc(userspaceId)}/access-keys`, {publicKey, label});
    }

    async removeAccessKey(userspaceId: string, accessKeyId: string): Promise<void> {
        await this.request("DELETE", `/api/userspaces/${enc(userspaceId)}/access-keys/${enc(accessKeyId)}`);
    }

    // --- plugins ---

    listPlugins(): Promise<KmsPlugin[]> {
        return this.request("GET", "/api/plugins");
    }

    // --- signing keys ---

    listKeys(userspaceId: string): Promise<KmsSigningKey[]> {
        return this.request("GET", `/api/userspaces/${enc(userspaceId)}/keys`);
    }

    createKey(
        userspaceId: string,
        params: { pluginId: string; label?: string; params?: Record<string, unknown> },
    ): Promise<KmsSigningKey> {
        return this.request("POST", `/api/userspaces/${enc(userspaceId)}/keys`, params);
    }

    async deleteKey(userspaceId: string, keyId: string): Promise<void> {
        await this.request("DELETE", `/api/userspaces/${enc(userspaceId)}/keys/${enc(keyId)}`);
    }

    async getKeyCapabilities(userspaceId: string, keyId: string): Promise<KmsKeyCapability[]> {
        const res = await this.request<{ capabilities: KmsKeyCapability[] }>(
            "GET", `/api/userspaces/${enc(userspaceId)}/keys/${enc(keyId)}/capabilities`);
        return res.capabilities;
    }

    getPublicJwk(userspaceId: string, keyId: string): Promise<SignatureJwk> {
        return this.request("GET", `/api/userspaces/${enc(userspaceId)}/keys/${enc(keyId)}/public-key?format=jwk`);
    }

    async getPublicKey(userspaceId: string, keyId: string, format: KmsPublicKeyFormat = "carmentis"): Promise<string> {
        const res = await this.request<{ publicKey: string }>(
            "GET", `/api/userspaces/${enc(userspaceId)}/keys/${enc(keyId)}/public-key?format=${format}`);
        return res.publicKey;
    }

    /** Signs `data` as-is with the server-held key (users only). */
    async signRaw(userspaceId: string, keyId: string, data: Uint8Array): Promise<Uint8Array> {
        const res = await this.request<{ signature: string }>(
            "POST", `/api/userspaces/${enc(userspaceId)}/keys/${enc(keyId)}/sign/raw`,
            {data: bytesToBase64(data)});
        return base64ToBytes(res.signature);
    }

    /** Signs a JSON payload with the server-held key (users only). */
    signJson(userspaceId: string, keyId: string, params: KmsSignJsonParams): Promise<KmsSignJsonResult> {
        return this.request("POST", `/api/userspaces/${enc(userspaceId)}/keys/${enc(keyId)}/sign/json`, params);
    }

    // --- certificates ---

    /** X.509 chain (PEM, leaf first) attached to the key. */
    async getCertificates(userspaceId: string, keyId: string): Promise<string[]> {
        const res = await this.request<{ chain: string[] }>(
            "GET", `/api/userspaces/${enc(userspaceId)}/keys/${enc(keyId)}/certificates`);
        return res.chain;
    }

    /** Obtains an X.509 chain (`fetch` from the key provider, or `self-signed`) and attaches it. */
    async createCertificates(
        userspaceId: string, keyId: string,
        mode: "fetch" | "self-signed", params?: KmsCertificateParams,
    ): Promise<string[]> {
        const res = await this.request<{ chain: string[] }>(
            "POST", `/api/userspaces/${enc(userspaceId)}/keys/${enc(keyId)}/certificates`, {mode, params});
        return res.chain;
    }

    /** Attaches an X.509 chain (PEM, leaf first) obtained elsewhere. */
    async importCertificates(userspaceId: string, keyId: string, chain: string[]): Promise<string[]> {
        const res = await this.request<{ chain: string[] }>(
            "PUT", `/api/userspaces/${enc(userspaceId)}/keys/${enc(keyId)}/certificates`, {chain});
        return res.chain;
    }

    /** PKCS#10 certificate signing request (PEM) signed by the key. */
    async createCsr(userspaceId: string, keyId: string, params: KmsCertificateParams): Promise<string> {
        const res = await this.request<{ csr: string }>(
            "POST", `/api/userspaces/${enc(userspaceId)}/keys/${enc(keyId)}/csr`, {params});
        return res.csr;
    }

    // --- transport ---

    private async request<T>(method: string, path: string, body?: unknown, auth = true, retry = true): Promise<T> {
        const headers: Record<string, string> = {Accept: "application/json"};
        if (body !== undefined) headers["Content-Type"] = "application/json";
        const tokenProvider = this.options.tokenProvider;
        if (auth) {
            if (!tokenProvider) throw new Error("This KMS endpoint requires a token provider");
            headers["Authorization"] = `Bearer ${await tokenProvider.getToken()}`;
        }

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

        if (res.status === 401 && auth && retry && tokenProvider) {
            tokenProvider.invalidate();
            return this.request(method, path, body, auth, false);
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
