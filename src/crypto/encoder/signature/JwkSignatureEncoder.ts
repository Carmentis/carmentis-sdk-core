import {EncoderInterface} from "../../../utils/encoder";
import {PublicSignatureKey} from "../../signature/PublicSignatureKey";
import {Ed25519PublicSignatureKey} from "../../signature/ed25519/Ed25519PublicSignatureKey";
import * as jose from 'jose';
import {PrivateSignatureKey} from "../../signature/PrivateSignatureKey";
import {Ed25519PrivateSignatureKey} from "../../signature/ed25519/Ed25519PrivateSignatureKey";

export class JwkSignatureEncoder {
    static async exportPublicSignatureKey(publicKey: PublicSignatureKey) {
        if (publicKey instanceof Ed25519PublicSignatureKey) {
            const pk = await publicKey.getPublicKeyAsBytes();
            const importedPk = await jose.importJWK({
                kty: "OKP",
                crv: "Ed25519",
                alg: "EdDSA",
                x: jose.base64url.encode(pk),
            });
            return importedPk as unknown as CryptoKey
        }

        throw new Error("Unsupported public key type");
    }

    static async exportPrivateSignatureKey(privateKey: PrivateSignatureKey) {
        if (privateKey instanceof Ed25519PrivateSignatureKey) {
            const sk = privateKey.getPrivateKeyAsBytes();
            const publicKey = await privateKey.getPublicKey();
            const publicKeyBytes = await publicKey.getPublicKeyAsBytes();
            const importedPk = await jose.importJWK({
                kty: "OKP",
                crv: "Ed25519",
                alg: "EdDSA",
                d: jose.base64url.encode(sk),
                x: jose.base64url.encode(publicKeyBytes),
            });
            return importedPk as unknown as CryptoKey
        }
        throw new Error("Unsupported key type");
    }
}