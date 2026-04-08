import {BaseHCVSignatureEncoder} from "./BaseHCVSignatureEncoder";
import {PrivateSignatureKey} from "../../../signature/PrivateSignatureKey";
import {PublicSignatureKey} from "../../../signature/PublicSignatureKey";
import {HCVCodec} from "../../../../utils/HCVCodec";
import {
    PkmsSecp256k1PrivateSignatureKey,
    PkmsSecp256k1PublicSignatureKey
} from "../../../signature/pkms/PkmsSecp256k1PrivateSignatureKey";

/**
 * HCV encoder for PKMS (Public Key Management Service) Secp256k1 signature keys.
 *
 * Handles the encoding of Secp256k1 keys managed by a PKMS service into HCV format.
 * Unlike native key storage, PKMS private keys encode only the key identifier (keyId),
 * while the actual cryptographic material is stored securely in the PKMS service.
 *
 * The generated HCV format is:
 * - SIG:PKMS:SECP256K1:SK:<keyId> for private keys
 * - SIG:PKMS:SECP256K1:PK:<base64_public_key> for public keys
 */
export class PkmsSecp256k1SignatureEncoder extends BaseHCVSignatureEncoder {

    /**
     * Creates a new PkmsSecp256k1SignatureEncoder instance.
     */
    constructor() {
        super([
            "PKMS",
            "SECP256K1"
        ]);
    }

    /**
     * Checks if this encoder can handle the given private key.
     *
     * @param privateKey - The private key to check
     * @returns True if the key is a PkmsSecp256k1PrivateSignatureKey
     */
    async isAcceptingPrivateKeyEncodingRequest(privateKey: PrivateSignatureKey): Promise<boolean> {
        return privateKey instanceof PkmsSecp256k1PrivateSignatureKey;
    }

    /**
     * Checks if this encoder can handle the given public key.
     *
     * @param publicKey - The public key to check
     * @returns True if the key is a PkmsSecp256k1PublicSignatureKey
     */
    async isAcceptingPublicKeyEncodingRequest(publicKey: PublicSignatureKey): Promise<boolean> {
        return publicKey instanceof PkmsSecp256k1PublicSignatureKey;
    }

    /**
     * Encodes a PKMS private key into HCV format.
     * Only the key identifier is encoded, not the actual key material.
     *
     * @param privateKey - The PKMS private key to encode
     * @returns The HCV-encoded key identifier
     * @throws Error if the key is not a PkmsSecp256k1PrivateSignatureKey
     */
    async encodePrivateKey(privateKey: PrivateSignatureKey): Promise<string> {
        if (!(privateKey instanceof PkmsSecp256k1PrivateSignatureKey)) throw new Error("Invalid private key type: " + privateKey.constructor.name);
        const keyId = privateKey.getKeyId();
        return HCVCodec.encode(
            ...this.getHCVPrivateKeyEncodingPrefix(),
            keyId
        )
    }
}
