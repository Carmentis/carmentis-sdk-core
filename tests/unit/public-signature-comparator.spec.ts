import {describe, expect, it} from "vitest";
import {PublicSignatureComparator} from "../../src/crypto/signature/PublicSignatureComparator";
import {Secp256k1PrivateSignatureKey} from "../../src/crypto/signature/secp256k1/Secp256k1PrivateSignatureKey";
import {Secp256k1PublicSignatureKey} from "../../src/crypto/signature/secp256k1/Secp256k1PublicSignatureKey";
import {Ed25519PublicSignatureKey} from "../../src/crypto/signature/ed25519/Ed25519PublicSignatureKey";
import {JwkPublicSignatureKey} from "../../src/crypto/signature/jwk/JwkPublicSignatureKey";
import {Point} from "@noble/secp256k1";

describe("PublicSignatureComparator", () => {
    it("compares a WebCrypto Ed25519 key with the native key", async () => {
        const pair = await crypto.subtle.generateKey("Ed25519", true, ["sign", "verify"]) as CryptoKeyPair;
        const raw = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
        const other = await crypto.subtle.generateKey("Ed25519", true, ["sign", "verify"]) as CryptoKeyPair;

        expect(await PublicSignatureComparator.areEquals(pair.publicKey, new Ed25519PublicSignatureKey(raw))).toBe(true);
        expect(await PublicSignatureComparator.areEquals(new Ed25519PublicSignatureKey(raw), pair.publicKey)).toBe(true);
        expect(await PublicSignatureComparator.areEquals(pair.publicKey, other.publicKey)).toBe(false);
    });

    it("compares a WebCrypto P-256 key with its JWK key", async () => {
        const pair = await crypto.subtle.generateKey({name: "ECDSA", namedCurve: "P-256"}, true, ["sign", "verify"]) as CryptoKeyPair;
        const jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
        const jwkKey = await JwkPublicSignatureKey.fromJwk({...jwk, kid: "ignored"});
        expect(await PublicSignatureComparator.areEquals(pair.publicKey, jwkKey)).toBe(true);
    });

    it("compares compressed native secp256k1 keys with their JWK form", async () => {
        const priv = Secp256k1PrivateSignatureKey.gen();
        const pub = await priv.getPublicKey();
        const bytes = await pub.getPublicKeyAsBytes();
        const uncompressed = Point.fromBytes(bytes).toBytes(false);
        const b64 = (u: Uint8Array) => Buffer.from(u).toString("base64url");
        const jwkKey = await JwkPublicSignatureKey.fromJwk({
            kty: "EC", crv: "secp256k1", x: b64(uncompressed.slice(1, 33)), y: b64(uncompressed.slice(33)),
        });
        expect(await PublicSignatureComparator.areEquals(pub, jwkKey)).toBe(true);
        expect(await PublicSignatureComparator.areEquals(pub, new Secp256k1PublicSignatureKey(bytes))).toBe(true);
        const other = await Secp256k1PrivateSignatureKey.gen().getPublicKey();
        expect(await PublicSignatureComparator.areEquals(pub, other)).toBe(false);
    });

    it("rejects private CryptoKeys", async () => {
        const pair = await crypto.subtle.generateKey("Ed25519", true, ["sign", "verify"]) as CryptoKeyPair;
        await expect(PublicSignatureComparator.areEquals(pair.privateKey, pair.publicKey)).rejects.toThrow();
    });
});
