import {ExportedKey, KeyType} from "../../type/valibot/walletExport/WalletExportSchema";
import {PrivateSignatureKey} from "../../crypto/signature/PrivateSignatureKey";
import {CryptoSchemeFactory} from "../../crypto/CryptoSchemeFactory";
import {JwkPrivateSignatureKey} from "../../crypto/signature/jwk/JwkPrivateSignatureKey";
import {Base64} from "../../data/base64";
import {WalletCrypto} from "../WalletCrypto";

/** Conversions between exported keys and the SDK key objects. */
export const ExportedWalletMapper = {
    seedKey(schemeId: number, seed: Uint8Array, passphrase?: string): ExportedKey {
        return {
            keyType: KeyType.SEED,
            schemeId,
            seed: Base64.encodeBinary(seed, Base64.BASE64, true),
            ...(passphrase === undefined ? {} : {passphrase}),
        };
    },

    seedKeyFromWallet(wallet: WalletCrypto, schemeId: number): ExportedKey {
        return ExportedWalletMapper.seedKey(schemeId, wallet.getSeedAsBytes());
    },

    jwkKey(key: JwkPrivateSignatureKey): ExportedKey {
        return {keyType: KeyType.JWK, jwk: {...key.getPrivateJwk()} as { kty: string }};
    },

    async toPrivateSignatureKey(key: ExportedKey): Promise<PrivateSignatureKey> {
        switch (key.keyType) {
            case KeyType.SEED:
                return CryptoSchemeFactory.createPrivateSignatureKey(key.schemeId, Base64.decodeBinary(key.seed, Base64.BASE64));
            case KeyType.JWK:
                return JwkPrivateSignatureKey.fromJwk(key.jwk as any);
            default: {
                const unsupported: never = key;
                throw new Error(`Unsupported exported key type: ${JSON.stringify(unsupported)}`);
            }
        }
    },
};
