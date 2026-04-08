import {PublicSignatureKey} from "../../signature/PublicSignatureKey";
import {PrivateSignatureKey} from "../../signature/PrivateSignatureKey";

export interface ISignatureEncoderHandler {
    isAcceptingPublicKeyEncodingRequest(publicKey: PublicSignatureKey): Promise<boolean>;
    isAcceptingPrivateKeyEncodingRequest(privateKey: PrivateSignatureKey): Promise<boolean>;
    encodePublicKey(publicKey: PublicSignatureKey): Promise<string>;
    encodePrivateKey(privateKey: PrivateSignatureKey): Promise<string>;
}

export interface ISignatureDecodeHandler {
    isAcceptingPublicKeyDecodingRequest(encodedPublicKey: string): Promise<boolean>;
    isAcceptingPrivateKeyDecodingRequest(encodedPrivateKey: string): Promise<boolean>;
    decodePublicKey(encodedPublicKey: string): Promise<PublicSignatureKey>;
    decodePrivateKey(encodedPrivateKey: string): Promise<PrivateSignatureKey>;
}