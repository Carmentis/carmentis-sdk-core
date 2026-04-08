import {ml_dsa65} from "@noble/post-quantum/ml-dsa";
import {randomBytes} from "@noble/post-quantum/utils";
import {EncoderFactory, EncoderInterface} from "../../utils/encoder";
import {SignatureScheme} from "./SignatureScheme";
import {BasePrivateSignatureKey} from "./BasePrivateSignatureKey";
import {BasePublicSignatureKey} from "./BasePublicSignatureKey";
import {SignatureSchemeId} from "./SignatureSchemeId";

export class MLDSA65SignatureScheme implements SignatureScheme {
    private static SIGNATURE_SIZE = 3311;

    getSignatureSchemeId(): number {
        return SignatureSchemeId.ML_DSA_65;
    }

    getSignatureSize(): number {
        return MLDSA65SignatureScheme.SIGNATURE_SIZE;
    }

    getSignatureAlgorithmId(): SignatureSchemeId {
        return this.getSignatureSchemeId()
    }

    expectedSeedSize() {
        return 32;
    }
}

/**
 * Represents a public signature key for the MLDSA65 signature scheme.
 *
 * This class provides functionalities to verify digital signatures and retrieve
 * the raw public key used in the signing process. It extends the `MLDSA44SignatureScheme`
 * and implements the `PublicSignatureKey` interface.
 */
export class MLDSA65PublicSignatureKey extends BasePublicSignatureKey {
    /**
     * Constructs an instance of the class.
     *
     * @param {Uint8Array} publicKey - The public key used for initialization.
     * @return {void} This constructor does not return a value.
     */
    constructor(protected publicKey: Uint8Array) {
        super();
    }

    async getPublicKeyAsString(encoder: EncoderInterface<Uint8Array, string> = EncoderFactory.defaultBytesToStringEncoder()): Promise<string> {
        return encoder.encode(await this.getPublicKeyAsBytes())
    }

    /**
     * Verifies the provided data and its signature using the stored public key.
     *
     * @param {Uint8Array} data - The data to be verified.
     * @param {Uint8Array} signature - The signature of the data to be verified.
     * @return {boolean} Returns true if the verification is successful, otherwise false.
     */
    async verify(data: Uint8Array, signature: Uint8Array): Promise<boolean> {
        return ml_dsa65.verify(
            this.publicKey,
            data,
            signature
        );
    }

    /**
     * Retrieves the raw public key as a Uint8Array.
     *
     * @return {Uint8Array} The public key in its raw byte form.
     */
    async getPublicKeyAsBytes(): Promise<Uint8Array> {
        return this.publicKey;
    }

    getScheme(): SignatureScheme {
        return new MLDSA65SignatureScheme();
    }
}

/**
 * Represents a private signature key for the MLDSA65 signature scheme.
 */
export class MLDSA65PrivateSignatureKey extends BasePrivateSignatureKey {
    /**
     * Generates and returns a new private signature key.
     *
     * This method creates a private signature key instance using a randomly generated 32-byte seed.
     *
     * @return {MLDSA65PrivateSignatureKey} A new instance of MLDSA65PrivateSignatureKey initialized with a randomly generated seed.
     */
    public static async gen(): Promise<MLDSA65PrivateSignatureKey> {
        const seed = randomBytes(32);
        return new MLDSA65PrivateSignatureKey(seed);
    }

    private verificationKey: Uint8Array;
    private signatureKey: Uint8Array;

    getPrivateKeyAsString(encoder: EncoderInterface<Uint8Array, string>): string {
        return encoder.encode(this.getPrivateKeyAsBytes())
    }

    /**
     * Constructs a new instance of the class, initializes the public and private keys
     * using the provided seed value.
     *
     * @param {Uint8Array} seed - The seed value used to generate key pairs.
     * @return {void}
     */
    constructor(private seed: Uint8Array) {
        super();
        const keys = ml_dsa65.keygen(seed);
        this.signatureKey = keys.secretKey;
        this.verificationKey = keys.publicKey;
    }

    /**
     * Retrieves the public signature key associated with this instance.
     *
     * @return {MLDSA65PublicSignatureKey} The public signature key.
     */
    async getPublicKey(): Promise<MLDSA65PublicSignatureKey> {
        return new MLDSA65PublicSignatureKey(this.verificationKey);
    }

    getPrivateKeyAsBytes(): Uint8Array {
        return this.seed;
    }

    /**
     * Signs the provided data using the signature key.
     *
     * @param {Uint8Array} data - The data to be signed.
     * @return {Promise<Uint8Array>} The generated signature for the provided data.
     */
    async sign(data: Uint8Array): Promise<Uint8Array> {
        return ml_dsa65.sign(
            this.signatureKey,
            data
        );
    }

    getScheme(): SignatureScheme {
        return new MLDSA65SignatureScheme();
    }
}
