import {PrivateSignatureKey} from "../crypto/signature/PrivateSignatureKey";
import {JsonEncoder} from "../crypto/signature/signer/json/JsonEncoder";
import {JsonCanonicalizationMethod} from "../crypto/signature/signer/json/JsonCanonicalizationMethod";
import {CryptoEncoderFactory} from "../crypto/encoder/CryptoEncoderFactory";
import {CarmentisKmsClient} from "./CarmentisKmsClient";
import {
    KmsCreatedWallet,
    KmsCreateWalletParams,
    KmsSignedRequest,
    KmsWallet,
    KmsWalletApiKey,
} from "./KmsTypes";
import {bytesToBase64} from "./KmsBase64";

/**
 * Administers wallets with an admin key: your own Carmentis signature key, which the KMS
 * only knows by its public part.
 *
 * Each operation is a signed request: a fresh single-use challenge is requested, then
 * `{challenge, method, path, body}` is signed (RFC 8785 canonical JSON) and sent as
 * `{publicKey, signature, payload}`. The signature covers the method, the path and the body,
 * and the challenge cannot be replayed.
 *
 * A signed request on a wallet the signer does not administer answers 404, like an unknown wallet.
 */
export class KmsWalletAdmin {
    private encodedPublicKey?: Promise<string>;

    constructor(
        private readonly client: CarmentisKmsClient,
        private readonly adminKey: PrivateSignatureKey,
    ) {}

    /**
     * Creates a wallet administered by this admin key. The response holds the wallet API key,
     * returned only once. Rejected with 403 unless public creation is enabled on the KMS.
     */
    createWallet(params: KmsCreateWalletParams = {}): Promise<KmsCreatedWallet> {
        return this.send("POST", "/api/wallets", params);
    }

    /** Wallets administered by this admin key. */
    listMyWallets(): Promise<KmsWallet[]> {
        return this.send("POST", "/api/wallets/mine", {});
    }

    /**
     * Hands the wallet over to another admin key (Carmentis string encoding).
     * This admin key loses all rights at once.
     */
    setAdminKey(walletId: string, newAdminPublicKey: string): Promise<KmsWallet> {
        return this.send("PUT", `/api/wallets/${enc(walletId)}/admin-key`, {publicKey: newAdminPublicKey});
    }

    /** Regenerates the wallet API key. The previous one stops working at once; the new one is returned only once. */
    regenerateApiKey(walletId: string): Promise<KmsWalletApiKey> {
        return this.send("POST", `/api/wallets/${enc(walletId)}/api-key`, {});
    }

    /** Destroys the wallet: private key (or access configuration), actor seed and API key. */
    async deleteWallet(walletId: string): Promise<void> {
        await this.send("DELETE", `/api/wallets/${enc(walletId)}`, {});
    }

    /** Admin public key, Carmentis string encoding. */
    getAdminPublicKey(): Promise<string> {
        this.encodedPublicKey ??= (async () => CryptoEncoderFactory.defaultStringSignatureEncoder()
            .encodePublicKey(await this.adminKey.getPublicKey()))();
        return this.encodedPublicKey;
    }

    /** Builds a signed request body for `method path` with a fresh challenge. */
    async signRequest(method: string, path: string, body: unknown): Promise<KmsSignedRequest> {
        const challenge = await this.client.requestChallenge();
        const payload = {challenge, method, path, body};
        const message = JsonEncoder.encode(payload, JsonCanonicalizationMethod.JSON_CANONICAL);
        const signature = await this.adminKey.sign(message);
        return {publicKey: await this.getAdminPublicKey(), signature: bytesToBase64(signature), payload};
    }

    private async send<T>(method: string, path: string, body: unknown): Promise<T> {
        return this.client.sendSignedRequest(method, path, await this.signRequest(method, path, body));
    }
}

function enc(segment: string): string {
    return encodeURIComponent(segment);
}
