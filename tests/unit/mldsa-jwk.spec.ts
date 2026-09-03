import {suite, it, describe, expect} from "vitest";
import {MLDSA65PrivateSignatureKey} from "../../src/crypto/signature/ml-dsa-65";
import * as jose from 'jose';
import {base64url} from "jose";

describe("ML-DSA-65 Compatibility with JWK", () => {
    it('should convert Carmentis ML-DSA-65 key to JWK', async () => {
        const sk = await MLDSA65PrivateSignatureKey.gen();
        const pk = await sk.getPublicKey();
        const pkBytes = await pk.getPublicKeyAsBytes();
        const pkJwkObject = {
            kty: 'AKP',
            alg: 'ML-DSA-65',
            pub: base64url.encode(pkBytes)
        }
        const pkJwk = await jose.importJWK(pkJwkObject, 'ML-DSA-65');
        expect(pkJwk).toBeDefined();
    });

    it("Should convert a private key in JWK and sign/verify JWT", async () => {
        const sk = await MLDSA65PrivateSignatureKey.gen();
        const pk = await sk.getPublicKey();
        const skBytes = await sk.getPrivateKeyAsBytes();
        const pkBytes = await pk.getPublicKeyAsBytes();
        const skJwkObject = {
            kty: 'AKP',
            alg: 'ML-DSA-65',
            pub: base64url.encode(pkBytes),
            priv: base64url.encode(skBytes)
        }

        const pkJwkObject = {
            kty: 'AKP',
            alg: 'ML-DSA-65',
            pub: base64url.encode(pkBytes)
        }


        // sign a jwt
        const skJwk = await jose.importJWK(skJwkObject, 'ML-DSA-65');
        const payload = {
            'test': 2
        };
        const jwt = await new jose.SignJWT(payload)
            .setProtectedHeader({alg: 'ML-DSA-65'})
            .sign(skJwk);



        // verify the signature
        const pkJwk = await jose.importJWK(pkJwkObject, 'ML-DSA-65');
        expect(pkJwk).toBeDefined();
        const verified = await jose.jwtVerify(jwt, pkJwk);
        expect(verified.payload).toEqual(payload);
    })
})