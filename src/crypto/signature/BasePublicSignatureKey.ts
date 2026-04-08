import {PublicSignatureKey} from "./PublicSignatureKey";
import {EncoderFactory, EncoderInterface} from "../../utils/encoder";
import {SignatureScheme} from "./SignatureScheme";

import {SignatureSchemeId} from "./SignatureSchemeId";

/**
 * Abstract class representing the base implementation of a public signature key.
 * This class provides a partial implementation for handling public keys and signing operations.
 * It serves as a foundation for specific public signature key implementations.
 */
export abstract class BasePublicSignatureKey implements PublicSignatureKey {
    async getPublicKeyAsString(encoder: EncoderInterface<Uint8Array, string> = EncoderFactory.defaultBytesToStringEncoder()): Promise<string> {
        return encoder.encode(await this.getPublicKeyAsBytes());
    }

    abstract getPublicKeyAsBytes(): Promise<Uint8Array>;

    abstract verify(data: Uint8Array, signature: Uint8Array): Promise<boolean>;

    abstract getScheme(): SignatureScheme;

    getSignatureSize(): number {
        return this.getScheme().getSignatureSize();
    }

    getSignatureSchemeId(): SignatureSchemeId {
        return this.getScheme().getSignatureSchemeId();
    }

    /**
     * @deprecated Use getSignatureSchemeId instead.
     *
     * @returns
     */
    getSignatureAlgorithmId(): SignatureSchemeId {
        return this.getSignatureSchemeId()
    }
}