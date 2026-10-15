import {CryptoEncoderFactory} from "../crypto/encoder/CryptoEncoderFactory";
import {ProviderFactory} from "../providers/ProviderFactory";
import {Provider} from "../providers/Provider";
import {Secp256k1PrivateSignatureKey} from "../crypto/signature/secp256k1/Secp256k1PrivateSignatureKey";
import {Microblock} from "../blockchain/microblock/Microblock";
import {SectionType} from "../type/valibot/blockchain/section/SectionType";
import {CMTSToken} from "../economics/currencies/token";
import {Utils} from "../utils/utils";
import {Hash} from "../entities/Hash";
import {PrivateSignatureKey} from "../crypto/signature/PrivateSignatureKey";
import {ApplicationLedgerVb} from "../blockchain/virtualBlockchains/ApplicationLedgerVb";
import {VirtualBlockchainType} from "../type/VirtualBlockchainType";
import {AppLedgerMicroblockBuildRequest} from "../type/AppLedgerStateUpdateRequest";
import {WalletCrypto} from "../wallet/WalletCrypto";
import {CryptoHandlerApplicationLedgerActorIdentityAdapter} from "../blockchain/virtualBlockchains/IApplicationLedgerActorIdentity";
import {WrappedAppLedgerProof} from "../type/valibot/proofs/CarmentisProof";
import {VirtualBlockchainSeed} from "../blockchain/virtualBlockchains/VirtualBlockchainSeed";
import {
    WalletRequestBasedApplicationLedgerMicroblockBuilder
} from "../blockchain/virtualBlockchains/WalletRequestBasedApplicationLedgerMicroblockBuilder";

interface AppLedgerResult {
    applicationLedgerId: string
    operatorIdentity: CryptoHandlerApplicationLedgerActorIdentityAdapter
    userIdentity: CryptoHandlerApplicationLedgerActorIdentityAdapter
}

const noExpiration = true;
const showRequests = true;
const showMicroblocks = true;

export class Test {
    private readonly provider: Provider;
    private readonly encodedSk: string;

    constructor(nodeUrl: string, encodedSk: string) {
        this.provider = ProviderFactory.createInMemoryProviderWithExternalProvider(nodeUrl);
        this.encodedSk = encodedSk;
    }

    getProvider() {
        return this.provider;
    }

    createWallet() {
        return WalletCrypto.generateWallet();
    }

    async createAccount(): Promise<PrivateSignatureKey> {
        const sigEncoder = CryptoEncoderFactory.defaultStringSignatureEncoder();
        const sellerSk = await sigEncoder.decodePrivateKey(this.encodedSk);
        const sellerPk = await sellerSk.getPublicKey();
        const sellerAccountId = await this.provider.getAccountIdFromPublicKey(sellerPk);

        const sk = Secp256k1PrivateSignatureKey.gen();
        const pk = await sk.getPublicKey();
        const mb = Microblock.createGenesisAccountMicroblock();
        mb.addSections([
            {
                type: SectionType.ACCOUNT_PUBLIC_KEY,
                schemeId: pk.getSignatureSchemeId(),
                publicKey: await pk.getPublicKeyAsBytes()
            },
            {
                type: SectionType.ACCOUNT_CREATION,
                sellerAccount: sellerAccountId.toBytes(),
                amount: CMTSToken.createCMTS(1000).getAmountAsAtomic()
            },
        ])
        mb.setFeesPayerAccount(sellerAccountId.toBytes());
        mb.setTimestamp(Utils.getTimestampInSeconds())
        mb.setGasPrice(CMTSToken.createMilliToken(1));
        await mb.setGasAndSeal(this.provider, sellerSk);
        await this.provider.publishMicroblock(mb);
        await this.provider.awaitMicroblockAnchoring(mb.getHash().toBytes());

        return sk;
    }

