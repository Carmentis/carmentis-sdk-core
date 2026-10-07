import {
    AbstractPrivateDecryptionKey
} from "../../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeInterface";
import {PrivateSignatureKey} from "../../crypto/signature/PrivateSignatureKey";
import {PublicSignatureKey} from "../../crypto/signature/PublicSignatureKey";
import {Microblock} from "../microblock/Microblock";
import {ApplicationLedgerVb} from "./ApplicationLedgerVb";
import {SignatureSchemeId} from "../../crypto/signature/SignatureSchemeId";
import {PublicKeyEncryptionSchemeId} from "../../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeId";
import {undefined} from "valibot";
import {ICryptoKeyHandler} from "../../wallet/ICryptoKeyHandler";
import {WalletCrypto} from "../../wallet/WalletCrypto";
import {ActorCrypto} from "../../wallet/ActorCrypto";
import {AccountCrypto} from "../../wallet/AccountCrypto";
import {mnemonicToSeedSync} from "@scure/bip39";

/**
 * This interface models an identity containing all the cryptographic keys and seeds used to authenticate and access data.
 */
export interface IApplicationLedgerActorIdentity {
    getChannelKeysDerivationSeed(): Promise<Uint8Array>;
    getActorPrivateDecryptionKey(): Promise<AbstractPrivateDecryptionKey>;
    getActorPublicSignatureKey(): Promise<PublicSignatureKey>;
}


export class CryptoHandlerApplicationLedgerActorIdentityAdapter implements IApplicationLedgerActorIdentity {
    private usedSignatureSchemeId: SignatureSchemeId = SignatureSchemeId.SECP256K1;
    private usedPkeSchemeId: PublicKeyEncryptionSchemeId = PublicKeyEncryptionSchemeId.ML_KEM_768_AES_256_GCM;

    static createFromWalletSeed(walletSeed: Uint8Array): CryptoHandlerApplicationLedgerActorIdentityAdapter {
        const walletCrypto = WalletCrypto.fromSeed(walletSeed);
        const accountCrypto = walletCrypto.getDefaultAccountCrypto();
        return new CryptoHandlerApplicationLedgerActorIdentityAdapter(accountCrypto);
    }

    static createFromWalletSeedAndVbSeed(walletSeed: Uint8Array, vbSeed: Uint8Array): CryptoHandlerApplicationLedgerActorIdentityAdapter {
        const walletCrypto = WalletCrypto.fromSeed(walletSeed);
        const accountCrypto = walletCrypto.getDefaultAccountCrypto();
        const actorCrypto = accountCrypto.deriveActorFromVbSeed(vbSeed);
        return new CryptoHandlerApplicationLedgerActorIdentityAdapter(actorCrypto);
    }

    constructor(
        private cryptoHandler: ICryptoKeyHandler
    ) {}

    setUsedPkeSchemeId(usedPkeSchemeId: PublicKeyEncryptionSchemeId) {
        this.usedPkeSchemeId = usedPkeSchemeId;
        return this;
    }

    setUsedSignatureSchemeId(usedSignatureSchemeId: SignatureSchemeId) {
        this.usedSignatureSchemeId = usedSignatureSchemeId;
        return this;
    }

    async getActorPrivateDecryptionKey(): Promise<AbstractPrivateDecryptionKey> {
        return this.cryptoHandler.getPrivateDecryptionKey(this.usedPkeSchemeId);
    }

    async getActorPublicSignatureKey(): Promise<PublicSignatureKey> {
        return this.cryptoHandler.getPublicSignatureKey(this.usedSignatureSchemeId);
    }

    async getChannelKeysDerivationSeed(): Promise<Uint8Array> {
        return this.cryptoHandler.getSeedAsBytes()
    }
}


export class ExternalKeyApplicationLedgerActorIdentity implements IApplicationLedgerActorIdentity {
    constructor(
        private publicSignatureKey: PublicSignatureKey,
        private privateDecryptionKey: AbstractPrivateDecryptionKey,
        private channelKeysDerivationSeed: Uint8Array
    ) {}

