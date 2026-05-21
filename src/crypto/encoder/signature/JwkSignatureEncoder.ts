import {EncoderInterface} from "../../../utils/encoder";
import {PublicSignatureKey} from "../../signature/PublicSignatureKey";
import {Ed25519PublicSignatureKey} from "../../signature/ed25519/Ed25519PublicSignatureKey";
import * as jose from 'jose';
import {PrivateSignatureKey} from "../../signature/PrivateSignatureKey";
import {Ed25519PrivateSignatureKey} from "../../signature/ed25519/Ed25519PrivateSignatureKey";

/**
 * Helper class for encoding and exporting signature keys as JWK (JSON Web Key).
 */
export class JwkSignatureEncoder {
    /**
     * Exports a public signature key into a CryptoKey format for usage in cryptographic operations.
     *
     * @param {PublicSignatureKey} publicKey - The public signature key to be exported. Must be of type `Ed25519PublicSignatureKey`.
     * @return {Promise<CryptoKey>} A promise that resolves to the exported CryptoKey. The key will be in the EdDSA algorithm format.
     * @throws {Error} If the provided public key is of an unsupported type.
     */
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

    /**
     * Exports a private signature key in a format compatible with cryptographic operations.
     * The method supports the `Ed25519PrivateSignatureKey` type and derives the corresponding public key in the process.
     *
     * @param {PrivateSignatureKey} privateKey - The private signature key to be exported. Must be an instance of `Ed25519PrivateSignatureKey`.
     * @return {Promise<CryptoKey>} A promise that resolves with the exported private key as a `CryptoKey` object.
     * @throws {Error} If the provided key is of an unsupported type.
     */
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