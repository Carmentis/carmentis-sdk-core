import { describe, it, expect, beforeAll } from 'vitest'
import {Hash} from "../entities/Hash";
import {MlKemPrivateDecryptionKey} from "../crypto/encryption/public-key-encryption/MlKemPrivateDecryptionKey";
import {CryptoEncoderFactory} from "../crypto/encoder/CryptoEncoderFactory";
import {ProviderFactory} from "../providers/ProviderFactory";
import {Logger} from "../utils/Logger";
import {Microblock} from "../blockchain/microblock/Microblock";
import {CMTSToken} from "../economics/currencies/token";
import {Secp256k1PrivateSignatureKey} from "../crypto/signature/secp256k1/Secp256k1PrivateSignatureKey";
import {SectionType} from "../type/valibot/blockchain/section/SectionType";
import {Utils} from "../utils/utils";
import {VirtualBlockchainType} from "../type/VirtualBlockchainType";
//import * as fs from 'fs';

const NODE_URL = "http://localhost:26657";
import * as v from 'valibot';
import {ProtocolVariablesSchema} from "../type/valibot/blockchain/protocol/ProtocolVariables";
import {FeesCalculationFormulaFactory} from "../blockchain/feesCalculator/FeesCalculationFormulaFactory";
import {WalletCrypto} from "../wallet/WalletCrypto";
import {ApplicationLedgerVb} from "../blockchain/virtualBlockchains/ApplicationLedgerVb";
import {
    WalletRequestBasedApplicationLedgerMicroblockBuilder
} from "../blockchain/virtualBlockchains/WalletRequestBasedApplicationLedgerMicroblockBuilder";
import {AppLedgerMicroblockBuildRequest} from "../type/AppLedgerStateUpdateRequest";
import {SignatureAlgorithmId} from "../crypto/signature/SignatureAlgorithmId";
import {SignatureSchemeId} from "../crypto/signature/SignatureSchemeId";
import {
    PublicKeyEncryptionSchemeId
} from "../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeId";
import {ProofWrapper} from "../records/types";

