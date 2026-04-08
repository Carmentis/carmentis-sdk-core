import {HandlerBasedSignatureEncoder} from "./HandlerBasedSignatureEncoder";
import {PrivateSignatureKey} from "../../signature/PrivateSignatureKey";
import {PublicSignatureKey} from "../../signature/PublicSignatureKey";
import {MLDSA65PrivateSignatureKey} from "../../signature/ml-dsa-65";
import {PkmsSecp256k1PrivateSignatureKey} from "../../signature/pkms/PkmsSecp256k1PrivateSignatureKey";
import {Secp256k1PrivateSignatureKey} from "../../signature/secp256k1/Secp256k1PrivateSignatureKey";

describe("Encoding", () => {
    const encoder = new HandlerBasedSignatureEncoder();

    async function testKeyPairEncoding(sk: PrivateSignatureKey, pk: PublicSignatureKey) {
        // encode sk
        const encodedSk = await encoder.encodePrivateKey(sk);
        expect(typeof encodedSk === 'string').toBeTruthy();
        const decodedSk = await encoder.decodePrivateKey(encodedSk);
        expect(decodedSk).toEqual(sk);

        // encode pk
        const encodedPk = await encoder.encodePublicKey(pk);
        expect(typeof encodedPk === 'string').toBeTruthy();
        const decodedPk = await encoder.decodePublicKey(encodedPk);
        expect(decodedPk).toEqual(pk);
    }
    it('should correctly encode and decode a native secp256k1 private and public', async () => {
        const sk = Secp256k1PrivateSignatureKey.gen();
        const pk = await sk.getPublicKey();
        await testKeyPairEncoding(sk, pk);
    });

    it('should correctly encode and decode a native mldsa private and public', async () => {
        const sk = await MLDSA65PrivateSignatureKey.gen();
        const pk = await sk.getPublicKey();
        await testKeyPairEncoding(sk, pk);
    });

    it('should correctly encode and decode a kms-based secp256k1 private and public', async () => {
        // here we can only test the private key, the public key can be obtained externally
        const sk = await new PkmsSecp256k1PrivateSignatureKey("Key Id");
        const encodedSk = await encoder.encodePrivateKey(sk);
        expect(typeof encodedSk === 'string').toBeTruthy();
        console.log(encodedSk)
        const decodedSk = await encoder.decodePrivateKey(encodedSk);
        expect(decodedSk).toEqual(sk);

    });
})