    async createOrganization(sk: PrivateSignatureKey, customSections: any[] = []): Promise<string> {
        const pk = await sk.getPublicKey();
        const accountId = await this.provider.getAccountIdFromPublicKey(pk);
        const organizationMicroblock = Microblock.createGenesisOrganizationMicroblock();
        organizationMicroblock.addSections([
            {
                type: SectionType.ORG_CREATION,
                accountId: accountId.toBytes(),
            },
            {
                type: SectionType.ORG_DESCRIPTION,
                name: 'ACME',
                website: '',
                countryCode: 'FR',
                city: 'Paris',
            },
            ...customSections.map((s) => {
                return {
                    type: SectionType.CUSTOM,
                    ...s
                };
            })
        ]);
        organizationMicroblock.setFeesPayerAccount(accountId.toBytes());
        organizationMicroblock.setTimestamp(Utils.getTimestampInSeconds());
        organizationMicroblock.setGasPrice(CMTSToken.createMilliToken(1));
        await organizationMicroblock.setGasAndSeal(this.provider, sk);
        const { microblockHash: organizationId } = organizationMicroblock.serialize();
        await this.provider.publishMicroblock(organizationMicroblock);
        await this.provider.awaitMicroblockAnchoring(organizationMicroblock.getHash().toBytes());

        return Utils.binaryToHexa(organizationId);
    }

    async createApplication(sk: PrivateSignatureKey, organizationId: string): Promise<string> {
        const pk = await sk.getPublicKey();
        const accountId = await this.provider.getAccountIdFromPublicKey(pk);
        const applicationMicroblock = Microblock.createGenesisApplicationMicroblock();
        applicationMicroblock.addSections([
            {
                type: SectionType.APP_CREATION,
                organizationId: Hash.from(organizationId).toBytes(),
            },
            {
                type: SectionType.APP_DESCRIPTION,
                name: 'My Application',
                logoUrl: '',
                homepageUrl: 'FR',
                description: 'A test application',
            },
        ]);
        applicationMicroblock.setFeesPayerAccount(accountId.toBytes());
        applicationMicroblock.setTimestamp(Utils.getTimestampInSeconds());
        applicationMicroblock.setGasPrice(CMTSToken.createMilliToken(1));
        await applicationMicroblock.setGasAndSeal(this.provider, sk);
        const { microblockHash: applicationId } = applicationMicroblock.serialize();
        await this.provider.publishMicroblock(applicationMicroblock);
        await this.provider.awaitMicroblockAnchoring(applicationMicroblock.getHash().toBytes());

        return Utils.binaryToHexa(applicationId);
    }

    async createAppLedger(
        sk: PrivateSignatureKey,
        applicationId: string,
        data: any,
        operatorWallet: WalletCrypto,
        userWallet: WalletCrypto,
        publicChannel = false
    ): Promise<AppLedgerResult> {
        return await this.writeToAppLedger(null, sk, applicationId, data, operatorWallet, userWallet, publicChannel);
    }

    async updateAppLedger(
        appLedgerId: string,
        sk: PrivateSignatureKey,
        applicationId: string,
        data: any,
        operatorWallet: WalletCrypto,
        userWallet: WalletCrypto,
        publicChannel = false
    ): Promise<AppLedgerResult> {
        return await this.writeToAppLedger(appLedgerId, sk, applicationId, data, operatorWallet, userWallet, publicChannel);
    }

