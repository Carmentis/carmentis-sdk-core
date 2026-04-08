import {PrivateSignatureKey} from "../../../signature/PrivateSignatureKey";
import {PublicSignatureKey} from "../../../signature/PublicSignatureKey";
import {NativeHCVSignatureDecoder} from "./NativeHCVSignatureDecoder";
import {Secp256k1PublicSignatureKey} from "../../../signature/secp256k1/Secp256k1PublicSignatureKey";
import {Secp256k1PrivateSignatureKey} from "../../../signature/secp256k1/Secp256k1PrivateSignatureKey";

export class Secp256k1HCVSignatureDecoder extends NativeHCVSignatureDecoder {
    private static label = "SECP256K1"

    constructor() {
        super([Secp256k1HCVSignatureDecoder.label]);
    }

    protected bootstrapPrivateKey(privateKeyBytes: Uint8Array): PrivateSignatureKey {
        return new Secp256k1PrivateSignatureKey(privateKeyBytes);
    }

    protected bootstrapPublicKey(publicKeyBytes: Uint8Array): PublicSignatureKey {
        return new Secp256k1PublicSignatureKey(publicKeyBytes);
    }
}


