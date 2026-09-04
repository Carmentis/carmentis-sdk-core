import {SignatureTag, SignatureTagSchema} from "../type/tags/SignatureTag";
import * as v from 'valibot'
import {SignatureEncoderInterface} from "../crypto/encoder/signature/SignatureEncoderInterface";
import {CryptoEncoderFactory} from "../crypto/encoder/CryptoEncoderFactory";
import {PublicSignatureKey} from "../crypto/signature/PublicSignatureKey";

export type SignatureTagMetadata = SignatureTag['metadata'];

export class SignatureTagHandler {
    static fromObject(obj: unknown): SignatureTagHandler {
        return new SignatureTagHandler(
            v.parse(SignatureTagSchema, obj)
        )
    }

    constructor(
        private readonly signatureTag: SignatureTag
    ) {}

    /**
     * Returns the underlying tag, as it was parsed.
     */
    toObject(): SignatureTag {
        return this.signatureTag;
    }

    getMetadata(): SignatureTagMetadata {
        return this.signatureTag.metadata;
    }

    getTitle(): string {
        return this.signatureTag.metadata.title;
    }

    getMessage(): string {
        return this.signatureTag.metadata.message;
    }

    getOrigin(): string {
        return this.signatureTag.metadata.origin;
    }

    getRequestedAt(): string {
        return this.signatureTag.metadata.requestedAt;
    }

    getSignedAt(): string {
        return this.signatureTag.metadata.signedAt;
    }

    getNotValidBefore(): string | undefined {
        return this.signatureTag.metadata.notValidBefore;
    }

    getNotValidAfter(): string | undefined {
        return this.signatureTag.metadata.notValidAfter;
    }

    /**
     * Whether the signature may be anchored on chain. A tag saying nothing about it does not allow it.
     */
    isOnChainAllowed(): boolean {
        return this.signatureTag.metadata.allowOnChain === true;
    }

    getOrganizationId(): string | undefined {
        return this.signatureTag.metadata.organizationId;
    }

    getApplicationId(): string | undefined {
        return this.signatureTag.metadata.applicationId;
    }

    getApplicationLedgerId(): string | undefined {
        return this.signatureTag.metadata.applicationLedgerId;
    }

    getLatestMicroblockHash(): string | undefined {
        return this.signatureTag.metadata.latestMicroblockHash;
    }

    /**
     * Whether the tag holds the signed data itself, rather than the path to it.
     */
    isEmbeddedData(): boolean {
        return this.signatureTag.data !== undefined;
    }

    /**
     * Whether the tag holds the path to the signed data, rather than the data itself.
     */
    isReferencedData(): boolean {
        return this.signatureTag.path !== undefined;
    }

    /**
     * Returns the data the tag holds.
     *
     * @throws {Error} If the tag references its data instead of embedding it.
     */
    getEmbeddedData(): unknown {
        if (!this.isEmbeddedData()) {
            throw new Error('the tag does not embed its data, it references it by its path');
        }
        return this.signatureTag.data;
    }

    /**
     * Returns the path at which the signed data is to be found.
     *
     * @throws {Error} If the tag embeds its data instead of referencing it.
     */
    getReferencedDataPath(): string {
        const path = this.signatureTag.path;
        if (path === undefined) {
            throw new Error('the tag does not reference its data by a path, it embeds the data itself');
        }
        return path;
    }

    getEncodedPublicKey(): string {
        return this.signatureTag.pk;
    }

    /**
     * Decodes the public key of the signer.
     *
     * @param {SignatureEncoderInterface<string>} encoder - The encoder the key was encoded with.
     * @return {Promise<PublicSignatureKey>} The decoded public key.
     */
    getPublicKey(
        encoder: SignatureEncoderInterface<string> = CryptoEncoderFactory.defaultStringSignatureEncoder()
    ): Promise<PublicSignatureKey> {
        return encoder.decodePublicKey(this.signatureTag.pk);
    }

    getEncodedSignature(): string {
        return this.signatureTag.signature;
    }

    /**
     * Decodes the signature of the tag.
     *
     * @param {SignatureEncoderInterface<string>} encoder - The encoder the signature was encoded with.
     * @return {Uint8Array} The decoded signature.
     */
    getSignature(
        encoder: SignatureEncoderInterface<string> = CryptoEncoderFactory.defaultStringSignatureEncoder()
    ): Uint8Array {
        return encoder.decodeSignature(this.signatureTag.signature);
    }
}
