import {PrivateSignatureKey} from "./PrivateSignatureKey";
import {SignatureScheme} from "./SignatureScheme";
import {PublicSignatureKey} from "./PublicSignatureKey";
import {EncoderFactory, EncoderInterface} from "../../utils/encoder";

import {SignatureSchemeId} from "./SignatureSchemeId";

/**
 * Abstract base class representing a private signature key. It provides
 * methods for retrieving the private key, generating signatures, and
 * accessing associated metadata and functionalities related to the
 * signature scheme.
 */
export abstract class BasePrivateSignatureKey implements PrivateSignatureKey {
    abstract getPrivateKeyAsBytes(): Uint8Array;

    abstract sign(data: Uint8Array): Promise<Uint8Array>;

    abstract getScheme(): SignatureScheme;

    abstract getPublicKey(): Promise<PublicSignatureKey>;

    getPrivateKeyAsString(encoder: EncoderInterface<Uint8Array, string> = EncoderFactory.defaultBytesToStringEncoder()): string {
        return encoder.encode(this.getPrivateKeyAsBytes())
    }

    getSignatureSchemeId(): SignatureSchemeId {
        return this.getScheme().getSignatureSchemeId();
    }

    getSignatureSize(): number {
        return this.getScheme().getSignatureSize();
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