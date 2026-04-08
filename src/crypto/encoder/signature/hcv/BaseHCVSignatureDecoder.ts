import {ISignatureDecodeHandler} from "../ISignatureEncoderHandler";
import {PrivateSignatureKey} from "../../../signature/PrivateSignatureKey";
import {PublicSignatureKey} from "../../../signature/PublicSignatureKey";
import {HCVCodec} from "../../../../utils/HCVCodec";
import {EncoderFactory} from "../../../../utils/encoder";
import {Logger} from "../../../../utils/Logger";

const SIGNATURE_KEY = "SIG";
const SK_SIGNATURE_KEY = "SK";
const PK_SIGNATURE_KEY = "PK";

/**
 * Base class for HCV signature decoders.
 * Provides common functionality for decoding signature keys encoded in HCV format.
 *
 * HCV (Hierarchical Colon Value) format uses a structured encoding with labels
 * to identify the type of key and its algorithm.
 */
export abstract class BaseHCVSignatureDecoder implements ISignatureDecodeHandler {

    private static logger = Logger.getLogger(["HCVSignatureDecoder"])
    protected bytesEncoder = EncoderFactory.bytesToHexEncoder();

    /**
     * Creates a new BaseHCVSignatureDecoder.
     *
     * @param labels - The hierarchical labels used to identify this signature type in HCV format
     */
    constructor(private readonly labels: string[]) {

    }

    abstract decodePrivateKey(encodedPrivateKey: string): Promise<PrivateSignatureKey>;
    abstract decodePublicKey(encodedPublicKey: string): Promise<PublicSignatureKey>;

    /**
     * Checks if this decoder can handle the given encoded private key.
     * Verifies that the HCV structure matches the expected labels for this decoder.
     *
     * @param encodedPrivateKey - The HCV-encoded private key string
     * @returns True if this decoder can handle the key, false otherwise
     */
    async isAcceptingPrivateKeyDecodingRequest(encodedPrivateKey: string): Promise<boolean> {
       try {
           const result = HCVCodec.decode(encodedPrivateKey);
           BaseHCVSignatureDecoder.logger.debug(`Attempt to decode private key for ${this.labels}: found ${result.getKeys()}`)
           return result.matchesKeys(
               SIGNATURE_KEY,
               ...this.labels,
               SK_SIGNATURE_KEY
           );
       } catch (e) {
           BaseHCVSignatureDecoder.logger.debug(`Fail to decode private key for ${this.labels}: ${e}`)
           return false;
       }
    }

    /**
     * Checks if this decoder can handle the given encoded public key.
     * Verifies that the HCV structure matches the expected labels for this decoder.
     *
     * @param encodedPublicKey - The HCV-encoded public key string
     * @returns True if this decoder can handle the key, false otherwise
     */
    async isAcceptingPublicKeyDecodingRequest(encodedPublicKey: string): Promise<boolean> {
        try {
            const result = HCVCodec.decode(encodedPublicKey);
            return result.matchesKeys(
                SIGNATURE_KEY,
                ...this.labels,
                PK_SIGNATURE_KEY
            );
        } catch {
            return false;
        }
    }

    /**
     * Gets the signature key constant used in HCV encoding.
     * @internal
     */
    protected static getSignatureKey(): string {
        return SIGNATURE_KEY;
    }

    /**
     * Gets the secret key constant used in HCV encoding.
     * @internal
     */
    protected static getSkSignatureKey(): string {
        return SK_SIGNATURE_KEY;
    }

    /**
     * Gets the public key constant used in HCV encoding.
     * @internal
     */
    protected static getPkSignatureKey(): string {
        return PK_SIGNATURE_KEY;
    }
}
