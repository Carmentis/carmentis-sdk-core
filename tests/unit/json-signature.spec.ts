import {describe, it, expect} from "vitest";
import {JwkPrivateSignatureKey} from "../../src/crypto/signature/jwk/JwkPrivateSignatureKey";
import {JsonSignatureVerifier} from "../../src/crypto/signature/signer/json/JsonSignatureVerifier";
import {JsonCanonicalUtf8Signer} from "../../src/crypto/signature/signer/json/JsonCanonicalUtf8Signer";
import {JwsSigner} from "../../src/crypto/signature/signer/json/JwsSigner";
import {SignatureContext} from "../../src/type/JsonSignatureSchemas";
import {JsonSignatureParser} from "../../src/crypto/signature/signer/json/JsonSignatureParser";


describe("SignatureObject", () => {
    it('should sign and verify an payload-embedded signature',  async() => {
        const sk = await JwkPrivateSignatureKey.gen('PS256');
        const pk = await sk.getPublicKey();
        const signer = new JsonCanonicalUtf8Signer();
        const payload = { message: "Hello" }
        const context: SignatureContext = {
            signedAt: Date.now(),
            purpose: 'Test signature',
        }
        const sig = await signer
            .sign(
                sk,
                context,
                payload
            );
        const signature = JsonSignatureParser.parse(sig)

        const verifier = new JsonSignatureVerifier();
        const result = await verifier.verify(pk, signature, {
            verifiedAt: Date.now(),
        });
        expect(result).toBeDefined();
        console.log(result);
        expect(result.verified).toBe(true);
    });

    it('should sign and verify a jwt signature',  async() => {
        const sk = await JwkPrivateSignatureKey.gen('ES256');
        const pk = await sk.getPublicKey();
        const signer = new JwsSigner();
        const payload = { message: "Hello" }
        const context: SignatureContext = {
            signedAt: Date.now(),
            purpose: 'Test signature',
            notValidBefore: Date.now()
        }
        const sig = await signer
            .sign(
                sk,
                context,
                payload
            );
        const signature = JsonSignatureParser.parse(sig)


        const verifier = new JsonSignatureVerifier();
        const result = await verifier
            .setPayload(payload)
            .verify(pk, signature);
        expect(result).toBeDefined();
        expect(result.verified).toBe(true);
    });


    it('should reject due to invalid context',  async() => {
        const sk = await JwkPrivateSignatureKey.gen('ES256');
        const pk = await sk.getPublicKey();
        const signer = new JwsSigner();
        const payload = { message: "Hello" }
        const context: SignatureContext = {
            signedAt: Date.now(),
            purpose: 'Test signature',
            notValidBefore: Date.now() * 1000
        }
        const sig = await signer
            .sign(
                sk,
                context,
                payload
            );
        const signature = JsonSignatureParser.parse(sig)


        const verifier = new JsonSignatureVerifier();
        const result = await verifier
            .setPayload(payload)
            .verify(pk, signature);
        expect(result).toBeDefined();
        expect(result.verified).toBe(false);
    });
})