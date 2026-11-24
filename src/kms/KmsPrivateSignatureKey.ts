import {JwkPrivateSignatureKey} from "../crypto/signature/jwk/JwkPrivateSignatureKey";
import {
    JwkSignatureAlgorithm,
    resolveJwkSignatureAlgorithm,
    SignatureJwk,
    sortJwkMembers,
} from "../crypto/signature/jwk/JwkSignatureAlgorithm";
import {JwkSignatureScheme} from "../crypto/signature/jwk/JwkSignatureScheme";
import {JwkFilter} from "../crypto/signature/jwk/JwkFilter";
import {JwkSigner} from "../crypto/signature/jwk/JwkSignatureBackend";
import {KmsPublicSignatureKey} from "./KmsPublicSignatureKey";
import {KmsWalletReference} from "./KmsTypes";
import type {KmsWalletClient} from "./KmsWalletClient";

const NON_EXPORTABLE = "This key is managed by a Carmentis KMS wallet: its private material never leaves the server";

/**
 * Private signature key of a Carmentis KMS wallet.
 *
 * It behaves like any {@link JwkPrivateSignatureKey}, with JWK scheme and JOSE-style
 * signatures, but {@link sign} is delegated to the KMS (with the wallet API key) and the
 * private material can't be exported.
 */
export class KmsPrivateSignatureKey extends JwkPrivateSignatureKey {
    protected constructor(
        algorithm: JwkSignatureAlgorithm,
        publicJwk: SignatureJwk,
        signer: JwkSigner,
        scheme: JwkSignatureScheme,
        private readonly reference: KmsWalletReference,
    ) {
        // The base class holds the public JWK in place of the private one: there is none.
        super(algorithm, publicJwk, publicJwk, signer, scheme);
    }

    /** Wraps the key of a wallet. Only its public JWK is fetched, unless already known. */
    static async fromWallet(wallet: KmsWalletClient, publicJwk?: SignatureJwk): Promise<KmsPrivateSignatureKey> {
        const jwk = publicJwk ?? await wallet.getPublicJwk();
        const algorithm = resolveJwkSignatureAlgorithm(jwk);
        JwkFilter.toPublicJwk(jwk, algorithm);
        const sanitized = sortJwkMembers({...JwkFilter.stripPrivateMembers(jwk).jwk});
        const signer: JwkSigner = {
            get privateKeyBytes(): Uint8Array {
                throw new Error(NON_EXPORTABLE);
            },
            sign: (data: Uint8Array) => wallet.signRaw(data),
        };
        return new KmsPrivateSignatureKey(
            algorithm, sanitized, signer, JwkSignatureScheme.forJwk(algorithm, sanitized),
            {walletId: wallet.walletId});
    }

    getKmsReference(): KmsWalletReference {
        return {...this.reference};
    }

    async getPublicKey(): Promise<KmsPublicSignatureKey> {
        return KmsPublicSignatureKey.fromKmsJwk(this.getPublicJwk(), this.reference);
    }

    getPrivateJwk(): SignatureJwk {
        throw new Error(NON_EXPORTABLE);
    }

    getPrivateKeyAsBytes(): Uint8Array {
        throw new Error(NON_EXPORTABLE);
    }

    getRawPrivateKeyBytes(): Uint8Array {
        throw new Error(NON_EXPORTABLE);
    }
}
