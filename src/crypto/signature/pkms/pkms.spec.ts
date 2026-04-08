import {Utils} from "../../../utils/utils";
import {PkmsSecp256k1PrivateSignatureKey} from "./PkmsSecp256k1PrivateSignatureKey";
import {
    SelfProvidedApiKeyPkmsCredentialProvider
} from "./pkmsCredentialProvider/SelfProvidedApiKeyPkmsCredentialProvider";

const keyId = "35e6250c-790b-4442-9efa-5883352a39e1";
const apiKey = "REPLACE WITH YOUR API KEY"
const encoder = new TextEncoder();
import { describe, it, expect, beforeAll } from 'vitest'

describe("test", () => {
    it('should test', async () => {
        const msg = encoder.encode("Hello world");
        const sk = new PkmsSecp256k1PrivateSignatureKey(keyId);
        sk.setCredentialProvider(new SelfProvidedApiKeyPkmsCredentialProvider(apiKey));
        const signature = await sk.sign(msg)
        expect(signature).toBeInstanceOf(Uint8Array);
        const pk = await sk.getPublicKey();
        expect(pk.verify(msg, signature)).toBeTruthy();
    });
})

describe("PKMS", () => {
    it('should ', async () => {
        const host = "https://pkms.admin.carmentis.io"

        // we first obtain the public key
        const getPublicKeyResponse = await fetch(`${host}/api/keys/${keyId}/pk`, {
            method: "GET",
            headers: {
                authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
        });
        console.log(await getPublicKeyResponse.json())

        // we then sign the data
        const response = await fetch(`${host}/api/sign`, {
            method: "POST",
            headers: {
                authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                keyId: keyId,
                base64EncodedData: Utils.binaryToHexa(encoder.encode("Hello world")),
            })
        });
        const signResponse = await response.json()
        console.log(signResponse)

        // we then verify the signature
        const verifyResponse = await fetch(`${host}/api/verify`, {
            method: "POST",
            headers: {
                //authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                keyId: keyId,
                base64EncodedData: Utils.binaryToHexa(encoder.encode("Hello world")),
                base64EncodedSignature: signResponse.signature,
            })
        })
        console.log(await verifyResponse.json())

    });
})