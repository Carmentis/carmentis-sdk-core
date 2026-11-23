import {describe, expect, it, vi} from "vitest";
import {JwkPrivateSignatureKey} from "../../src/crypto/signature/jwk/JwkPrivateSignatureKey";
import {Secp256k1PrivateSignatureKey} from "../../src/crypto/signature/secp256k1/Secp256k1PrivateSignatureKey";
import {SignatureSchemeId} from "../../src/crypto/signature/SignatureSchemeId";
import {CarmentisKmsClient} from "../../src/kms/CarmentisKmsClient";
import {KmsSession} from "../../src/kms/KmsSession";
import {KmsPrivateSignatureKey} from "../../src/kms/KmsPrivateSignatureKey";
import {KmsPublicSignatureKey} from "../../src/kms/KmsPublicSignatureKey";
import {base64ToBytes, bytesToBase64} from "../../src/kms/KmsBase64";
import {JsonEncoder} from "../../src/crypto/signature/signer/json/JsonEncoder";
import {JsonCanonicalizationMethod} from "../../src/crypto/signature/signer/json/JsonCanonicalizationMethod";

const BASE = "https://kms.test";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {status});

async function mockKms() {
    const serverKey = await JwkPrivateSignatureKey.gen("ES256");
    const calls: {method: string; path: string; body: any; auth?: string}[] = [];
    let tokens = 0;
    let rejectNext = false;
    const accessKey = Secp256k1PrivateSignatureKey.gen();
    const fetchMock = vi.fn(async (url: string, init: any) => {
        const path = url.slice(BASE.length);
        const body = init.body ? JSON.parse(init.body) : undefined;
        calls.push({method: init.method, path, body, auth: init.headers.Authorization});
        if (path === "/api/auth/user/challenge") return json({challenge: "Y2hhbGxlbmdl"});
        if (path === "/api/auth/user/login") return json({token: `jwt-${++tokens}`, expiresIn: 1200, publicKey: body.publicKey});
        if (rejectNext) { rejectNext = false; return json({message: "expired"}, 401); }
        if (path.endsWith("/public-key?format=jwk")) return json(serverKey.getPublicJwk());
        if (path.endsWith("/sign/raw")) {
            const sig = await serverKey.sign(base64ToBytes(body.data));
            return json({signature: bytesToBase64(sig)});
        }
        return json({}, 404);
    });
    return {serverKey, calls, fetchMock, accessKey, rejectOnce: () => { rejectNext = true; }};
}

describe("Carmentis KMS integration", () => {
    it("logs in by signing the canonical challenge payload and caches the token", async () => {
        const kms = await mockKms();
        const session = new KmsSession({baseUrl: BASE, accessKey: await kms.accessKey, fetch: kms.fetchMock as any});
        expect(await session.getToken()).toBe("jwt-1");
        expect(await session.getToken()).toBe("jwt-1");
        const login = kms.calls.find(c => c.path === "/api/auth/user/login")!;
        expect(login.body.payload).toEqual({challenge: "Y2hhbGxlbmdl"});
        const message = JsonEncoder.encode(login.body.payload, JsonCanonicalizationMethod.JSON_CANONICAL);
        const pk = await (await kms.accessKey).getPublicKey();
        expect(await pk.verify(message, base64ToBytes(login.body.signature))).toBe(true);
        expect(kms.calls.filter(c => c.path.endsWith("/login"))).toHaveLength(1);
    });

    it("refreshes the token once expired", async () => {
        const kms = await mockKms();
        let now = 0;
        const session = new KmsSession({baseUrl: BASE, accessKey: await kms.accessKey, fetch: kms.fetchMock as any, now: () => now});
        expect(await session.getToken()).toBe("jwt-1");
        now = 1_200_000;
        expect(await session.getToken()).toBe("jwt-2");
    });

    it("signs through the KMS and verifies locally", async () => {
        const kms = await mockKms();
        const session = new KmsSession({baseUrl: BASE, accessKey: await kms.accessKey, fetch: kms.fetchMock as any});
        const client = session.createClient();
        const key = await KmsPrivateSignatureKey.fromKmsKey({client, userspaceId: "u1", keyId: "k1"});

        expect(key).toBeInstanceOf(JwkPrivateSignatureKey);
        expect(key.getSignatureSchemeId()).toBe(SignatureSchemeId.JWK);

        const data = new TextEncoder().encode("hello");
        const signature = await key.sign(data);
        const pk = await key.getPublicKey();
        expect(pk).toBeInstanceOf(KmsPublicSignatureKey);
        expect(pk.getKmsReference()).toEqual({userspaceId: "u1", keyId: "k1"});
        expect(await pk.verify(data, signature)).toBe(true);
        expect(await pk.verify(new TextEncoder().encode("other"), signature)).toBe(false);
        const call = kms.calls.find(c => c.path === "/api/userspaces/u1/keys/k1/sign/raw")!;
        expect(call.auth).toBe("Bearer jwt-1");
    });

    it("refuses to export private material", async () => {
        const kms = await mockKms();
        const client = new CarmentisKmsClient({baseUrl: BASE, fetch: kms.fetchMock as any});
        const key = await KmsPrivateSignatureKey.fromKmsKey({
            client, userspaceId: "u1", keyId: "k1", publicJwk: kms.serverKey.getPublicJwk(),
        });
        expect(() => key.getPrivateKeyAsBytes()).toThrow(/KMS/);
        expect(() => key.getPrivateJwk()).toThrow(/KMS/);
        expect(() => key.getRawPrivateKeyBytes()).toThrow(/KMS/);
    });

    it("re-authenticates once on 401", async () => {
        const kms = await mockKms();
        const session = new KmsSession({baseUrl: BASE, accessKey: await kms.accessKey, fetch: kms.fetchMock as any});
        const client = session.createClient();
        await session.getToken();
        kms.rejectOnce();
        await client.getPublicJwk("u1", "k1");
        expect(kms.calls.filter(c => c.path.endsWith("/login"))).toHaveLength(2);
    });
});
