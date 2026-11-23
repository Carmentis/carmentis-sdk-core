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
import {CarmentisKmsClient} from "./CarmentisKmsClient";
import {KmsPublicSignatureKey} from "./KmsPublicSignatureKey";
import {KmsKeyReference} from "./KmsTypes";

const NON_EXPORTABLE = "This key is managed by a Carmentis KMS: its private material never leaves the server";

/**
 * Private signature key held by a Carmentis KMS.
 *
 * It behaves like any {@link JwkPrivateSignatureKey}, with JWK scheme and JOSE-style
 * signatures, but {@link sign} is delegated to the KMS and the private material can't be
 * exported. Signing requires a session whose key is an access key of the userspace.
 */
export class KmsPrivateSignatureKey extends JwkPrivateSignatureKey {
    protected constructor(
        algorithm: JwkSignatureAlgorithm,
        publicJwk: SignatureJwk,
        signer: JwkSigner,
        scheme: JwkSignatureScheme,
        private readonly client: CarmentisKmsClient,
        private readonly reference: KmsKeyReference,
    ) {
        // The base class holds the public JWK in place of the private one: there is none.
        super(algorithm, publicJwk, publicJwk, signer, scheme);
    }

    /** Wraps an existing KMS key. Only its public JWK is fetched. */
    static async fromKmsKey(params: {
        client: CarmentisKmsClient;
        userspaceId: string;
        keyId: string;
        /** Skips the public-key request when the JWK is already known. */
        publicJwk?: SignatureJwk;
    }): Promise<KmsPrivateSignatureKey> {
        const {client, userspaceId, keyId} = params;
        const reference = {userspaceId, keyId};
        const jwk = params.publicJwk ?? await client.getPublicJwk(userspaceId, keyId);
        const algorithm = resolveJwkSignatureAlgorithm(jwk);
        JwkFilter.toPublicJwk(jwk, algorithm);
        const publicJwk = sortJwkMembers({...JwkFilter.stripPrivateMembers(jwk).jwk});
        const signer: JwkSigner = {
            get privateKeyBytes(): Uint8Array {
                throw new Error(NON_EXPORTABLE);
            },
            sign: (data: Uint8Array) => client.signRaw(userspaceId, keyId, data),
        };
        return new KmsPrivateSignatureKey(
            algorithm, publicJwk, signer, JwkSignatureScheme.forJwk(algorithm, publicJwk), client, reference);
    }

    /** Creates a new server-managed key through a KMS plugin, and wraps it. */
    static async create(params: {
        client: CarmentisKmsClient;
        userspaceId: string;
        pluginId: string;
        label?: string;
        params?: Record<string, unknown>;
    }): Promise<KmsPrivateSignatureKey> {
        const key = await params.client.createKey(params.userspaceId, {
            pluginId: params.pluginId,
            label: params.label,
            params: params.params,
        });
        return KmsPrivateSignatureKey.fromKmsKey({
            client: params.client,
            userspaceId: params.userspaceId,
            keyId: key.id,
            publicJwk: key.publicJwk,
        });
    }

    getKmsReference(): KmsKeyReference {
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
