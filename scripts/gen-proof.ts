import {Hash} from "../src/entities/Hash";
import {CryptoEncoderFactory} from "../src/crypto/encoder/CryptoEncoderFactory";
import {ProviderFactory} from "../src/providers/ProviderFactory";
import {Logger} from "../src/utils/Logger";
import {Microblock} from "../src/blockchain/microblock/Microblock";
import {CMTSToken} from "../src/economics/currencies/token";
import {Secp256k1PrivateSignatureKey} from "../src/crypto/signature/secp256k1/Secp256k1PrivateSignatureKey";
import {SectionType} from "../src/type/valibot/blockchain/section/SectionType";
import {Utils} from "../src/utils/utils";
import {VirtualBlockchainType} from "../src/type/VirtualBlockchainType";
import * as fs from 'fs';

const NODE_URL = "http://localhost:26657";
import * as v from 'valibot';
import {ProtocolVariablesSchema} from "../src/type/valibot/blockchain/protocol/ProtocolVariables";
import {WalletCrypto} from "../src/wallet/WalletCrypto";
import {ApplicationLedgerVb} from "../src/blockchain/virtualBlockchains/ApplicationLedgerVb";
import {
    WalletRequestBasedApplicationLedgerMicroblockBuilder
} from "../src/blockchain/virtualBlockchains/WalletRequestBasedApplicationLedgerMicroblockBuilder";
import {AppLedgerMicroblockBuildRequest} from "../src/type/AppLedgerStateUpdateRequest";
import {SignatureSchemeId} from "../src/crypto/signature/SignatureSchemeId";
import {
    PublicKeyEncryptionSchemeId
} from "../src/crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeId";

const nodeUrl = NODE_URL;
const provider = ProviderFactory.createInMemoryProviderWithExternalProvider(nodeUrl);
const sigEncoder = CryptoEncoderFactory.defaultStringSignatureEncoder();
const encodedSk = 'SIG:SECP256K1:SK{cd42ad5f7a7823f3ab4da368ea4f807fa8246526ea4ea7eeb4879c42048916a5}';

// set up the logger
Logger.enableLogs();

async function getProtocolVariables() {
    const protocolParams = await provider.getProtocolState();
    const parseResult = v.safeParse(ProtocolVariablesSchema, protocolParams.getProtocolVariables());
    return protocolParams.getProtocolVariables()
}

test();

async function test() {
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

    // get the organization VB with the null memory provider,
    // to force the data to be fetched from the network
    const debugProvider = ProviderFactory.createNullInMemoryProviderWithExternalProvider(nodeUrl);
    const vbStatus2 = await debugProvider.getVirtualBlockchainStatus(carmentisOrgId);

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
        fs.writeFileSync(`C:/Users/arnau/Desktop/Proof-${author}.json`, JSON.stringify(proofWrapper, null, 2));
        console.log(JSON.stringify(proofWrapper, null, 2));
    }
}
