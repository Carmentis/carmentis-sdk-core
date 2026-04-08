import {PkeEncoderInterface} from "./PkeEncoderInterface";
import {HCVPkeEncoder} from "./HCVPkeEncoder";


/**
 * Factory class for creating PKE (Public Key Encryption) encoders.
 */
export class PkeEncoderFactory {
    /**
     * Returns the default encoder instance configured as a Base64 HCVPkeEncoder.
     *
     * @return {PkeEncoderInterface} The default encoder implementing the PkeEncoderInterface.
     */
    static defaultEncoder(): PkeEncoderInterface {
        return HCVPkeEncoder.createBase64HCVPkeEncoder();
    }
}