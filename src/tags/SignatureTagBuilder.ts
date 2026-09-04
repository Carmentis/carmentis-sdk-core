import {SignatureTag} from "../type/tags/SignatureTag";
import {SignatureTagHandler} from "./SignatureTagHandler";
import {encodeSignatureTagPayload} from "./SignatureTagPayload";
import {PrivateSignatureKey} from "../crypto/signature/PrivateSignatureKey";
import {SignatureEncoderInterface} from "../crypto/encoder/signature/SignatureEncoderInterface";
import {CryptoEncoderFactory} from "../crypto/encoder/CryptoEncoderFactory";

type SignatureTagMetadata = SignatureTag['metadata'];

/**
 * Builds a signature tag member by member, then signs it.
 *
 * The title, the message, the origin, the request date and the signed data are required;
 * the builder refuses to sign a tag missing any of them. Every other member is optional,
 * apart from the signing date, which defaults to the moment the tag is signed.
 */
export class SignatureTagBuilder {
    static create(): SignatureTagBuilder {
        return new SignatureTagBuilder();
    }

    private metadata: Partial<SignatureTagMetadata> = {};
    private data?: unknown;
    private path?: string;

    setTitle(title: string): this {
        this.metadata.title = title;
        return this;
    }

    setMessage(message: string): this {
        this.metadata.message = message;
        return this;
    }

    setOrigin(origin: string): this {
        this.metadata.origin = origin;
        return this;
    }

    setRequestedAt(requestedAt: Date | string): this {
        this.metadata.requestedAt = SignatureTagBuilder.asDateString(requestedAt);
        return this;
    }

    setSignedAt(signedAt: Date | string): this {
        this.metadata.signedAt = SignatureTagBuilder.asDateString(signedAt);
        return this;
    }

    setNotValidBefore(notValidBefore: Date | string): this {
        this.metadata.notValidBefore = SignatureTagBuilder.asDateString(notValidBefore);
        return this;
    }

    setNotValidAfter(notValidAfter: Date | string): this {
        this.metadata.notValidAfter = SignatureTagBuilder.asDateString(notValidAfter);
        return this;
    }

    setAllowOnChain(allowOnChain: boolean): this {
        this.metadata.allowOnChain = allowOnChain;
        return this;
    }

    setOrganizationId(organizationId: string): this {
        this.metadata.organizationId = organizationId;
        return this;
    }

    setApplicationId(applicationId: string): this {
        this.metadata.applicationId = applicationId;
        return this;
    }

    setApplicationLedgerId(applicationLedgerId: string): this {
        this.metadata.applicationLedgerId = applicationLedgerId;
        return this;
    }

    setLatestMicroblockHash(latestMicroblockHash: string): this {
        this.metadata.latestMicroblockHash = latestMicroblockHash;
        return this;
    }

    /**
     * Holds the signed data in the tag itself, dropping any path set before: a tag holds
     * either the data or the path to it.
     *
     * @param {unknown} data - The data to embed, which has to be JSON data.
     */
    setEmbeddedData(data: unknown): this {
        this.data = data;
        this.path = undefined;
        return this;
    }

    /**
     * Refers to the signed data by its path rather than holding it, dropping any data set
     * before: a tag holds either the data or the path to it.
     *
     * @param {string} path - The path at which the signed data is to be found.
     */
    setReferencedData(path: string): this {
        this.path = path;
        this.data = undefined;
        return this;
    }

    /**
     * Signs the tag with the given key and returns a handler over the signed tag.
     *
     * The signature covers the whole tag but the signature itself, the public key of the
     * signer included, so that neither the metadata, the data nor the key can be swapped
     * for another without invalidating it.
     *
     * @param {PrivateSignatureKey} privateKey - The key to sign the tag with.
     * @param {SignatureEncoderInterface<string>} encoder - The encoder to encode the key and the signature with.
     * @return {Promise<SignatureTagHandler>} A handler over the signed tag.
     * @throws {Error} If a required member has not been set.
     */
    async signWith(
        privateKey: PrivateSignatureKey,
        encoder: SignatureEncoderInterface<string> = CryptoEncoderFactory.defaultStringSignatureEncoder()
    ): Promise<SignatureTagHandler> {
        const unsigned = {
            metadata: this.buildMetadata(),
            ...this.buildData(),
            pk: await encoder.encodePublicKey(await privateKey.getPublicKey()),
        };
        const signature = await privateKey.sign(encodeSignatureTagPayload(unsigned));

        // Parsed back rather than handed over as built, so that a tag no schema accepts
        // is reported here rather than by whoever receives it.
        return SignatureTagHandler.fromObject({
            ...unsigned,
            signature: encoder.encodeSignature(signature),
        });
    }

    private buildMetadata(): SignatureTagMetadata {
        return {
            title: this.getRequiredMember('title', 'a title'),
            message: this.getRequiredMember('message', 'a message'),
            origin: this.getRequiredMember('origin', 'an origin'),
            requestedAt: this.getRequiredMember('requestedAt', 'a request date'),
            signedAt: this.metadata.signedAt ?? new Date().toISOString(),

            // Members left unset stay out of the tag entirely: an absent member and a member
            // holding `undefined` have to lead to the same signed payload.
            ...(this.metadata.notValidBefore !== undefined && {notValidBefore: this.metadata.notValidBefore}),
            ...(this.metadata.notValidAfter !== undefined && {notValidAfter: this.metadata.notValidAfter}),
            ...(this.metadata.allowOnChain !== undefined && {allowOnChain: this.metadata.allowOnChain}),
            ...(this.metadata.organizationId !== undefined && {organizationId: this.metadata.organizationId}),
            ...(this.metadata.applicationId !== undefined && {applicationId: this.metadata.applicationId}),
            ...(this.metadata.applicationLedgerId !== undefined && {applicationLedgerId: this.metadata.applicationLedgerId}),
            ...(this.metadata.latestMicroblockHash !== undefined && {latestMicroblockHash: this.metadata.latestMicroblockHash}),
        };
    }

    private getRequiredMember(name: 'title' | 'message' | 'origin' | 'requestedAt', description: string): string {
        const member = this.metadata[name];
        if (member === undefined) {
            throw new Error(`cannot sign a signature tag without ${description}`);
        }
        return member;
    }

    /**
     * Returns the signed data of the tag, as the member holding it: `data` when the data is
     * embedded, `path` when it is referenced.
     *
     * @throws {Error} If neither has been set.
     */
    private buildData(): Pick<SignatureTag, 'data'> | Pick<SignatureTag, 'path'> {
        if (this.data !== undefined) {
            return {data: this.data};
        }
        if (this.path !== undefined) {
            return {path: this.path};
        }
        throw new Error('cannot sign a signature tag without data, either embedded or referenced by its path');
    }

    private static asDateString(date: Date | string): string {
        return date instanceof Date ? date.toISOString() : date;
    }
}