describe('Chain test', () => {
    const TEST_TIMEOUT = 45000;

    const nodeUrl = NODE_URL;
    const provider = ProviderFactory.createInMemoryProviderWithExternalProvider(nodeUrl);
    const sigEncoder = CryptoEncoderFactory.defaultStringSignatureEncoder();
    const encodedSk = 'SIG:SECP256K1:SK{cd42ad5f7a7823f3ab4da368ea4f807fa8246526ea4ea7eeb4879c42048916a5}';

    // set up the logger
    Logger.enableLogs();

    async function getProtocolVariables() {
        const protocolParams = await provider.getProtocolState();
        const parseResult = v.safeParse(ProtocolVariablesSchema, protocolParams.getProtocolVariables());
        expect(protocolParams).toBeDefined();
        expect(parseResult.success).toBeTruthy();
        return protocolParams.getProtocolVariables()
    }

    it("Should get all accounts", async () => {
        // we load the genesis account information
        const accounts = await provider.getAllAccounts();
        expect(accounts.length).toBeGreaterThan(0);
    })

    it("Should get the genesis issuer account", async () => {
        const accounts = await provider.getAllAccounts();
    })

    it("Should recover the protocol parameters", async () => {
        await getProtocolVariables()
    })

    it('Should create an account, an application, an app ledger and a proof', async () => {
        const sellerSk = await sigEncoder.decodePrivateKey(encodedSk);
        const sellerPk = await sellerSk.getPublicKey();
        const sellerAccountId = await provider.getAccountIdFromPublicKey(sellerPk);
        const protocolVariables = await getProtocolVariables();
        const feesFormulaVersion = protocolVariables.feesCalculationVersion;

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
        //mb.setGas(await feesFormula.computeFees(sellerSk.getSignatureSchemeId(), mb))
        mb.setMaxFees(CMTSToken.createCMTS(150));
        await mb.seal(sellerSk);
        await provider.publishMicroblock(mb);
        await provider.awaitMicroblockAnchoring(mb.getHash().toBytes());

        // now create an organization
        const newAccountId = await provider.getAccountIdFromPublicKey(pk);
        const carmentisOrganizationMicroblock = Microblock.createGenesisOrganizationMicroblock();
        carmentisOrganizationMicroblock.addSections([
            {
                type: SectionType.ORG_CREATION,
                accountId: newAccountId.toBytes(),
            },
            {
                type: SectionType.ORG_DESCRIPTION,
                name: 'ACME',
                website: '',
                countryCode: 'FR',
                city: '',
            },
        ]);
        carmentisOrganizationMicroblock.setFeesPayerAccount(newAccountId.toBytes());
        carmentisOrganizationMicroblock.setTimestamp(Utils.getTimestampInSeconds());
        //carmentisOrganizationMicroblock.setGas(await feesFormula.computeFees(sk.getSignatureSchemeId(), carmentisOrganizationMicroblock));
        carmentisOrganizationMicroblock.setMaxFees(CMTSToken.createCMTS(150));
        await carmentisOrganizationMicroblock.seal(sk);
        const { microblockData: carmentisOrganizationData, microblockHash: carmentisOrgId } =
            carmentisOrganizationMicroblock.serialize();
        await provider.publishMicroblock(carmentisOrganizationMicroblock);
        await provider.awaitMicroblockAnchoring(carmentisOrganizationMicroblock.getHash().toBytes());

        // publish an update of the description
        const organizationVb = await provider.loadOrganizationVirtualBlockchain(Hash.from(carmentisOrgId));
        const carmentisOrganizationSecondMicroblock = await organizationVb.createMicroblock();
        carmentisOrganizationSecondMicroblock.addSections([
            {
                type: SectionType.ORG_DESCRIPTION,
                name: 'ACME',
                website: 'https://www.acme.org',
                countryCode: 'FR',
                city: 'Paris',
            },
            {
                type: SectionType.CUSTOM,
                __x509__: `-----BEGIN CERTIFICATE-----
MIID9zCCAt+gAwIBAgIUKiawZMLinRSTLO55DatDv+denH0wDQYJKoZIhvcNAQEL
BQAwgYoxCzAJBgNVBAYTAkZSMRYwFAYDVQQIDA1JbGUgZGUgRnJhbmNlMQ4wDAYD
VQQHDAVQYXJpczEWMBQGA1UECgwNQ2FybWVudGlzIFNBUzEZMBcGA1UEAwwQd3d3
LmNhcm1lbnRpcy5pbzEgMB4GCSqGSIb3DQEJARYRaW5mb0BjYXJtZW50aXMuaW8w
HhcNMjYwMzE5MTMxNDQxWhcNMjYwNDE4MTMxNDQxWjCBijELMAkGA1UEBhMCRlIx
FjAUBgNVBAgMDUlsZSBkZSBGcmFuY2UxDjAMBgNVBAcMBVBhcmlzMRYwFAYDVQQK
DA1DYXJtZW50aXMgU0FTMRkwFwYDVQQDDBB3d3cuY2FybWVudGlzLmlvMSAwHgYJ
KoZIhvcNAQkBFhFpbmZvQGNhcm1lbnRpcy5pbzCCASIwDQYJKoZIhvcNAQEBBQAD
ggEPADCCAQoCggEBAMcftWqguNDiG5cSoMBBwYhHN0MQqfVmzUkMChj2ATAEz8N9
VaXOFG2UplZXkGcYlh9t585h74czobJjoRaqw3kXi4W70kyf9/z3ikJd2stMtY1t
6edm0TCUsHCKE+KXsHBQKKxno73w9WA7LRecQMhJ4TS24OJboIVJgC1aHqupVlCe
i2aNK0kC1dQvmYPcxGxn4HRtM1crlo+CIHevaCRTzpaUzEZym7sbhGCUxDpUmn0S
eJOYlIfBCrEG8cyF58QHPTQBxcbV4/woLJm8LMCgcf+lnbMi95Yl7+yZukef0APn
kH+PuMYkbQfymrpVUbQAyit30Yz8BoXr3VvZeEECAwEAAaNTMFEwHQYDVR0OBBYE
FM1QoZA7aKHzjq5mdErw776DHhV7MB8GA1UdIwQYMBaAFM1QoZA7aKHzjq5mdErw
776DHhV7MA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEBAHwVe1cG
gEHKV7sHzwQv3XeVESr0JR/YgrG8iyvhUaJNJjQW6xx4GhHd8X4du9h4Y0jZHDB9
kKQtQ+oPt5yB52pSIXZhsBVtKOr5v+0ddSwr4T5CUfLwDE0TuYCIQhr752XBMczf
KGO8lcXnjbesK1PQ3MM6x1eTv4vBARCImX8VKHx2qC3txIL2AFbTmhi2a/vHsz1S
P0Z4vu4yoVZRsaF+/AwNlIKKHtyz/8Cc7acwmlkGaOCmyddlrX+FR1Yld8RsV6/F
09mT6qcCDkWGsC4pknZbqyQDtUbZT0qYlqfmHCPN0GrCOrnVl0QADJ3JaLyjj6tB
UI9X4hM8epAa/Lg=
-----END CERTIFICATE-----`
            }
        ]);
        carmentisOrganizationSecondMicroblock.setFeesPayerAccount(newAccountId.toBytes());
        carmentisOrganizationSecondMicroblock.setTimestamp(Utils.getTimestampInSeconds());
        //carmentisOrganizationSecondMicroblock.setGas(await feesFormula.computeFees(sk.getSignatureSchemeId(), carmentisOrganizationSecondMicroblock));
        carmentisOrganizationSecondMicroblock.setMaxFees(CMTSToken.createCMTS(150));
        await carmentisOrganizationSecondMicroblock.seal(sk);
        carmentisOrganizationSecondMicroblock.serialize();
        await provider.publishMicroblock(carmentisOrganizationSecondMicroblock);
        await provider.awaitMicroblockAnchoring(carmentisOrganizationSecondMicroblock.getHash().toBytes());

        // get the organization VB with the standard provider
        const vbStatus1 = await provider.getVirtualBlockchainStatus(carmentisOrgId);
        console.log('vbStatus1', vbStatus1);

        // get the organization VB with the null memory provider,
        // to force the data to be fetched from the network
        const debugProvider = ProviderFactory.createNullInMemoryProviderWithExternalProvider(nodeUrl);
        const vbStatus2 = await debugProvider.getVirtualBlockchainStatus(carmentisOrgId);
        console.log('vbStatus2', vbStatus2);

        // create an application
        const applicationMicroblock = Microblock.createGenesisApplicationMicroblock();
        applicationMicroblock.addSections([
            {
                type: SectionType.APP_CREATION,
                organizationId: carmentisOrgId,
            },
            {
                type: SectionType.APP_DESCRIPTION,
                name: 'My Application',
                logoUrl: '',
                homepageUrl: 'FR',
                description: 'A test application',
            },
        ]);
        applicationMicroblock.setFeesPayerAccount(newAccountId.toBytes());
        applicationMicroblock.setTimestamp(Utils.getTimestampInSeconds());
        applicationMicroblock.setMaxFees(CMTSToken.createCMTS(150));
        await applicationMicroblock.seal(sk);
        const { microblockHash: applicationId } = applicationMicroblock.serialize();
        await provider.publishMicroblock(applicationMicroblock);
        await provider.awaitMicroblockAnchoring(applicationMicroblock.getHash().toBytes());

        // create an application ledger
        for(const author of ["Arnauld", "Julien"]) {
            const applicationLedger = ApplicationLedgerVb.createApplicationLedgerVirtualBlockchain(provider);
            const expirationDay = Utils.addDaysToTimestamp(
                Utils.getTimestampInSeconds(),
                10
            );
            const tempMb = Microblock.createGenesisMicroblock(
                VirtualBlockchainType.APP_LEDGER_VIRTUAL_BLOCKCHAIN,
                expirationDay
            );
            // TODO: The genesis seed should be created and hold by the VB, not the genesis microblock.
            // TODO: This would avoid having to resort to this hack (which is not even correct because
            // TODO: it works on the full 'previousHash' field instead of just the seed).
            const vbSeed = tempMb.getPreviousHash();
            const walletCrypto = WalletCrypto.generateWallet();
            const accountCrypto = walletCrypto.getDefaultAccountCrypto();
            const actorCrypto = accountCrypto.getActor(vbSeed.toBytes());
            const mbBuilder = await WalletRequestBasedApplicationLedgerMicroblockBuilder.createFromVirtualBlockchain(
                Hash.from(applicationId),
                applicationLedger
            );
            const request: AppLedgerMicroblockBuildRequest = {
                author: 'appOperator',
                endorser: 'user',
                data: {
                    firstname: "John",
                    lastname: "Doe",
                    email: "john.doe@gmail.com",
                    __sd_jwt__: "eyJ0eXAiOiJkYytzZC1qd3QiLCJhbGciOiJFUzI1NiJ9.eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvbnMvY3JlZGVudGlhbHMvdjIiXSwidHlwZSI6WyJWZXJpZmlhYmxlQ3JlZGVudGlhbCJdLCJ2YWxpZEZyb20iOiIxOTcwLTAxLTIxVDEzOjEyOjQ4LjQzOFoiLCJ2YWxpZFVudGlsIjoiMTk3MC0wMS0yMVQyMTo1ODoyNC40MzhaIiwidmN0IjoiaHR0cDovL2xvY2FsaG9zdDozMDAwL2NyZWRlbnRpYWxzL2lkZW50aXR5IiwiY3JlZGVudGlhbFN1YmplY3QiOnsiX3NkIjpbIjFmc05sUnNBbEJoQi14Rkg3aEJuQ3JHWTF0cllWSXNRazFOb21BbU5aQlUiLCJCUEFWVm1idTlFSGZ4Z2pFbWNJRy1nSXBpbGFOTmNzSUZmclkzLXFOcEUwIiwiQ1Q3bk5Fc0VLYXhqMUEySUhNTU1zYU8zdDBtY1RubTE4ZGxvNE9MQ21tRSIsIk1RODZYbWdIUXZrcnlQeC1sMzZJam84N1hmUzd4U0hlMUh0T1lkVERzVkEiLCJoekFlY2NPMGZEblkzN0xaVWd2ZXhZNHFmcGhsV29iTDJOU3VZdllCN29NIiwibzdTd0ZpZGM2TTNOVlFaYUtaNjlaTjZzWjB4djZxV01sWXNZbENqSGd4NCIsInJIM1NNZjFKdU42Vl9nUnJYVTYweGU3RU5aT09xXzRISV9iWWlGNlRLSTgiLCJ0OE5XdzZvVkQxZjI2SU5IOWlxcGxydGR1cjRRZ0t2OC04c21pZ0VSQjJzIiwidXhFTnBhbDZOaEF2NS0zTUFoZHB4OGZ5NVBldGxWY0lhSWVTcWFBeTZwMCJdfSwiX3NkIjpbIlF5YnNZY0dtOTBBRUFSTnpSZFhfX0lUQTAydlNOZWtSOFFHS210ZVRPWmciLCJoVlZRZVVlWVpaUW1OdzhvNGtKRWNvajVVdk9HOVl0ZjVETmIxTkdiOFRJIl0sIl9zZF9hbGciOiJzaGEtMjU2In0.Dh-YfX9sLxQayLblsaEsOHCioxQvlVnLqfuzcq-QideOCcHtDtrukwEsXjeaHuOcDHHWVERYtTK7rY4DV5Xl3A~WyJiNTI4MWE4OTk5OThiOGRhIiwiaWQiLCJkaWQ6ZXhhbXBsZTplYmZlYjFmNzEyZWJjNmYxYzI3NmUxMmVjMjEiXQ~WyIyM2I5Yzk1ZTlkZjcyMmMwIiwiZmlyc3RuYW1lIiwiSm9obiJd~WyI1Njc5NTY1MzBkNDcwM2Q4IiwibGFzdG5hbWUiLCJEb2UiXQ~WyI3YzM1ODlhZGJiN2EzYjkzIiwiZW1haWwiLCJqb2huLmRvZUBnbWFpbC5jb20iXQ~WyIxNmE5ZGEwNjVlYzczYjZjIiwiZmlfdmNfcmVjaXBpZW50IiwiIl0~WyI5MjQ2NTM3YjliYTFkOWMxIiwiZmlfdmNfcmVhc29uIiwiIl0~WyJhNTUxODBmNDU0ZjJjOTkxIiwiZmlfdmNfc2hhMjU2IiwiIl0~WyIzMWIxMzQ1ZjgzNDIzYjJlIiwiYWdlX292ZXJfMTgiLHRydWVd~WyJhZTY5MzVlYmM4ZWQyZGI3IiwiYWdlX292ZXJfMjEiLHRydWVd~WyI4OGY3NzkxZDA3ZGIzZWNjIiwiaWQiLCIxMjMiXQ~WyI1MDc4MzUwMjVmY2E2MDRkIiwiaXNzdWVyIiwiZGlkOndlYjpsb2NhbGhvc3Q6MzAwMCJd~"
                },
                channels: [
                    {
                        name: 'mainChannel',
                        public: false,
                    }
                ],
                channelAssignations: [
                    {
                        channelName: 'mainChannel',
                        fieldPath: 'this.*'
                    }
                ],
                actors: [
                    {name: "appOperator"},
                    {name: "user"},
                ],
                actorAssignations: [
                    {
                        channelName: 'mainChannel',
                        actorName: 'appOperator',
                    },
                    {
                        channelName: 'mainChannel',
                        actorName: 'user'
                    },
                ],
                approvalMessage: 'please approve this data set',
            };
            await mbBuilder.subscribeActor(
                'user',
                await actorCrypto.getPublicSignatureKey(SignatureSchemeId.SECP256K1),
                await actorCrypto.getPublicEncryptionKey(PublicKeyEncryptionSchemeId.ML_KEM_768_AES_256_GCM)
            );
            const appLedgerMicroblock = await mbBuilder.createMicroblockFromStateUpdateRequest(
                accountCrypto,
                request
            );
            appLedgerMicroblock.setPreviousHash(vbSeed);
            appLedgerMicroblock.setFeesPayerAccount(newAccountId.toBytes());
            appLedgerMicroblock.setTimestamp(Utils.getTimestampInSeconds());
            appLedgerMicroblock.setMaxFees(CMTSToken.createCMTS(300));
            await appLedgerMicroblock.seal(sk);
            const {microblockHash: applicationLedgerId} = appLedgerMicroblock.serialize();
            await provider.publishMicroblock(appLedgerMicroblock);
            await provider.awaitMicroblockAnchoring(appLedgerMicroblock.getHash().toBytes());

            // reload the VB and create a proof
            const appLedgerVb = await provider.loadApplicationLedgerVirtualBlockchain(Hash.from(applicationLedgerId));
            const proofWrapper = await appLedgerVb.exportProof(
                { author },
                actorCrypto
            );
            //fs.writeFileSync(`C:/Users/arnau/Desktop/Proof-${author}.json`, JSON.stringify(proofWrapper, null, 2));
            console.log(JSON.stringify(proofWrapper, null, 2));
        }
    }, TEST_TIMEOUT)

    /*
    const sigEncoder = CryptoEncoderFactory.defaultStringSignatureEncoder();
    const issuerPrivateKey = await sigEncoder.decodePrivateKey('SIG:SECP256K1:SK{2e3b5c0e850dce63adb3ee46866c691d2731d92ad8108fbf8cd8c86f6a124bb6}');
    console.log(`Issuer public key: ${sigEncoder.encodePublicKey(await issuerPrivateKey.getPublicKey())}`)
    const provider = ProviderFactory.createInMemoryProviderWithExternalProvider(nodeUrl);

    let genesisAccountId: Hash;
    beforeAll(async () => {
        // we load the genesis account information
        const accounts = await provider.getAllAccounts();
        expect(accounts.length).toBeGreaterThan(0);
        genesisAccountId = await provider.getAccountIdFromPublicKey(await issuerPrivateKey.getPublicKey());
    });

    it("creating an account", async () => {
        const firstAccountPrivateKey = await MLDSA65PrivateSignatureKey.gen();
        const firstAccountCreationMb = Microblock.createGenesisAccountMicroblock();
        firstAccountCreationMb.addSection({
            type: SectionType.ACCOUNT_CREATION,
            amount: CMTSToken.zero().getAmountAsAtomic(),
            sellerAccount: genesisAccountId.toBytes()
        });
        const firstAccountPublicKey = await firstAccountPrivateKey.getPublicKey();
        firstAccountCreationMb.addSection({
            type: SectionType.ACCOUNT_PUBLIC_KEY,
            publicKey: await firstAccountPublicKey.getPublicKeyAsBytes(),
            schemeId: firstAccountPublicKey.getSignatureSchemeId(),
        })
        await firstAccountCreationMb.seal(firstAccountPrivateKey, genesisAccountId.toBytes())
        console.log(firstAccountCreationMb.toString())
        await provider.publishMicroblock( firstAccountCreationMb );

        expect(1).toEqual(1)
    })

     */



    it("Works correctly when valid usage of BlockchainFacade", async () => {


        /* The genesis account is already created during the genesis state: no more creation required
        console.log("creating genesis account");
        // create the genesis account
        const genesisCreationContext = new PublicationExecutionContext();
        const genesisAccountId = await blockchain.publishGenesisAccount(genesisCreationContext);
        const genesisAccount = await blockchain.loadAccount(genesisAccountId);
        expect(genesisAccount).toBeDefined();
        expect(await genesisAccount.isIssuer()).toBeTruthy();
        console.log("Genesis account created with id ", genesisAccountId.encode());
         */




        const amazonPrivDecKey = MlKemPrivateDecryptionKey.gen();
        const deliverPrivSigKey = Secp256k1PrivateSignatureKey.gen();
        const deliverPricDecKey = MlKemPrivateDecryptionKey.gen();

        {
            // create a first account


            /*
            const firstAccountCreationContext = new AccountPublicationExecutionContext()
                .withBuyerPublicKey(firstAccountPrivateKey.getPublicKey())
                .withSellerAccount(genesisAccountId)
                .withInitialBuyerAccountAmount(CMTSToken.createCMTS(2));
            const firstAccountId = await blockchain.publishAccount(firstAccountCreationContext);
            const firstAccount = await blockchain.loadAccount(firstAccountId);
             */
            /*
            expect(await firstAccount.isIssuer()).toBeFalsy();

            // create a second account
            const secondAccountPrivateKey = MLDSA65PrivateSignatureKey.gen();
            const secondAccountCreationContext = new AccountPublicationExecutionContext()
                .withBuyerPublicKey(secondAccountPrivateKey.getPublicKey())
                .withSellerAccount(genesisAccountId)
                .withInitialBuyerAccountAmount(CMTSToken.zero())
            const secondAccountId = await blockchain.publishAccount(secondAccountCreationContext);
            const secondAccount = await blockchain.loadAccount(secondAccountId);
            expect(await secondAccount.isIssuer()).toBeFalsy();

            // proceed to a transfer from the first to the second account
            const transferContext = new AccountTransferPublicationExecutionContext()
                .withTransferToAccountHash(firstAccountPrivateKey, secondAccountId)
                .withAmount(CMTSToken.oneCMTS());
            await blockchain.publishTokenTransfer(transferContext);

            // we get balances of first and second accounts
            const firstAccountBalance = await blockchain.getAccountBalance(firstAccountId);
            const secondAccountBalance = await blockchain.getAccountBalance(secondAccountId);
            {
                const secondAccountHistory = await blockchain.getAccountHistory(secondAccountId);
                expect(secondAccountHistory.getNumberOfTransactions()).toEqual(2);
                expect(secondAccountHistory.containsTransactionAtHeight(1)).toBeTruthy()
                expect(secondAccountHistory.containsTransactionAtHeight(2)).toBeTruthy()
                expect(secondAccountHistory.containsTransactionAtHeight(3)).toBeFalsy()
                const firstTransaction = secondAccountHistory.getTransactionAtHeight(1);
                const secondTransaction = secondAccountHistory.getTransactionAtHeight(2);
                expect(firstTransaction.isPurchase()).toBeTruthy()
                expect(secondTransaction.isReceivedPayment()).toBeTruthy()
                expect(secondTransaction.isPositive()).toBeTruthy()
                expect(secondTransaction.isReceivedIssuance()).toBeFalsy()
                const firstTransactionAmount = firstTransaction.getAmount();
                const secondTransactionAmount = secondTransaction.getAmount();
                expect(secondTransactionAmount.isPositive()).toBeTruthy()
            }

            {
                // we get the history of the first account
                // We expect two transactions: one for account issuing and another for the transfer to the second account
                const firstAccountHistory = await blockchain.getAccountHistory(firstAccountId);
                expect(firstAccountHistory.getNumberOfTransactions()).toEqual(3);
                expect(firstAccountHistory.containsTransactionAtHeight(1)).toBeTruthy();
                expect(firstAccountHistory.containsTransactionAtHeight(2)).toBeTruthy();
                expect(firstAccountHistory.containsTransactionAtHeight(3)).toBeTruthy();
                expect(firstAccountHistory.containsTransactionAtHeight(4)).toBeFalsy();
                const firstTransaction = firstAccountHistory.getTransactionAtHeight(1);
                const secondTransaction = firstAccountHistory.getTransactionAtHeight(2);
                const thirdTransaction = firstAccountHistory.getTransactionAtHeight(3);
                const firstTransactionAmount = firstTransaction.getAmount();
                const secondTransactionAmount = secondTransaction.getAmount();
                expect(secondTransactionAmount.isPositive()).toBeFalsy()
                expect(thirdTransaction.isPaidFees()).toBeTruthy();
            }
            */
        }

        {
            /*
            // Testing organization
            const organizationCreationContext = new OrganizationPublicationExecutionContext()
                .withCity("Paris")
                .withCountryCode("FR")
                .withName("Carmentis SAS")
                .withWebsite("www.carmentis.io");
            const organizationId = await blockchain.publishOrganization(organizationCreationContext);
            const organization = await blockchain.loadOrganization(organizationId);
            expect(organization.getCity()).toEqual("Paris");
            expect(organization.getCountryCode()).toEqual("FR");
            expect(organization.getName()).toEqual("Carmentis SAS");
            expect(organization.getWebsite()).toEqual("www.carmentis.io");
            expect(organization.getPublicKey()).toBeDefined()

            // update organization
            const organizationUpdateContext = new OrganizationPublicationExecutionContext()
                .withExistingOrganizationId(organizationId)
                .withWebsite("https://www.carmentis.io");
            await blockchain.publishOrganization(organizationUpdateContext);
            const updatedOrganization = await blockchain.loadOrganization(organizationId);
            expect(updatedOrganization.getWebsite()).toEqual("https://www.carmentis.io");

            */

            // Testing validator node
            /* The validator set cannot be updated with validators having zero voting power
            {
                const CometPublicKeyType = "tendermint/PubKeyEd25519";
                const CometPublicKey = "a5XTiHqlMwWLDpiBCcSk019gEPx9HAuICx0eouEVpaE=";
                const RpcEndpoint = "http://this-goes-nowhere.com:26667";

                const validatorNodeCreationContext = new ValidatorNodePublicationExecutionContext()
                    .withOrganizationId(organizationId)
                    .withRpcEndpoint(RpcEndpoint)
                    .withCometPublicKeyType(CometPublicKeyType)
                    .withCometPublicKey(CometPublicKey);
                const validatorNodeId = await blockchain.publishValidatorNode(validatorNodeCreationContext);
                const validatorNode = await blockchain.loadValidatorNode(validatorNodeId);
                expect(validatorNode.getCometPublicKeyType()).toEqual(CometPublicKeyType);
                expect(validatorNode.getCometPublicKey()).toEqual(CometPublicKey);
                expect(validatorNode.getRpcEndpoint()).toEqual(RpcEndpoint);

                const validatorNodeNetworkIntegrationPublicationContext = new ValidatorNodeNetworkIntegrationPublicationExecutionContext()
                    .withExistingValidatorNodeId(validatorNodeId)
                    .withVotingPower(10);
                await blockchain.publishValidatorNodeNetworkIntegration(validatorNodeNetworkIntegrationPublicationContext);
                const reloadedValidatorNode = await blockchain.loadValidatorNode(validatorNodeId);
                expect(reloadedValidatorNode.getVotingPower()).toEqual(0);
            }
             */

            /*
            // Testing application
            const applicationCreationContext = new ApplicationPublicationExecutionContext()
                .withOrganizationId(organizationId)
                .withApplicationName("My application");
            const applicationId = await blockchain.publishApplication(applicationCreationContext);
            const application = await blockchain.loadApplication(applicationId);
            expect(application.getName()).toEqual("My application");

            // update the application
            const applicationUpdateContext = new ApplicationPublicationExecutionContext()
                .withExistingApplicationId(applicationId)
                .withApplicationName("My updated application");
            await blockchain.publishApplication(applicationUpdateContext);
            const updatedApplication = await blockchain.loadApplication(applicationId);
            expect(updatedApplication.getName()).toEqual("My updated application");

            {
                // Testing application ledger by submitting two elements
                const data = {
                    firstname: "John",
                    lastname: "Doe",
                    email: "john.doe@gmail.com",
                    phone: "+33 06 12 34 56 78",
                    address: "12 rue de la paix"
                };
                const dataExpectedToBeObtainedByExternal = {}
                const dataExpectedToBeObtainedByAmazon = data;
                const dataExpectedToBeObtainedByDeliver = {
                    firstname: data.firstname,
                    lastname: data.lastname,
                    phone: data.phone,
                    address: data.address
                }

                const object = {
                    applicationId: applicationId.encode(),
                    data,
                    actors: [
                        { name: "amazon" },
                        { name: "deliver" }
                    ],
                    channels: [
                        { name: "userInformationChannel", public: false },
                        { name: "addressInformationChannel", public: false },
                    ],
                    channelAssignations: [
                        { channelName: "userInformationChannel", fieldPath: "this.*" },
                        { channelName: "addressInformationChannel", fieldPath: "this.address" },
                        { channelName: "addressInformationChannel", fieldPath: "this.phone" },
                        { channelName: "addressInformationChannel", fieldPath: "this.firstname" },
                        { channelName: "addressInformationChannel", fieldPath: "this.lastname" },
                    ],
                    actorAssignations: [
                        // no need to create the actor assignations because all (private) channels created here are automatically
                        // associated to the author.
                    ],
                    author: "amazon"
                };



                let provider = ProviderFactory.createKeyedProviderExternalProvider(issuerPrivateKey, NODE_URL);

                const newAppLedger = new ApplicationLedger({provider});
                newAppLedger.setExpirationDurationInDays(365);
                await newAppLedger._processJson(amazonPrivDecKey, object);
                await newAppLedger.subscribeActor(
                    "deliver",
                    deliverPrivSigKey.getPublicKey(),
                    deliverPricDecKey.getPublicKey()
                )
                await newAppLedger.inviteActorOnChannel("deliver", "addressInformationChannel", amazonPrivDecKey)
                newAppLedger.setGasPrice(CMTSToken.createCMTS(2));
                const appLedgerId = await newAppLedger.publishUpdates();

                // reload the application ledger
                let appLedger = new ApplicationLedger({provider});
                await appLedger._load(appLedgerId.toBytes());
                let recoveredData = await appLedger.getRecord(1, amazonPrivDecKey);
                expect(recoveredData).toEqual(dataExpectedToBeObtainedByAmazon);

                // reload the application ledger, this time using an external identity
                const externalSigPrivKey = MLDSA65PrivateSignatureKey.gen();
                const externalPrivKey = MlKemPrivateDecryptionKey.gen();
                const externalProvider = ProviderFactory.createKeyedProviderExternalProvider(externalSigPrivKey, NODE_URL);
                appLedger = new ApplicationLedger({provider: externalProvider});
                await appLedger._load(appLedgerId.toBytes());
                recoveredData = await appLedger.getRecord(1, externalPrivKey);
                expect(recoveredData).toEqual(dataExpectedToBeObtainedByExternal);

                console.log("----------------------[ Deliver ]-----------------------")
                // reload the application ledger, this time using the deliver identity
                const deliveryProvider = ProviderFactory.createKeyedProviderExternalProvider(deliverPrivSigKey, NODE_URL)
                appLedger = new ApplicationLedger({provider: deliveryProvider});
                await appLedger._load(appLedgerId.toBytes());
                recoveredData = await appLedger.getRecord(1, deliverPricDecKey);
                expect(recoveredData).toEqual(dataExpectedToBeObtainedByDeliver);

            }
            */
            // -------------------------------------------------------------------------------------------------
            // ACPR
            // -------------------------------------------------------------------------------------------------
            {
                const ACPRPersonSchemaData = {
                    "$schema": "https://json-schema.org/draft/2020-12/schema",
                    "$id": "https://raw.githubusercontent.com/Blitz-BS/blitzCollection/refs/heads/main/json_schema/person.schema.json",
                    "title": "Personne",
                    "description": "Personne physique ou morale ou groupement",
                    "oneOf" : [
                        {
                            "required": ["reference"],
                            "additionalProperties": false,
                            "type": "object",
                            "properties": {
                                "$schema": {
                                    "title" : "Schéma JSON",
                                    "description" : "URL du schéma",
                                    "type": "string",
                                    "format": "uri"
                                },
                                "reference" : {
                                    "title" : "Référence",
                                    "description" : "Référence de la personne chez le client de la société de recouvrement. Cette référence doit être unique pour un client donné. Ce schéma est utilisé quand la référence à une personne déjà connue en base suffit.",
                                    "type": "string"
                                }
                            }
                        },{
                            "required": ["reference", "name", "personCategory"],
                            "type": "object",
                            "properties": {
                                "$schema": {
                                    "title" : "Schéma JSON",
                                    "description" : "URL du schéma",
                                    "type": "string",
                                    "format": "uri"
                                },
                                "reference" : {
                                    "title" : "Référence",
                                    "description" : "Référence de la personne chez le client de la société de recouvrement. Cette référence doit être unique pour un client et un créancier donné.",
                                    "type": "string"
                                },
                                "name" : {
                                    "title" : "Nom",
                                    "description" : "Exemple : Jean Dupont ou Dupont & Cie",
                                    "type": "string"
                                },
                                "personCategory" : {
                                    "title" : "Catégorie de personne",
                                    "description" : "Catégorie de personne : personne morale, personne physique ou administration",
                                    "enum" : ["legalPerson", "naturalPerson", "administration"]
                                },
                                "ability" : {
                                    "title" : "Compétence",
                                    "description" : "Compétence du tiers à agir",
                                    "enum" : ["bailiff", "administrator", "attorney", "investigator", "court", "collectionCompany", "agent", "clientAgency", "none"],
                                    "default" : "none"
                                },
                                "companyInfo" : {
                                    "title" : "Informations sur une entreprise",
                                    "description" : "Informations utiles sur une entreprise",
                                    "$ref": "./companyInfo.schema.json"
                                },
                                "contacts" : {
                                    "title" : "Contacts",
                                    "description" : "Contacts de la personne",
                                    "type": "array",
                                    "items": {
                                        "allOf": [
                                            { "$ref" : "./contact.schema.json" },
                                            {
                                                "type" : "object",
                                                "properties": {
                                                    "role" : {
                                                        "title" : "Rôle du contact pour la personne physique ou morale",
                                                        "description" : "Exemple : commercial, responsable administratif, épouse, époux",
                                                        "type": "string",
                                                        "maxLength": 20
                                                    }
                                                }
                                            }
                                        ],
                                        "unevaluatedProperties": false
                                    }
                                },
                                "bankAccount" : {
                                    "title" : "Compte bancaire",
                                    "description" : "Compte bancaire",
                                    "$ref": "./bankAccount.schema.json"
                                }
                            }
                        }
                    ]
                }

                /*
                const record = {

                }

                let provider = ProviderFactory.createKeyedProviderExternalProvider(issuerPrivateKey, NODE_URL);

                const newAppLedger = new ApplicationLedger({provider});
                newAppLedger.setExpirationDurationInDays(365);
                await newAppLedger._processJson(amazonPrivDecKey, ACPRPersonSchemaData);
                await newAppLedger.inviteActorOnChannel("deliver", "addressInformationChannel", amazonPrivDecKey)
                newAppLedger.setGasPrice(CMTSToken.createCMTS(2));
                const appLedgerId = await newAppLedger.publishUpdates();

                 */
            }





            /*
            const recordPublicationContext = new RecordPublicationExecutionContext()
                .withGasPrice(CMTSToken.createCMTS(2))
                .withExpirationIn(365)
                .withRecord(object);
            const appLedgerId = await blockchain.publishRecord(firstAccountPrivateDecryptionKey, recordPublicationContext, true);
            const appLedger = await blockchain.loadApplicationLedger(appLedgerId);
            const recoveredData = await appLedger.getRecordAtHeight(1, firstAccountPrivateDecryptionKey);
            expect(recoveredData).toEqual({
                email: data.email,
                phone: data.phone
            });

             */

            /* TODO: need fix
            const secondData = {
                firstname: "Foo",
                lastname: "Bar",
                email: "foo.bar@gmail.com"
            };
            const otherObject: RecordDescription = {
                virtualBlockchainId: appLedgerId.encode(),
                applicationId: applicationId.encode(),
                data: secondData,
                channelAssignations: [
                    { channelName: "mainChannel", fieldPath: "this.*" }
                ],
                actorAssignations: [
                    { channelName: "mainChannel", actorName: "seller" }
                ],
                author: "seller"
            };

            const secondRecordPublicationContext = new RecordPublicationExecutionContext()
                .withGasPrice(CMTSToken.createCMTS(2))
                .withRecord(otherObject);
            await blockchain.publishRecord(firstAccountPrivateDecryptionKey, secondRecordPublicationContext);
            const secondAppLedger = await blockchain.loadApplicationLedger(appLedgerId);
            expect(await secondAppLedger.getRecordAtHeight(2, firstAccountPrivateDecryptionKey)).toEqual(secondData);

             */

            /*
            // we export the proof
            const proofBuilder = await blockchain.createProofBuilderForApplicationLedger(appLedgerId);
            const proof = await proofBuilder.exportProofForEntireVirtualBlockchain("Gael Marcadet", firstAccountPrivateDecryptionKey);
            const proofVerificationResult = await blockchain.verifyProofFromJson(proof);
            expect(proofVerificationResult.isVerified()).toBeTruthy();

             */
        }

        /*
        {
            // Testing access to all items
            const accounts = await blockchain.getAllAccounts();
            const organizations = await blockchain.getAllOrganizations();
            const applications = await blockchain.getAllApplications();
            const nodes = await blockchain.getAllValidatorNodes();

            expect(accounts).toBeInstanceOf(Array);
            expect(accounts.length).toBeGreaterThanOrEqual(2);
            expect(organizations).toBeInstanceOf(Array);
            expect(organizations.length).toBeGreaterThanOrEqual(1);
            expect(applications).toBeInstanceOf(Array);
            expect(applications.length).toBeGreaterThanOrEqual(1);
            expect(nodes).toBeInstanceOf(Array);
            expect(nodes.length).toBeGreaterThanOrEqual(1);
        }

        {
            // Testing first block information
            const firstBlockInformation = await blockchain.getBlockInformation(1);
            expect(firstBlockInformation).toBeDefined();
            expect(firstBlockInformation.anchoredAt()).toBeInstanceOf(Date);
            expect(firstBlockInformation.getBlockHash()).toBeInstanceOf(Hash);

            // Testing access chain information
            const chainInformation = await blockchain.getChainInformation();
            expect(chainInformation).toBeDefined();
            expect(chainInformation.getHeight()).toBeGreaterThanOrEqual(1);
            expect(chainInformation.getLatestPublicationTime().getTime()).toBeLessThan(new Date().getTime());
        }

         */
    }, TEST_TIMEOUT)

    it('Invalid usage of BlockchainFacade: Unknown account', async () =>  {
        /*
        const unknownAccountHash = Hash.from("00000000000000000000000000D788B255BD69B9F3019EF60105F160BE7A73C0");

        // search for unknown account history
        await expect(async () => await blockchain.getAccountHistory(unknownAccountHash))
            .rejects
            .toThrow(AccountNotFoundForAccountHashError);

        // search for unknown account state
        await expect(async () => await blockchain.getAccountState(unknownAccountHash))
            .rejects
            .toThrow(AccountNotFoundForAccountHashError);

        // search for unknown account balance
        await expect(async () => await blockchain.getAccountBalance(unknownAccountHash))
            .rejects
            .toThrow(AccountNotFoundForAccountHashError);

        // search for unknown organization
        await expect(async () => await blockchain.loadOrganization(unknownAccountHash))
            .rejects
            .toThrow(OrganizationNotFoundError)

        // search for unkown application
        await expect(async () => await blockchain.loadApplication(unknownAccountHash))
            .rejects
            .toThrow(VirtualBlockchainNotFoundError)

        // search for unknown application ledger
        await expect(async () => await blockchain.loadApplicationLedger(unknownAccountHash))
            .rejects
            .toThrow(ApplicationLedgerNotFoundError)

         */

    }, TEST_TIMEOUT);

    /*
    it('Should fails when creating an (issuer) account with the same key', async () => {
        await expect(async () => {
            const genesisCreationContext = new PublicationExecutionContext();
            const genesisAccountId = await blockchain.publishGenesisAccount(genesisCreationContext);
        }).rejects.toThrow(CarmentisError);
    });
     */


    /*
    it('Should fails for transfer when no enough balance', async () =>  {


        // create a first account
        const genesisAccountId = await blockchain.getAccountHashFromPublicKey(issuerPrivateKey.getPublicKey());
        const firstAccountPrivateKey = MLDSA65PrivateSignatureKey.gen();
        const firstAccountCreationContext = new AccountPublicationExecutionContext()
            .withBuyerPublicKey(firstAccountPrivateKey.getPublicKey())
            .withSellerAccount(genesisAccountId)
            .withInitialBuyerAccountAmount(CMTSToken.createCMTS(2));
        const firstAccountId = await blockchain.createAndPublishAccount(firstAccountCreationContext);
        const firstAccount = await blockchain.loadAccount(firstAccountId);

        // create a second account
        const secondAccountPrivateKey = MLDSA65PrivateSignatureKey.gen();
        const secondAccountCreationContext = new AccountPublicationExecutionContext()
            .withBuyerPublicKey(secondAccountPrivateKey.getPublicKey())
            .withSellerAccount(genesisAccountId)
            .withInitialBuyerAccountAmount(CMTSToken.zero())
        const secondAccountId = await blockchain.createAndPublishAccount(secondAccountCreationContext);
        const secondAccount = await blockchain.loadAccount(secondAccountId);

        // proceed to a transfer between the first and the second account
        const transferContext = new AccountTransferPublicationExecutionContext()
            .withTransferToAccountHash(firstAccountPrivateKey, secondAccountId)
            .withAmount(CMTSToken.createCMTS(10000)); // too many tokens transferred here
        await expect(blockchain.publishTokenTransfer(transferContext)).rejects.toThrow(CarmentisError);


    });

     */
});
