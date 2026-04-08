import {VirtualBlockchain} from "./VirtualBlockchain";
import {CryptoSchemeFactory} from "../../crypto/CryptoSchemeFactory";
import {PublicSignatureKey} from "../../crypto/signature/PublicSignatureKey";
import {IllegalStateError} from "../../errors/carmentis-error";
import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {AccountMicroblockStructureChecker} from "../structureCheckers/AccountMicroblockStructureChecker";
import {Microblock} from "../microblock/Microblock";
import {INITIAL_OFFER} from "../../constants/economics";
import {CMTSToken} from "../../economics/currencies/token";
import {IProvider} from "../../providers/IProvider";
import {AccountInternalState} from "../internalStates/AccountInternalState";
import {InternalStateUpdaterFactory} from "../internalStatesUpdater/InternalStateUpdaterFactory";
import {ProtocolInternalState} from "../internalStates/ProtocolInternalState";
import {SectionType} from "../../type/valibot/blockchain/section/SectionType";
import {Utils} from "../../utils/utils";
import {Hash} from "../../entities/Hash";

export class AccountVb extends VirtualBlockchain<AccountInternalState> {

    constructor(provider: IProvider, state: AccountInternalState = AccountInternalState.createInitialState()) {
        super(provider, VirtualBlockchainType.ACCOUNT_VIRTUAL_BLOCKCHAIN, state );
    }

    protected async updateInternalState(protocolState: ProtocolInternalState, state: AccountInternalState, microblock: Microblock): Promise<AccountInternalState> {
        const accountInternalStateUpdaterVersion = protocolState.getAccountInternalStateUpdaterVersion();
        const localStateUpdater = InternalStateUpdaterFactory.createAccountInternalStateUpdater(
            accountInternalStateUpdaterVersion
        );
        return localStateUpdater.updateState(this.provider, state, microblock);
    }

    async getVirtualBlockchainState() {
        const height = this.getHeight();
        const lastMicroblockHash = height === 0 ?
            Utils.getNullHash() :
            (await this.getLastMicroblock()).getHash().toBytes();
        return {
            expirationDay: this.getExpirationDay(),
            height: height,
            internalState: this.internalState.toObject(),
            lastMicroblockHash: lastMicroblockHash,
            type: this.getType()
        };
    }

    async getVirtualBlockchainOwnerId() {
        return Hash.from(this.getId());
    }

    protected checkMicroblockStructure(microblock: Microblock): boolean {
        const checker = new AccountMicroblockStructureChecker();
        return checker.checkMicroblockStructure(microblock)
    }


    /**
     * Retrieves the public key for the current instance of the cryptographic context.
     *
     * The method fetches the raw public key and the signature scheme ID, then utilizes the CryptoSchemeFactory
     * to create and return a public signature key object.
     *
     * @return {Promise<PublicSignatureKey>} A promise that resolves to a public signature key object.
     */
    async getPublicKey() {
        const publicKeyDeclarationHeight = this.internalState.getPublicKeyHeight();
        const schemeId = this.internalState.getPublicKeySchemeId();
        const mb = await this.getMicroblock(publicKeyDeclarationHeight);
        for (const section of mb.getAllSections()) {
            if (section.type === SectionType.ACCOUNT_PUBLIC_KEY) {
                const factory = new CryptoSchemeFactory();
                return factory.createPublicSignatureKey(schemeId, section.publicKey);
            }
        }
        throw new IllegalStateError("Account public key not found");
        //const section = mb.getAccountPublicKeySection();
    }

    async isIssuer() {
        const firstMb = await this.getFirstMicroBlock();
        for (const section of firstMb.getAllSections()) {
            if (section.type === SectionType.ACCOUNT_TOKEN_ISSUANCE) return true;
        }
        return false;
    }

    static async createAccountCreationMicroblock(accountOwnerPublicKey: PublicSignatureKey, initialAmount: CMTSToken, sellerAccountId: Uint8Array, accountName: string = '') {
        const mb = Microblock.createGenesisAccountMicroblock();
        mb.addSection({
            type: SectionType.ACCOUNT_PUBLIC_KEY,
            publicKey: await accountOwnerPublicKey.getPublicKeyAsBytes(),
            schemeId: accountOwnerPublicKey.getSignatureSchemeId()
        });
        mb.addSection({
            type: SectionType.ACCOUNT_CREATION,
            amount: initialAmount.getAmountAsAtomic(),
            sellerAccount: sellerAccountId
        });
        return mb;
    }

    static async createIssuerAccountCreationMicroblock(genesisPublicKey: PublicSignatureKey): Promise<Microblock> {
        // we use in priority the default public key, if provided, or the keyed provider's public key
        const publicKey = genesisPublicKey;
        const microblock = Microblock.createGenesisAccountMicroblock();
        microblock.addSection({
            type: SectionType.ACCOUNT_PUBLIC_KEY,
            publicKey: await publicKey.getPublicKeyAsBytes(),
            schemeId: publicKey.getSignatureSchemeId()
        });
        microblock.addSection({
            type: SectionType.ACCOUNT_TOKEN_ISSUANCE,
            amount: INITIAL_OFFER
        })
        return microblock;
    }
}