    private async writeToAppLedger(
        appLedgerId: string | null,
        sk: PrivateSignatureKey,
        applicationId: string,
        data: any,
        operatorWallet: WalletCrypto,
        userWallet: WalletCrypto,
        publicChannel: boolean
    ): Promise<AppLedgerResult> {
        const pk = await sk.getPublicKey();
        const accountId = await this.provider.getAccountIdFromPublicKey(pk);
        const expirationDay = noExpiration ? 0 : Utils.addDaysToTimestamp(
            Utils.getTimestampInSeconds(),
            10
        );

        let applicationLedger;
        let seed;
        let mbBuilder;

        if (appLedgerId !== null) {
            applicationLedger = await this.provider.loadApplicationLedgerVirtualBlockchain(Hash.from(appLedgerId));
            seed = VirtualBlockchainSeed.createFromGenesisSeed((await applicationLedger.getGenesisSeed()).toBytes());
            mbBuilder = await WalletRequestBasedApplicationLedgerMicroblockBuilder.createFromVirtualBlockchain(
                Hash.fromHex(applicationId),
                applicationLedger,
            );
        }
        else {
            seed = VirtualBlockchainSeed.create(VirtualBlockchainType.APP_LEDGER_VIRTUAL_BLOCKCHAIN, expirationDay);
            applicationLedger = ApplicationLedgerVb.createApplicationLedgerVirtualBlockchain(this.provider);
            mbBuilder = await WalletRequestBasedApplicationLedgerMicroblockBuilder.createFromEmptyVirtualBlockchain(
                Hash.fromHex(applicationId),
                applicationLedger,
                seed
            );
        }

        const userAccountCrypto = userWallet.getDefaultAccountCrypto();
        const userActorCrypto = userAccountCrypto.deriveActorFromVbSeed(seed.getGenesisSeed().toBytes());
        const userIdentity = new CryptoHandlerApplicationLedgerActorIdentityAdapter(userActorCrypto);

        const operatorAccountCrypto = operatorWallet.getDefaultAccountCrypto();
        const operatorActorCrypto = operatorAccountCrypto.deriveActorFromVbSeed(seed.getGenesisSeed().toBytes());
        const operatorIdentity = new CryptoHandlerApplicationLedgerActorIdentityAdapter(operatorActorCrypto);

        const request: AppLedgerMicroblockBuildRequest = {
            author: 'appOperator',
            endorser: 'user',
            data,
            channelAssignations: [
                {
                    channelName: 'mainChannel',
                    fieldPath: 'this.*'
                }
            ],
            approvalMessage: 'please approve this data set',
        };

        if (appLedgerId !== null) {
            request.virtualBlockchainId = appLedgerId;
        }
        else {
            request.channels = [
                {
                    name: 'mainChannel',
                    public: publicChannel,
                }
            ];
            request.actors = [
                { name: "appOperator" },
                { name: "user" },
            ];
            request.actorAssignations = [
                {
                    channelName: 'mainChannel',
                    actorName: 'appOperator',
                },
                {
                    channelName: 'mainChannel',
                    actorName: 'user'
                },
            ];
        }

        if (showRequests) {
            console.log(request);
        }

        const privateEncryptionKey = await userIdentity.getActorPrivateDecryptionKey();
        const publicEncryptionKey = await privateEncryptionKey.getPublicKey();
        await mbBuilder.subscribeActor(
            'user',
            await userIdentity.getActorPublicSignatureKey(),
            publicEncryptionKey
        );

        const appLedgerMicroblock = await mbBuilder.createMicroblockFromStateUpdateRequest(
            operatorIdentity,
            request
        );
        appLedgerMicroblock.setFeesPayerAccount(accountId.toBytes());
        appLedgerMicroblock.setTimestamp(Utils.getTimestampInSeconds());
        appLedgerMicroblock.setGasPrice(CMTSToken.createMilliToken(1));
        await appLedgerMicroblock.setGasAndSeal(this.provider, sk);
        if (showMicroblocks) {
            console.log(appLedgerMicroblock.toString());
        }
        const {microblockHash: applicationLedgerId} = appLedgerMicroblock.serialize();
        await this.provider.publishMicroblock(appLedgerMicroblock);
        await this.provider.awaitMicroblockAnchoring(appLedgerMicroblock.getHash().toBytes());

        return {
            applicationLedgerId: Utils.binaryToHexa(applicationLedgerId),
            operatorIdentity,
            userIdentity,
        };
    }

    async getAppLedgerProof(
        applicationLedgerId: Uint8Array,
        identity: CryptoHandlerApplicationLedgerActorIdentityAdapter,
        author = "John Doe"
    ): Promise<WrappedAppLedgerProof> {
        const appLedgerVb = await this.provider.loadApplicationLedgerVirtualBlockchain(Hash.from(applicationLedgerId));
        const proofWrapper = await appLedgerVb.exportProof(
            { author },
            identity
        );
        return proofWrapper;
    }
}
