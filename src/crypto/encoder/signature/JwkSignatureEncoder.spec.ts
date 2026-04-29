import {describe, expect, it} from "vitest";
import {Ed25519PublicSignatureKey} from "../../signature/ed25519/Ed25519PublicSignatureKey";
import {JwkSignatureEncoder} from "./JwkSignatureEncoder";
import {Ed25519PrivateSignatureKey} from "../../signature/ed25519/Ed25519PrivateSignatureKey";
import * as jose from 'jose';

describe('JoseSignatureEncoder', () => {

    it('test', async () => {
        console.log("Generating key pair for wallet")
        const { privateKey, publicKey } = await jose.generateKeyPair('EdDSA', {
            crv: 'Ed25519',
            extractable: true,
        })

        console.log("Exporting keys in JWK")
        const privateKeyJwk = await jose.exportJWK(privateKey)
        const publicKeyJwk = await jose.exportJWK(publicKey)
    })
    it("Should encode a Carmentis-formatted key", async () => {



        // we generate and export a private key
        const sk = Ed25519PrivateSignatureKey.gen();
        const encodedSk = await JwkSignatureEncoder.exportPrivateSignatureKey(sk);
        console.log(encodedSk)
        const message = new TextEncoder().encode("Hello world")
        const sig = await new jose.GeneralSign(message)
            .addSignature(encodedSk)
            .setProtectedHeader({ alg: "EdDSA" })
            .sign();
        console.log(sig)



        // we now export the public key
        const pk = await sk.getPublicKey();
        const encodedPk = await JwkSignatureEncoder.exportPublicSignatureKey(pk);
        console.log(encodedPk)
        const jwk = await jose.exportJWK(encodedPk);
        console.log(jwk)

        // we now verify the signature
        const { payload } = await jose.generalVerify(sig, encodedPk);
        expect(payload).toEqual(message)
    })
})