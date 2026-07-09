import {CryptoSchemeFactory} from "../crypto/CryptoSchemeFactory";
import {randomBytes} from "@noble/post-quantum/utils";
import {AccountCrypto} from "./AccountCrypto";
import {PublicKeyEncryptionSchemeId} from "../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeId";
import {BinaryToStringEncoderInterface} from "../utils/BinaryToStringEncoderInterface";
import {PrivateSignatureKey} from "../crypto/signature/PrivateSignatureKey";
import {SignatureSchemeId} from "../crypto/signature/SignatureSchemeId";
import {SeedEncoder} from "../utils/SeedEncoder";
import {IllegalParameterError} from "../errors/carmentis-error";

/**
 * The Wallet class is responsible for generating and managing cryptographic keys
 * based on a provided wallet seed. It provides methods to retrieve private signature
 * keys, decapsulation keys, and keys specific to virtual blockchains.
 */
export class WalletCrypto {


    /**
     * Generates a new Wallet instance using a randomly generated seed.
     *
     * @return {WalletCrypto} A new Wallet object created with a random seed.
     */
    static generateWallet(): WalletCrypto {
        const seed = randomBytes(64);
        return new WalletCrypto(seed);
    }

    static fromSeed(seed: Uint8Array): WalletCrypto {
        if (!(seed instanceof Uint8Array)) throw new IllegalParameterError(`Seed must be a Uint8Array, got ${typeof seed}`);
        return new WalletCrypto(seed);
    }

    static parseFromString(seed: string,  encoder: BinaryToStringEncoderInterface = new SeedEncoder()): WalletCrypto {
        if (typeof seed !== 'string') throw new IllegalParameterError(`Seed must be a string, got ${typeof seed}`);
        return new WalletCrypto(encoder.decode(seed));
    }

    encode( encoder: BinaryToStringEncoderInterface = new SeedEncoder()): string {
        return encoder.encode(this.walletSeed);
    }

    private constructor( private walletSeed: Uint8Array ) {}

    /**
     * Generates the default account (i.e., the account associated with nonce zero).
     */
    getDefaultAccountCrypto(): AccountCrypto {
        const defaultAccountNonce = 0;
        return AccountCrypto.createFromWalletSeedAndNonce(this.walletSeed, defaultAccountNonce);
    }



    getAccount(accountNonce: number) {
        return AccountCrypto.createFromWalletSeedAndNonce(this.walletSeed, accountNonce);
    }


    getSeedAsBytes() {
        return this.walletSeed;
    }
}

/**
 * @deprecated Will be removed soon!
 */
export type Wallet = WalletCrypto;