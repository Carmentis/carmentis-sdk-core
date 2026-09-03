import {describe, expect, it} from "vitest";
import {Ed25519PublicSignatureKey} from "../../src/crypto/signature/ed25519/Ed25519PublicSignatureKey";
import {JwkSignatureEncoder} from "../../src/crypto/encoder/signature/JwkSignatureEncoder";
import {Ed25519PrivateSignatureKey} from "../../src/crypto/signature/ed25519/Ed25519PrivateSignatureKey";
import * as jose from 'jose';

describe('JoseSignatureEncoder', () => {

    it('test', async () => {
        const { privateKey, publicKey } = await jose.generateKeyPair('EdDSA', {
            crv: 'Ed25519',
            extractable: true,
        })

         const privateKeyJwk = await jose.exportJWK(privateKey)
        const publicKeyJwk = await jose.exportJWK(publicKey)
    })
    it("Should encode a Carmentis-formatted key", async () => {



        // we generate and export a private key
        const sk = Ed25519PrivateSignatureKey.gen();
        const encodedSk = await JwkSignatureEncoder.exportPrivateSignatureKey(sk);
        const message = new TextEncoder().encode("Hello world")
        const sig = await new jose.GeneralSign(message)
            .addSignature(encodedSk)
            .setProtectedHeader({ alg: "EdDSA" })
            .sign();



        // we now export the public key
        const pk = await sk.getPublicKey();
        const encodedPk = await JwkSignatureEncoder.exportPublicSignatureKey(pk);
        const jwk = await jose.exportJWK(encodedPk);

        // we now verify the signature
        const { payload } = await jose.generalVerify(sig, encodedPk);
        expect(payload).toEqual(message)
    })
})