    /*
    static async createFromIdentityPublicSignatureKeyAndSeed(
        identityPublicSignatureKey: PublicSignatureKey,
        seedDerivedFromMnemonic: Uint8Array, // this is a fresh seed only derived from the mnemonic,
        vbSeed: Uint8Array,
    ) {
        // we construct the actor crypto directly
        const accountCrypto = new AccountCrypto(seedDerivedFromMnemonic);
        const actorCrypto = accountCrypto.deriveActorFromVbSeed(vbSeed);

        // the actor private decryption key
        const actorPrivateDecryptionKey = await actorCrypto.getPrivateDecryptionKey(PublicKeyEncryptionSchemeId.ML_KEM_768_AES_256_GCM);
        const channelKsyDerivationSeed = seedDerivedFromMnemonic;

        return new ExternalKeyApplicationLedgerActorIdentity(
            identityPublicSignatureKey, // the actor identity is the official one
            actorPrivateDecryptionKey,
            channelKsyDerivationSeed // and later used to derive channel keys along vbSeed
        )
    }

    static async createFromSeed(
        seedDerivedFromMnemonic: Uint8Array, // this is a fresh seed only derived from the mnemonic,
        vbSeed: Uint8Array,
    ) {
        // we construct the actor crypto directly
        const accountCrypto = new AccountCrypto(seedDerivedFromMnemonic);
        const actorCrypto = accountCrypto.deriveActorFromVbSeed(vbSeed);

        // the actor private decryption key
        const actorPrivateDecryptionKey = await actorCrypto.getPrivateDecryptionKey(PublicKeyEncryptionSchemeId.ML_KEM_768_AES_256_GCM);
        const actorPublicSignatureKey = await actorCrypto.getPublicSignatureKey(SignatureSchemeId.ML_DSA_65);
        const channelKsyDerivationSeed = seedDerivedFromMnemonic;

        return new ExternalKeyApplicationLedgerActorIdentity(
            actorPublicSignatureKey, // the actor identity is the actor one
            actorPrivateDecryptionKey,
            channelKsyDerivationSeed // and later used to derive channel keys along vbSeed
        )
    }

     */

    static async createFromPublicSignatureKeyAndMnemonic(
        identityPublicSignatureKey: PublicSignatureKey,
        mnemonic: string,
        vbSeed: Uint8Array,
    ) {
        const derivedSeed = mnemonicToSeedSync(mnemonic, '');
        return this.createFromPublicSignatureKeyAndMnemonicDerivedSeed(identityPublicSignatureKey, derivedSeed, vbSeed);
    }

    static async createFromMnemonic(
        mnemonic: string,
        vbSeed: Uint8Array,
    ) {
        const derivedSeed = mnemonicToSeedSync(mnemonic, '');
        return this.createFromMnemonicDerivedSeed(derivedSeed, vbSeed);
    }


    static async createFromPublicSignatureKeyAndMnemonicDerivedSeed(
        identityPublicSignatureKey: PublicSignatureKey,
        seedDerivedFromMnemonic: Uint8Array, // this is a fresh seed only derived from the mnemonic,
        vbSeed: Uint8Array,
    ) {
        // we construct the actor crypto
        const walletCrypto = WalletCrypto.fromSeed(seedDerivedFromMnemonic);
        const accountCrypto = walletCrypto.getDefaultAccountCrypto();
        const actorCrypto = accountCrypto.deriveActorFromVbSeed(vbSeed);

        // the actor private decryption key
        const actorPrivateDecryptionKey = await actorCrypto.getPrivateDecryptionKey(PublicKeyEncryptionSchemeId.ML_KEM_768_AES_256_GCM);
        const channelKsyDerivationSeed = actorCrypto.getSeedAsBytes();

        return new ExternalKeyApplicationLedgerActorIdentity(
            identityPublicSignatureKey, // the actor identity is the official one
            actorPrivateDecryptionKey,
            channelKsyDerivationSeed // and later used to derive channel keys along vbSeed
        )
    }

    static async createFromMnemonicDerivedSeed(
        seedDerivedFromMnemonic: Uint8Array, // this is a fresh seed only derived from the mnemonic,
        vbSeed: Uint8Array,
    ) {
        // we construct the actor crypto
        const walletCrypto = WalletCrypto.fromSeed(seedDerivedFromMnemonic);
        const accountCrypto = walletCrypto.getDefaultAccountCrypto();
        const actorCrypto = accountCrypto.deriveActorFromVbSeed(vbSeed);

        // the actor private decryption key
        const actorPrivateDecryptionKey = await actorCrypto.getPrivateDecryptionKey(PublicKeyEncryptionSchemeId.ML_KEM_768_AES_256_GCM);
        const actorPublicSignatureKey = await actorCrypto.getPublicSignatureKey(SignatureSchemeId.ML_DSA_65);
        const channelKsyDerivationSeed = actorCrypto.getSeedAsBytes();

        return new ExternalKeyApplicationLedgerActorIdentity(
            actorPublicSignatureKey, // the actor identity is the actor one
            actorPrivateDecryptionKey,
            channelKsyDerivationSeed // and later used to derive channel keys along vbSeed
        )
    }

    async getActorPrivateDecryptionKey(): Promise<AbstractPrivateDecryptionKey> {
        return this.privateDecryptionKey;
    }

    async getActorPublicSignatureKey(): Promise<PublicSignatureKey> {
        return this.publicSignatureKey
    }

    async getChannelKeysDerivationSeed(): Promise<Uint8Array> {
        return this.channelKeysDerivationSeed
    }
}
