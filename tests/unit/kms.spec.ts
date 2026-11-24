import {describe, expect, it, vi} from "vitest";
import {JwkPrivateSignatureKey} from "../../src/crypto/signature/jwk/JwkPrivateSignatureKey";
import {Secp256k1PrivateSignatureKey} from "../../src/crypto/signature/secp256k1/Secp256k1PrivateSignatureKey";
import {SignatureSchemeId} from "../../src/crypto/signature/SignatureSchemeId";
import {CryptoEncoderFactory} from "../../src/crypto/encoder/CryptoEncoderFactory";
import {CarmentisKmsClient} from "../../src/kms/CarmentisKmsClient";
import {KmsWalletAdmin} from "../../src/kms/KmsWalletAdmin";
import {KmsManagementClient} from "../../src/kms/KmsManagementClient";
import {KmsPrivateSignatureKey} from "../../src/kms/KmsPrivateSignatureKey";
import {KmsPublicSignatureKey} from "../../src/kms/KmsPublicSignatureKey";
import {KmsError} from "../../src/kms/KmsError";
import {base64ToBytes, bytesToBase64} from "../../src/kms/KmsBase64";
import {JsonEncoder} from "../../src/crypto/signature/signer/json/JsonEncoder";
import {JsonCanonicalizationMethod} from "../../src/crypto/signature/signer/json/JsonCanonicalizationMethod";

const BASE = "https://kms.test";
const API_KEY = "wlt_secret";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {status});

type Call = { method: string; path: string; body: any; headers: Record<string, string> };

async function mockKms() {
    const walletKey = await JwkPrivateSignatureKey.gen("ES256");
    const calls: Call[] = [];
    let challenges = 0;
    const wallet = (adminPublicKey: string) => ({
        id: "w1", pluginId: "local", publicJwk: walletKey.getPublicJwk(), adminPublicKey,
        certificates: null, createdBy: "public", createdAt: "2026-11-19T10:00:00.000Z",
    });
    const fetchMock = vi.fn(async (url: string, init: any) => {
        const path = url.slice(BASE.length);
        const body = init.body ? JSON.parse(init.body) : undefined;
        calls.push({method: init.method, path, body, headers: init.headers});
        if (path === "/api/wallets/challenge") return json({challenge: `nonce-${++challenges}`});
        if (path === "/api/wallets/w1/public-key?format=jwk") return json(walletKey.getPublicJwk());
        if (path === "/api/wallets" && init.method === "POST") {
            return json({...wallet(body.publicKey), apiKey: API_KEY}, 201);
        }
        if (path.startsWith("/api/wallets/w1/") && path.endsWith("/sign/raw")) {
            if (init.headers["x-api-key"] !== API_KEY) return json({}, 404);
            const sig = await walletKey.sign(base64ToBytes(body.data));
            return json({signature: bytesToBase64(sig)});
        }
        if (path.startsWith("/api/manage/wallets")) return json([wallet("sig:x")]);
        return json({message: "not found"}, 404);
    });
    const client = new CarmentisKmsClient({baseUrl: BASE, fetch: fetchMock as any});
    return {walletKey, calls, client};
}

describe("Carmentis KMS wallets", () => {
    it("creates a wallet with a signed request covering method, path, body and a fresh nonce", async () => {
        const kms = await mockKms();
        const adminKey = await Secp256k1PrivateSignatureKey.gen();
        const admin = new KmsWalletAdmin(kms.client, adminKey);

        const created = await admin.createWallet({pluginId: "local", params: {algorithm: "ES256"}, label: "Invoices"});
        expect(created.apiKey).toBe(API_KEY);

        const call = kms.calls.find(c => c.path === "/api/wallets")!;
        expect(call.method).toBe("POST");
        expect(call.body.payload).toEqual({
            challenge: "nonce-1",
            method: "POST",
            path: "/api/wallets",
            body: {pluginId: "local", params: {algorithm: "ES256"}, label: "Invoices"},
        });
        const expectedPk = await CryptoEncoderFactory.defaultStringSignatureEncoder()
            .encodePublicKey(await adminKey.getPublicKey());
        expect(call.body.publicKey).toBe(expectedPk);
        const message = JsonEncoder.encode(call.body.payload, JsonCanonicalizationMethod.JSON_CANONICAL);
        expect(await (await adminKey.getPublicKey()).verify(message, base64ToBytes(call.body.signature))).toBe(true);

        // Each signed request consumes its own challenge.
        await expect(admin.deleteWallet("w1")).rejects.toBeInstanceOf(KmsError);
        const del = kms.calls.find(c => c.method === "DELETE")!;
        expect(del.path).toBe("/api/wallets/w1");
        expect(del.body.payload).toMatchObject({challenge: "nonce-2", method: "DELETE", path: "/api/wallets/w1", body: {}});
    });

    it("signs with the wallet API key and verifies locally", async () => {
        const kms = await mockKms();
        const key = await kms.client.wallet("w1", API_KEY).getSignatureKey();

        expect(key).toBeInstanceOf(JwkPrivateSignatureKey);
        expect(key.getSignatureSchemeId()).toBe(SignatureSchemeId.JWK);

        const data = new TextEncoder().encode("hello");
        const signature = await key.sign(data);
        const pk = await key.getPublicKey();
        expect(pk).toBeInstanceOf(KmsPublicSignatureKey);
        expect(pk.getKmsReference()).toEqual({walletId: "w1"});
        expect(await pk.verify(data, signature)).toBe(true);
        expect(await pk.verify(new TextEncoder().encode("other"), signature)).toBe(false);

        const sign = kms.calls.find(c => c.path === "/api/wallets/w1/sign/raw")!;
        expect(sign.headers["x-api-key"]).toBe(API_KEY);
        const publicKeyCall = kms.calls.find(c => c.path.includes("/public-key"))!;
        expect(publicKeyCall.headers["x-api-key"]).toBeUndefined();
    });

    it("reports a wrong wallet API key as not found", async () => {
        const kms = await mockKms();
        const key = await kms.client.wallet("w1", "wlt_other").getSignatureKey();
        const error = await key.sign(new Uint8Array([1])).catch(e => e);
        expect(error).toBeInstanceOf(KmsError);
        expect((error as KmsError).isNotFound()).toBe(true);
    });

    it("refuses to export private material", async () => {
        const kms = await mockKms();
        const key = await KmsPrivateSignatureKey.fromWallet(kms.client.wallet("w1", API_KEY), kms.walletKey.getPublicJwk());
        expect(kms.calls).toHaveLength(0);
        expect(() => key.getPrivateKeyAsBytes()).toThrow(/KMS/);
        expect(() => key.getPrivateJwk()).toThrow(/KMS/);
        expect(() => key.getRawPrivateKeyBytes()).toThrow(/KMS/);
    });

    it("sends the management credential", async () => {
        const kms = await mockKms();
        await new KmsManagementClient(kms.client, {apiKey: "jwks_global"}).listWallets("sig:a b");
        await new KmsManagementClient(kms.client, {bearerToken: "jwt"}).listWallets();
        expect(kms.calls[0].path).toBe("/api/manage/wallets?adminPublicKey=sig%3Aa%20b");
        expect(kms.calls[0].headers["x-api-key"]).toBe("jwks_global");
        expect(kms.calls[1].headers["Authorization"]).toBe("Bearer jwt");
    });
});
