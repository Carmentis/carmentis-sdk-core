import {toBytes} from "@noble/ciphers/utils";
import {CryptoSchemeFactory} from "../CryptoSchemeFactory";
import {MLDSA65PrivateSignatureKey} from "./ml-dsa-65";
import {SignatureSchemeId} from "./SignatureSchemeId";
import {BytesSignatureEncoder} from "../encoder/signature/BytesSignatureEncoder";
import { describe, it, expect, test } from 'vitest'

describe('ML DSA 65 Signature', () => {
    test("Signature verification", async () => {
        const privateKey = await MLDSA65PrivateSignatureKey.gen();
        const publicKey = await privateKey.getPublicKey();
        const msg = toBytes("Hello world");
        const signature = await privateKey.sign(msg);
        expect(await publicKey.verify(msg, signature)).toBe(true);
    })

    test("Signature verification after encoding using encoder", async () => {
        const privateKey = await MLDSA65PrivateSignatureKey.gen();
        const encoder = new BytesSignatureEncoder();
        const publicKey = await privateKey.getPublicKey();
        const decodedPublicKey = await encoder.decodePublicKey(
            await encoder.encodePublicKey(publicKey)
        );

        const msg  = toBytes("Hello world");
        const signature = await privateKey.sign(msg);
        expect(await decodedPublicKey.verify(msg, signature)).toBe(true);
    })

    test("Signature verification after encoding using factory", async () => {
        const privateKey = await MLDSA65PrivateSignatureKey.gen();
        const rawPublicKey = await (await privateKey.getPublicKey()).getPublicKeyAsBytes();

        const cryptoFactory = new CryptoSchemeFactory();
        const publicKey = await cryptoFactory.createPublicSignatureKey(SignatureSchemeId.ML_DSA_65, rawPublicKey);
        const msg  = toBytes("Hello world");
        const signature = await privateKey.sign(msg);
        expect(await publicKey.verify(msg, signature)).toBe(true);
    })

    test("Invalid factory usage", async () => {
        const privateKey = await MLDSA65PrivateSignatureKey.gen();
        const rawPublicKey = await (await privateKey.getPublicKey()).getPublicKeyAsBytes();

        const cryptoFactory = new CryptoSchemeFactory();
        await expect(cryptoFactory.createPublicSignatureKey(-1, rawPublicKey)).rejects.toThrow();
    })
})

describe('Secp256k1 Signature', () => {
    test("Signature verification", () => {
        /*
        const privateKey = Secp256k1PrivateSignatureKey.gen();
        const publicKey = privateKey.getPublicKey();
        const msg = toBytes("Hello world");
        const signature = privateKey.sign(msg);
        expect(publicKey.verify(msg, signature)).toBe(true);

         */
    })
})


describe('Generic signature encoder', () => {
    test("", async () => {
        const encoder = new BytesSignatureEncoder();

        const privateKey = await MLDSA65PrivateSignatureKey.gen();
        const publicKey = await privateKey.getPublicKey();
        const rawPublicKey = await encoder.encodePublicKey(publicKey);
        const publicKey2 = await encoder.decodePublicKey(rawPublicKey);
        expect(publicKey2.getPublicKeyAsBytes()).toEqual(publicKey.getPublicKeyAsBytes());
        expect(publicKey2.getSignatureSchemeId()).toEqual(publicKey.getSignatureSchemeId());
    })
})

/*
describe('HCV signature encoder', () => {
    let privateKey: MLDSA65PrivateSignatureKey;
    let publicKey: MLDSA65PublicSignatureKey;

    beforeAll(async () => {
      privateKey = await MLDSA65PrivateSignatureKey.gen();
      publicKey = await privateKey.getPublicKey();
    });

    test("With base64 encoder", async () => {
        const encoder = HCVSignatureEncoder.createBase64HCVSignatureEncoder();
        const recoveredPublicKey = await encoder.decodePublicKey(await encoder.encodePublicKey(publicKey));
        const recoveredPrivateKey = encoder.decodePrivateKey(encoder.encodePrivateKey(privateKey));
        expect(publicKey.getPublicKeyAsBytes()).toEqual(recoveredPublicKey.getPublicKeyAsBytes());
        expect(privateKey.getPrivateKeyAsBytes()).toEqual(recoveredPrivateKey.getPrivateKeyAsBytes());
        expect(privateKey.getSignatureSchemeId()).toEqual(recoveredPrivateKey.getSignatureSchemeId());
    })

    test("With Hex encoder", async () => {
        const encoder = HCVSignatureEncoder.createHexHCVSignatureEncoder();
        const recoveredPublicKey = await encoder.decodePublicKey(await encoder.encodePublicKey(publicKey));
        const recoveredPrivateKey = encoder.decodePrivateKey(encoder.encodePrivateKey(privateKey));
        expect(await publicKey.getPublicKeyAsBytes()).toEqual(await recoveredPublicKey.getPublicKeyAsBytes());
        expect(privateKey.getPrivateKeyAsBytes()).toEqual(recoveredPrivateKey.getPrivateKeyAsBytes());
        expect(privateKey.getSignatureSchemeId()).toEqual(recoveredPrivateKey.getSignatureSchemeId());
    })
})

 */