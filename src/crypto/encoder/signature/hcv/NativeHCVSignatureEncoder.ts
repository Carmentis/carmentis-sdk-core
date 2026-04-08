import {BaseHCVSignatureEncoder} from "./BaseHCVSignatureEncoder";
import {PrivateSignatureKey} from "../../../signature/PrivateSignatureKey";
import {PublicSignatureKey} from "../../../signature/PublicSignatureKey";
import {HCVCodec} from "../../../../utils/HCVCodec";

/**
 * Abstract encoder for native (non-PKMS) signature keys into HCV format.
 *
 * This encoder handles keys where the raw cryptographic material is encoded directly
 * into the HCV format, as opposed to keys stored in a key management service.
 *
 * Subclasses must implement the acceptance methods to determine which key types
 * they can encode.
 */
export abstract class NativeHCVSignatureEncoder extends BaseHCVSignatureEncoder {

    /**
     * Creates a new NativeHCVSignatureEncoder.
     *
     * @param labels - The hierarchical labels used to identify this signature type in HCV format
     */
    constructor(labels: string[]) {
        super(labels);
    }

    /**
     * Encodes a private signature key into HCV format.
     * The private key bytes are base64-encoded and prefixed with the appropriate HCV labels.
     *
     * @param privateKey - The private key to encode
     * @returns The HCV-encoded private key string
     */
    async encodePrivateKey(privateKey: PrivateSignatureKey): Promise<string> {
        return HCVCodec.encode(
            ...this.getHCVPrivateKeyEncodingPrefix(),
            this.bytesEncoder.encode(privateKey.getPrivateKeyAsBytes())
        )
    }

    abstract isAcceptingPrivateKeyEncodingRequest(privateKey: PrivateSignatureKey): Promise<boolean>;
    abstract isAcceptingPublicKeyEncodingRequest(publicKey: PublicSignatureKey): Promise<boolean>;
}
