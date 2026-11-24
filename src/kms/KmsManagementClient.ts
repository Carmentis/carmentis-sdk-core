import {CarmentisKmsClient} from "./CarmentisKmsClient";
import {
    KmsCreatedWallet,
    KmsCreateWalletParams,
    KmsManagementCredential,
    KmsWallet,
    KmsWalletApiKey,
} from "./KmsTypes";

/**
 * Wallet management for KMS administrators (JWT) and global API keys (`jwks_…`).
 * These credentials manage wallets but can never sign with them.
 */
export class KmsManagementClient {
    private readonly headers: Record<string, string>;

    constructor(private readonly client: CarmentisKmsClient, credential: KmsManagementCredential) {
        this.headers = "apiKey" in credential
            ? {"x-api-key": credential.apiKey}
            : {Authorization: `Bearer ${credential.bearerToken}`};
    }

    /** All wallets, or only those administered by `adminPublicKey`. */
    listWallets(adminPublicKey?: string): Promise<KmsWallet[]> {
        const query = adminPublicKey === undefined ? "" : `?adminPublicKey=${enc(adminPublicKey)}`;
        return this.call("GET", `/api/manage/wallets${query}`);
    }

    /**
     * Creates a wallet administered by `adminPublicKey`, whether public creation is enabled or not.
     * The wallet API key is returned only once: hand it over to the wallet holder.
     */
    createWallet(params: KmsCreateWalletParams & { adminPublicKey: string }): Promise<KmsCreatedWallet> {
        return this.call("POST", "/api/manage/wallets", params);
    }

    getWallet(walletId: string): Promise<KmsWallet> {
        return this.call("GET", `/api/manage/wallets/${enc(walletId)}`);
    }

    async deleteWallet(walletId: string): Promise<void> {
        await this.call("DELETE", `/api/manage/wallets/${enc(walletId)}`);
    }

    setAdminKey(walletId: string, adminPublicKey: string): Promise<KmsWallet> {
        return this.call("PUT", `/api/manage/wallets/${enc(walletId)}/admin-key`, {publicKey: adminPublicKey});
    }

    regenerateApiKey(walletId: string): Promise<KmsWalletApiKey> {
        return this.call("POST", `/api/manage/wallets/${enc(walletId)}/api-key`);
    }

    private call<T>(method: string, path: string, body?: unknown): Promise<T> {
        return this.client.request(method, path, {body, headers: this.headers});
    }
}

function enc(segment: string): string {
    return encodeURIComponent(segment);
}
