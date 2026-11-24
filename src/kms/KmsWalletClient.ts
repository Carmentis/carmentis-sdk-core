import type {CarmentisKmsClient} from "./CarmentisKmsClient";
import {
    KmsCapability,
    KmsCertificateParams,
    KmsSignJsonParams,
    KmsSignJsonResult,
    KmsWallet,
} from "./KmsTypes";
import {SignatureJwk} from "../crypto/signature/jwk/JwkSignatureAlgorithm";
import {base64ToBytes, bytesToBase64} from "./KmsBase64";
import {KmsPrivateSignatureKey} from "./KmsPrivateSignatureKey";

/**
 * Uses one wallet through its wallet API key (`wlt_…`): signatures, certificates, CSR.
 *
 * A wallet API key only reaches its own wallet: any other wallet answers 404, like an unknown one.
 */
export class KmsWalletClient {
    private readonly base: string;

    constructor(
        private readonly client: CarmentisKmsClient,
        readonly walletId: string,
        private readonly apiKey: string,
    ) {
        this.base = `/api/wallets/${encodeURIComponent(walletId)}`;
    }

    getWallet(): Promise<KmsWallet> {
        return this.call("GET", "");
    }

    async getCapabilities(): Promise<KmsCapability[]> {
        const res = await this.call<{ capabilities: KmsCapability[] }>("GET", "/capabilities");
        return res.capabilities;
    }

    /** Public JWK of the wallet (public endpoint, the API key is not sent). */
    getPublicJwk(): Promise<SignatureJwk> {
        return this.client.getPublicJwk(this.walletId);
    }

    /** Public key of the wallet in the Carmentis encoding (public endpoint). */
    getPublicKey(): Promise<string> {
        return this.client.getPublicKey(this.walletId);
    }

    /** The wallet key as a {@link KmsPrivateSignatureKey}, whose `sign()` is delegated to the KMS. */
    getSignatureKey(publicJwk?: SignatureJwk): Promise<KmsPrivateSignatureKey> {
        return KmsPrivateSignatureKey.fromWallet(this, publicJwk);
    }

    /** Signs `data` as-is with the wallet key. ECDSA signatures are `r||s` (IEEE P1363). */
    async signRaw(data: Uint8Array): Promise<Uint8Array> {
        const res = await this.call<{ signature: string }>("POST", "/sign/raw", {data: bytesToBase64(data)});
        return base64ToBytes(res.signature);
    }

    /** Signs a JSON payload; the result is verifiable with `JsonSignatureVerifier` and the wallet's public JWK. */
    signJson(params: KmsSignJsonParams): Promise<KmsSignJsonResult> {
        return this.call("POST", "/sign/json", params);
    }

    /** X.509 chain (PEM, leaf first) attached to the wallet key. 404 when none is attached. */
    async getCertificates(): Promise<string[]> {
        const res = await this.call<{ chain: string[] }>("GET", "/certificates");
        return res.chain;
    }

    /** Obtains an X.509 chain (`fetch` from the key provider, or `self-signed`) and attaches it. */
    async createCertificates(mode: "fetch" | "self-signed", params?: KmsCertificateParams): Promise<string[]> {
        const res = await this.call<{ chain: string[] }>("POST", "/certificates", {mode, params});
        return res.chain;
    }

    /** Attaches an X.509 chain (PEM, leaf first) obtained elsewhere. */
    async importCertificates(chain: string[]): Promise<string[]> {
        const res = await this.call<{ chain: string[] }>("PUT", "/certificates", {chain});
        return res.chain;
    }

    /** PKCS#10 certificate signing request (PEM) signed by the wallet key. Nothing is stored. */
    async createCsr(params: KmsCertificateParams): Promise<string> {
        const res = await this.call<{ csr: string }>("POST", "/csr", {params});
        return res.csr;
    }

    private call<T>(method: string, suffix: string, body?: unknown): Promise<T> {
        return this.client.request(method, this.base + suffix, {body, headers: {"x-api-key": this.apiKey}});
    }
}
