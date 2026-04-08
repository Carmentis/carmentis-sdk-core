import {ISignatureEncoderHandler} from "../ISignatureEncoderHandler";
import {PrivateSignatureKey} from "../../../signature/PrivateSignatureKey";
import {PublicSignatureKey} from "../../../signature/PublicSignatureKey";
import {HCVCodec} from "../../../../utils/HCVCodec";
import {EncoderFactory} from "../../../../utils/encoder";

const SIGNATURE_KEY = "SIG";
const SK_SIGNATURE_KEY = "SK";
const PK_SIGNATURE_KEY = "PK";

/**
 * Base class for HCV signature encoders.
 * Provides common functionality for encoding signature keys into HCV format.
 *
 * HCV (Hierarchical Colon Value) format uses a structured encoding with labels
 * to identify the type of key and its algorithm. For example:
 * SIG:SECP256K1:PK:<base64_public_key>
 */
export abstract class BaseHCVSignatureEncoder implements ISignatureEncoderHandler {
    protected bytesEncoder = EncoderFactory.bytesToHexEncoder();

    /**
     * Creates a new BaseHCVSignatureEncoder.
     *
     * @param labels - The hierarchical labels used to identify this signature type in HCV format
     */
    constructor(protected readonly labels: string[]) {}

    abstract isAcceptingPublicKeyEncodingRequest(publicKey: PublicSignatureKey): Promise<boolean>;
    abstract isAcceptingPrivateKeyEncodingRequest(privateKey: PrivateSignatureKey): Promise<boolean>;

    abstract encodePrivateKey(privateKey: PrivateSignatureKey): Promise<string>;

    /**
     * Encodes a public signature key into HCV format.
     * The public key bytes are base64-encoded and prefixed with the appropriate HCV labels.
     *
     * @param publicKey - The public key to encode
     * @returns The HCV-encoded public key string
     */
    async encodePublicKey(publicKey: PublicSignatureKey): Promise<string> {
        return HCVCodec.encode(
            ...this.getHCVPublicKeyEncodingPrefix(),
            this.bytesEncoder.encode(await publicKey.getPublicKeyAsBytes())
        )
    }

    /**
     * Gets the HCV prefix labels for encoding private keys.
     *
     * @returns An array of labels: [SIG, ...algorithm_labels, SK]
     * @protected
     */
    protected getHCVPrivateKeyEncodingPrefix() {
        return [
            SIGNATURE_KEY,
            ...this.labels,
            SK_SIGNATURE_KEY,
        ]
    }

    /**
     * Gets the HCV prefix labels for encoding public keys.
     *
     * @returns An array of labels: [SIG, ...algorithm_labels, PK]
     * @protected
     */
    protected getHCVPublicKeyEncodingPrefix() {
        return [
            SIGNATURE_KEY,
            ...this.labels,
            PK_SIGNATURE_KEY,
        ]
    }
}
