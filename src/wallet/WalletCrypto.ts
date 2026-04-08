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

    async generateActorPrivateSignatureKey(algoId: SignatureSchemeId, vbSeed: Uint8Array) {
        // TODO: implement
        const kdf = CryptoSchemeFactory.createDefaultKDF();
        const actorSeed = new Uint8Array([...this.walletSeed, ...vbSeed])
        const encoder = new TextEncoder();
        const seed = kdf.deriveKeyNoSalt(actorSeed, encoder.encode("SIG"), 32);
        return CryptoSchemeFactory.createPrivateSignatureKey(algoId, seed);
    }

    /**
     * @deprecated Will be removed soon!
     * @param algoId
     * @param vbSeed
     */
    async generateActorPrivateDecryptionKey(algoId: PublicKeyEncryptionSchemeId, vbSeed: Uint8Array) {
        const kdf = CryptoSchemeFactory.createDefaultKDF();
        const actorSeed = new Uint8Array([...this.walletSeed, ...vbSeed])
        const encoder = new TextEncoder();
        const seed = kdf.deriveKeyNoSalt(actorSeed, encoder.encode("PKE"), 32);
        return CryptoSchemeFactory.createPrivateDecryptionKey(algoId, seed);
    }

    /**
     * Generate the private signature key associated to the wallet.
     *
     * @param schemeId Type of signature scheme to generate.
     */
    getPrivateSignatureKey(schemeId: SignatureSchemeId = SignatureSchemeId.SECP256K1): PrivateSignatureKey {
        const kdf = CryptoSchemeFactory.createDefaultKDF();
        const scheme = CryptoSchemeFactory.createSignatureScheme(schemeId);
        const seedLength = scheme.expectedSeedSize();
        const info = AccountCrypto.encoderStringAsBytes(`SIG_${schemeId}`);
        const seed = kdf.deriveKeyNoSalt(
            this.walletSeed,
            info,
            seedLength
        );
        return CryptoSchemeFactory.createPrivateSignatureKey( schemeId, seed );
    }



    /**
     * Retrieves the decapsulation key for a given cryptographic scheme ID.
     *
     * @deprecated Will be removed soon.
     *
     * @param {number} schemeId - The identifier of the cryptographic scheme for which the decapsulation key is needed.
     * @return {*} The generated decapsulation key for the specified scheme ID.
     */
    getDecapsulationKey( schemeId: number ) {
        const factory = new CryptoSchemeFactory();
        return factory.createDecapsulationKey( schemeId, this.walletSeed );
    }

    /**
     * Derived from the wallet seed, unique for each account.
     * Used to handle different accounts from the same wallet.
     *
     * @param accountNonce The index of the account.
     */
    getAccountSeed(accountNonce: number) {
        const account = this.getAccount(accountNonce);
        return account.getAccountSeed();
        //return this.concatWalletSeedWith(this.numberToUint8Array(accountNonce));
    }

    getAccount(accountNonce: number) {
        return AccountCrypto.createFromWalletSeedAndNonce(this.walletSeed, accountNonce);
    }


    getAccountPrivateSignatureKey( schemeId: SignatureSchemeId,  accountNonce: number ) {
        const account = AccountCrypto.createFromWalletSeedAndNonce(this.walletSeed, accountNonce);
        return account.getPrivateSignatureKey(schemeId);
    }

    getActorPrivateSignatureKey(schemeId: number, vbSeed: Uint8Array, accountNonce: number) {
        const account = AccountCrypto.createFromWalletSeedAndNonce(this.walletSeed, accountNonce);
        const actor = account.deriveActorFromVbSeed(vbSeed);
        return actor.getPrivateSignatureKey(schemeId);
    }



    /**
     * Retrieves the virtual blockchain decapsulation key using the specified scheme ID and virtual blockchain seed.
     *
     * @deprecated Will be removed soon.
     * @param {number} schemeId - The identifier of the cryptographic scheme to be used for generating the key.
     * @param {Uint8Array} vbSeed - The virtual blockchain seed
     * */
    getVirtualBlockchainDecapsulationKey( schemeId: number, vbSeed: Uint8Array ) {
        const factory = new CryptoSchemeFactory();
        return factory.createVirtualBlockchainDecapsulationKey( schemeId, this.walletSeed, vbSeed );
    }

    getSeedAsBytes() {
        return this.walletSeed;
    }
}

/**
 * @deprecated Will be removed soon!
 */
export type Wallet = WalletCrypto;