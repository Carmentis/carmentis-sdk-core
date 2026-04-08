import {EncoderInterface} from "../../../utils/encoder";
import {AbstractPrivateDecryptionKey, AbstractPublicEncryptionKey} from "./PublicKeyEncryptionSchemeInterface";

export interface PublicEncryptionKeyEncoderInterface extends EncoderInterface<AbstractPublicEncryptionKey, string> {}
export interface PrivateDecryptionKeyEncoderInterface extends EncoderInterface<AbstractPrivateDecryptionKey, string> {}
export interface PkeEncoderInterface {
    encodePublicEncryptionKey(key: AbstractPublicEncryptionKey): Promise<string>;
    encodePrivateDecryptionKey(key: AbstractPrivateDecryptionKey): Promise<string>;
    decodePublicEncryptionKey(key: string): Promise<AbstractPublicEncryptionKey>;
    decodePrivateDecryptionKey(key: string): Promise<AbstractPrivateDecryptionKey>;
}