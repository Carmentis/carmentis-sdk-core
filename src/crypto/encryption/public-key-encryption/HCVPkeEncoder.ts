import {PkeEncoderInterface} from "./PkeEncoderInterface";
import {AbstractPrivateDecryptionKey, AbstractPublicEncryptionKey} from "./PublicKeyEncryptionSchemeInterface";
import {EncoderFactory, EncoderInterface} from "../../../utils/encoder";
import {HCVCodec} from "../../../utils/HCVCodec";
import {CryptoSchemeFactory} from "../../CryptoSchemeFactory";
import {PublicKeyEncryptionSchemeId} from "./PublicKeyEncryptionSchemeId";

export class HCVPkeEncoder implements PkeEncoderInterface {
    private static PKE_KEY = "PKE";
    private static SK_PKE_KEY = "SK";
    private static PK_PKE_KEY = "PK";

    private static readonly PKE_SCHEMES = [
        { algoId: PublicKeyEncryptionSchemeId.ML_KEM_768_AES_256_GCM, label: "MLKEM768AES256GCM" },
    ];

    static createHexHCVPkeEncoder() {
        return new HCVPkeEncoder(EncoderFactory.bytesToHexEncoder());
    }

    static createBase64HCVPkeEncoder() {
        return new HCVPkeEncoder(EncoderFactory.bytesToBase64Encoder());
    }

    constructor(private readonly  stringEncoder: EncoderInterface<Uint8Array, string>) {}

    async decodePrivateDecryptionKey(privateKey: string): Promise<AbstractPrivateDecryptionKey> {
        const result = HCVCodec.decode(privateKey);
        for (const {algoId, label} of HCVPkeEncoder.PKE_SCHEMES) {
            const matches = result.matchesKeys(
                HCVPkeEncoder.PKE_KEY,
                label,
                HCVPkeEncoder.SK_PKE_KEY
            );
            if (matches) {
                return await CryptoSchemeFactory.createPrivateDecryptionKey(algoId, this.stringEncoder.decode(result.getValue()));
            }
        }
        throw new Error("Invalid private key format: no scheme key found");
    }

    async decodePublicEncryptionKey(publicKey: string): Promise<AbstractPublicEncryptionKey> {
        const result = HCVCodec.decode(publicKey);
        for (const {algoId, label} of HCVPkeEncoder.PKE_SCHEMES) {
            const matches = result.matchesKeys(
                HCVPkeEncoder.PKE_KEY,
                label,
                HCVPkeEncoder.PK_PKE_KEY
            );
            if (matches) {
                return CryptoSchemeFactory.createPublicEncryptionKey(algoId, this.stringEncoder.decode(result.getValue()));
            }
        }
        throw new Error("Invalid private key format: no scheme key found");
    }

    async encodePrivateDecryptionKey(privateKey: AbstractPrivateDecryptionKey): Promise<string> {
        // Note: we currently only support the ML-KEM scheme
        return HCVCodec.encode(
            HCVPkeEncoder.PKE_KEY,
            "MLKEM768AES256GCM",
            HCVPkeEncoder.SK_PKE_KEY,
            this.stringEncoder.encode(privateKey.getRawPrivateKey())
        )
    }

    async encodePublicEncryptionKey(key: AbstractPublicEncryptionKey): Promise<string> {
        return HCVCodec.encode(
            HCVPkeEncoder.PKE_KEY,
            "MLKEM768AES256GCM",
            HCVPkeEncoder.PK_PKE_KEY,
            this.stringEncoder.encode(await key.getRawPublicKey())
        )
    }
}
