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

const NODE_URL = "http://localhost:26657";
const nodeUrl = NODE_URL;
const provider = ProviderFactory.createInMemoryProviderWithExternalProvider(nodeUrl);
const sigEncoder = CryptoEncoderFactory.defaultStringSignatureEncoder();
const encodedSk = 'sig:secp256k1:sk:cd42ad5f7a7823f3ab4da368ea4f807fa8246526ea4ea7eeb4879c42048916a5';

// set up the logger
Logger.enableLogs();

test();

async function test() {
    const sellerSk = await sigEncoder.decodePrivateKey(encodedSk);
    const sellerPk = await sellerSk.getPublicKey();
    const sellerAccountId = await provider.getAccountIdFromPublicKey(sellerPk);

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
    await mb.setGasAndSeal(provider, sellerSk);
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
    carmentisOrganizationMicroblock.setGasPrice(CMTSToken.createMilliToken(1));
    await carmentisOrganizationMicroblock.setGasAndSeal(provider, sk);
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
    carmentisOrganizationSecondMicroblock.setGasPrice(CMTSToken.createMilliToken(1));
    await carmentisOrganizationSecondMicroblock.setGasAndSeal(provider, sk);
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
    applicationMicroblock.setGasPrice(CMTSToken.createMilliToken(1));
    await applicationMicroblock.setGasAndSeal(provider, sk);
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
                emailCredential: {
                    __sd_jwt__: "eyJ0eXAiOiJ2YytzZC1qd3QiLCJhbGciOiJFZERTQSJ9.eyJpc3MiOiJkaWQ6andrOmV5SmpjbllpT2lKRlpESTFOVEU1SWl3aWVDSTZJa3R6Y0RKNlVHdElYM3BhT0ZjdE1ETkxNeTFaUTJaR1prSldSRzlsTTBnNE5GTTBiV1pyY0RSMlpsRWlMQ0pyZEhraU9pSlBTMUFpTENKNE5XTWlPbHNpVFVsSlFteEVRME5CVldGblFYZEpRa0ZuU1ZWSlRXaFVkVE5rZFM5QlpWcE5NM0J6WmtSRVdYZHNMMmcwU0VWM1FsRlpSRXN5Vm5kTlIyOTRSV3BCVVVKblRsWkNRVTFOUTFWT2FHTnRNV3hpYmxKd1kzcEZVMDFDUVVkQk1WVkZRM2QzU2xFeVJubGlWMVoxWkVkc2VrMVJjM2REVVZsRVZsRlJSMFYzU2tkVmFrVlFUVUV3UjBFeFZVVkRRWGRIVW01S2FHSnRUbXhOVVRSM1JFRlpSRlpSVVVoRVFWWlJXVmhLY0dONlJWTk5Ra0ZIUVRGVlJVTm5kMHBSTWtaNVlsZFdkV1JIYkhwTlFqUllSRlJKTWsxRVdYcE5SRUUxVFZSSk1VMXNiMWhFVkVrelRVUlplazFFUVRWTlZFa3hUV3h2ZDJGcVJWTk5Ra0ZIUVRGVlJVRjNkMHBSTWtaNVlsZFdkV1JIYkhwTlVrbDNSVUZaUkZaUlVVeEVRV3hFV1ZoS2RGcFhOVEJoV0UxNFEzcEJTa0puVGxaQ1FWbFVRV3RhVTAxUk9IZEVVVmxFVmxGUlNVUkJXa2RqYlVaMVdUSlZlRVJxUVUxQ1owNVdRa0ZqVFVKV1FtaGpiV3g2VFZKSmQwVkJXVVJXVVZGTFJFRnNSRmxZU25SYVZ6VXdZVmhOZDB0cVFVWkNaMDF5V2xoQlJFbFJRWEY1Ym1KTksxRm1MMDV1ZUdJM1ZHTnlaalZuU2poV09FWlZUMmczWTJaNmFFeHBXaXRUYm1rNU9VUkJSa0puVFhKYVdFRkVVVkZFVUV0VGRrVm9aelp2WTFwa1dqbFlZa2xuWjBOclJrdDRWVlV4ZVdKWmFGVnNaVVkxYTA1R05FTjBUVFI1Tm1oSFJqTXJRM0pHVnpWdldrUnRaM0V5TTBWME0zUnJWSGh1U1haU1NWcHhlVVJUTUdSSlFTSmRmUSIsImlhdCI6MTc4MzAwNTQwOSwidmN0IjoiRW1haWxDcmVkZW50aWFsIiwic3ViIjoic2lnOnNlY3AyNTZrMTpwazowMjM3NGIzOTUyMWRjMDhjYmFmYzc2ZDc4ZTliNDQ0MzMwZDJhZDFiYTFiMDE2NzA2MzA0NGUzODI3Mzg1NDkyZGMiLCJqdGkiOiJmNDk2ZTFjMy1iYzBmLTRkNDQtOWRjOS1mMzc2OGU5Y2FhYjgiLCJzdGF0dXMiOnsic3RhdHVzX2xpc3QiOnsiaWR4IjoxLCJ1cmkiOiJodHRwOi8vaXNzdWVyLmFkbWluLmNhcm1lbnRpcy5pby9hcGkvZGVtby12Yy1lbWFpbC9jcmVkZW50aWFsL3N0YXR1cyJ9fSwiX3NkIjpbIkEyZ2RtVENCRnVmSlp1ekR5VnZNNTIxU0VlMFdEaEM1RHB4V3NTSGVKVkUiLCJPb1lkbzJMU2V1SlkzWXNiMk5rM0RxWVVYQkwtTnUwdTkyQnVfWnJEdldJIiwiUXo3eTQ4UlhubDJ4aDZzRGFweExidFNwWmh3MzZTclNiNi1jOHJ5SGxXayIsImZvd0RwbVR0M19WVlNqQkJwTTlPRW5BQmVBeDlaaVQzcDlHWnRSc0VkMUUiXSwiX3NkX2FsZyI6InNoYS0yNTYifQ.1lU_gF8Boc1VAGbTnI8f4YFULZwF9viN2irEhH5bjBd6tnSnODnKqFllXm9_ZdOe1D1OIXslp3X-u9YhqlnPCg~WyJfdURhVzdkWDF1N21ua1ozVG0zTFVnIiwiZW1haWwiLCJnYW1hcmNhZGV0QGdtYWlsLmNvbSJd~WyJSZ0hjOG1RQi13Y2tCVExpWU13cnFnIiwiY29kZSIsIjM2MjA4NyJd~WyJHenFUVVdmdFBmWHFQZ2Z0RXRaVXlnIiwiY29kZVNlbnRBdCIsIjIwMjYtMDctMDJUMTU6MTY6MzIuMjYyWiJd~WyIxeTVLZkFmWGpMZjZxY0F5LUt2Y1h3IiwiY29kZVZlcmlmaWVkQXQiLCIyMDI2LTA3LTAyVDE1OjE2OjQ5LjQzM1oiXQ~"
                },
                credential: {
                    __sd_jwt__: "eyJ0eXAiOiJ2YytzZC1qd3QiLCJhbGciOiJFZERTQSJ9.eyJpc3MiOiJkaWQ6andrOmV5SmpjbllpT2lKRlpESTFOVEU1SWl3aWVDSTZJazVzYVhWcFRHZ3laRWczVUhNeldtY3dTMEZuUVVZdFJIWXhjRFZvUVU5U0xXUXlOM1JNY0VSc1dWVWlMQ0pyZEhraU9pSlBTMUFpZlEiLCJpYXQiOjE3ODMwOTIwMjQsInZjdCI6IkNhcm1lbnRpc09uYm9hcmRpbmdDcmVkZW50aWFsIiwic3ViIjoic2lnOnNlY3AyNTZrMTpwazowMzk0NGMwMzE1NGI2MGYwNGExMTU4OGMzODQ3MjU1Mzk4MzkxNjEwM2RkZmU1ZDk0ZjY4MDM0MTZmOWZmMjI4NjIiLCJqdGkiOiJjMmM3N2NiYi1iYWFjLTQ0MmUtODBmNi00ZjFmYzk5ZmMxZjciLCJzdGF0dXMiOnsic3RhdHVzX2xpc3QiOnsiaWR4IjoyLCJ1cmkiOiJodHRwOi8vaXNzdWVyLmFkbWluLmNhcm1lbnRpcy5pby9hcGkvZGVtby1vbmJvYXJkaW5nL2NyZWRlbnRpYWwvc3RhdHVzIn19LCJmaUNvZGUiOiJkOTMzZjI5OS0zMmMxLTRiM2UtODA4Yy0wOGE5NzE3YzRmOGMiLCJlbWFpbFZlcmlmaWVkQXQiOjE3ODMwOTA2OTc0NzQsImZyYW5jZUlkZW50aXRlVmFsaWRhdGVkQXQiOjE3ODMwOTIwMjQ2NTksInJldmlld2VyIjoic2lnOnNlY3AyNTZrMTpwazowMjljNDBiZWIxNjliMmJjYmQwNjkwYjhkN2Q5MWU4NWY3MTlkMmE4NmFiMGE1MWFjNDM5ZDY5YTMzYTU4NDI4ZGUiLCJ2YklkIjpudWxsLCJ1c2VyUHVibGljS2V5Ijoic2lnOnNlY3AyNTZrMTpwazowMzk0NGMwMzE1NGI2MGYwNGExMTU4OGMzODQ3MjU1Mzk4MzkxNjEwM2RkZmU1ZDk0ZjY4MDM0MTZmOWZmMjI4NjIiLCJkZXNpcmVkVG9rZW5zIjoxMDAsInRyYW5zZmVycmVkVG9rZW5zIjoxNTAsInRyYW5zZmVyTWljcm9CbG9ja0hhc2giOiIxMjMiLCJhbmNob3JpbmdQcm9vZiI6eyJibG9jayI6eyJoZWlnaHQiOjI3LCJ2YlJhZGl4SGFzaCI6IkZBRDU4NTZFMDRENTM5Njc5MEY1NzRFRTMxNTMwMkFFRkFGMjFCQzI1MTFEODg0REQ5QzQ2NUM5NjE1M0JDN0EiLCJ0b2tlblJhZGl4SGFzaCI6IjRBOTQzN0ExMEExRTE1NTIxQkM1NzI3RkY4REIwREI0NDZGRDBDOEJENzJFMEYwOTk4MDMxNzZDNEU5MDBEN0QiLCJzdG9yYWdlSGFzaCI6IkE3MDI2NzlCODM2MzVGQzc5NjcwREM1MjkyNTJFMzI5RkQ2OEI3RjA3QjAyRUVBQkUwMUREREZDMTZENzUzQTMiLCJhcHBIYXNoIjoiMzE3OUJENjU5RUU0ODE3QkUzMkVBRkE4NzhEODk2RDZFQTc3NTg2RTczNUNGNzBGNUFFN0ZEQ0FEOEE2NUNGQiJ9LCJtaWNyb2Jsb2NrIjp7InZpcnR1YWxCbG9ja2NoYWluSWQiOiIyRkRBQjVGRDE3Q0IxMEMzOTJEMTdCNUVDRkQ3MkM2OThGNUMzRjkxRjcxNzlCRDdGOEZBMDdDMzI1MzBGRDc5IiwiaGVpZ2h0IjoxLCJoYXNoIjoiMkZEQUI1RkQxN0NCMTBDMzkyRDE3QjVFQ0ZENzJDNjk4RjVDM0Y5MUY3MTc5QkQ3RjhGQTA3QzMyNTMwRkQ3OSJ9LCJ2aXJ0dWFsQmxvY2tjaGFpbiI6eyJzZXJpYWxpemVkU3RhdGUiOiIyZC8vaUJuZ0FJWmtkSGx3Wldab1pXbG5hSFJ0Wlhod2FYSmhkR2x2YmtSaGVYSnNZWE4wVFdsamNtOWliRzlqYTBoaGMyaHViV1Z5YTJ4bFVtOXZkRWhoYzJodGFXNTBaWEp1WVd4VGRHRjBaUUVCQUZnZ0w5cTEvUmZMRU1PUzBYdGV6OWNzYVk5Y1A1SDNGNXZYK1BvSHd5VXcvWGxZSUMvYXRmMFh5eEREa3RGN1hzL1hMR21QWEQrUjl4ZWIxL2o2QjhNbE1QMTUyZC8vaEJuZ0FZSnhjMmxuYm1GMGRYSmxVMk5vWlcxbFNXUnZjSFZpYkdsalMyVjVTR1ZwWjJoMEFBRT0iLCJtZXJrbGVXaXRuZXNzZXMiOltdLCJyYWRpeFByb29mIjpbIkUwMDdCMjlBRURFMTEwQTI5MjFCQTJFODBGQzIxRUI5NUM2RDZFMkY5OEYwMjE1RDY2NTE0RTgzMjAxOURFRkY5MDUxOUVGNkU1MUM4NTE5RjlGNTkxMUI3RTkxODg1NzM1QTlFRTA3RURDOERBMkRFNEEyNEREM0IzMjIyNUNCMjhBRUVBQzU0Nzc3RjE5NzgxQTdCQTlCNjVEMDcwMjk3RUM0MTE2RTEzRTY1MjcwMTNGRTY4OUU0ODM4MzAxQjhEQjAyOUJGMEUzMEI1OERGNjk3MzM3Qzg2NkZDOEJGMzZDRTM2M0Y2QkI4NjcyNUU0NUI1RUM0M0Y2Q0Y4NEE5RTA3RkFGNjY0NzMxRkU4QUVCRjM3OUEwQzRGREZCQzkzNzcxNzIxNjEwOTAwNkI2NjdDREQ1RUE3MERENTVGMENDMDVFQzBBNEMzQUQxNUQ1QkU3ODQ0QjI5NTNDOTRBQ0Q5QTg5NDkxN0I5Q0UwQTkyMDI1QzMxRTlEODQzRjQwRDAiLCI1MDA0RTgyRjdCNTRGOEIzOUM1NEFDOTUxMUY4ODIyNTA3NUFBRDQ0NzgwOTkxMzI0MzgwN0I0RDQzNUZGMDFDQ0QwQTA1NzhGQjBFMTk4RTQ5ODI4ODI2MjU0QUE1OEI0MTg2RThDRDlCMTdEQzc4QzlGN0M2RjkxOEM0RjcwMzFCOTk3N0NDNTI2MjU4MDQ1MTQ4ODkyNDIxMjc5NUVFQTdDOTdBQUI4QzQxMUZGNUM1QzRDODQzMUZENjQ2NTBCNkE1IiwiMDAwMERBQjVGRDE3Q0IxMEMzOTJEMTdCNUVDRkQ3MkM2OThGNUMzRjkxRjcxNzlCRDdGOEZBMDdDMzI1MzBGRDc5OEIyOTlBQUM0NTFFODA5RUFBQTVGQ0QyOUExNjY2MjU0NkE5MUI1MUZBMTIxQzRGN0FFMzFFNTQ0RUQzRUZENiJdfX0sIl9zZCI6WyIyTm1hd3kxSW9OeGxGcWI5T0xrZnJtcy0xcWdrOVBjV011MlpxbG1vR3kwIiwiQk1GdlhucF9mcDlSYThXcmhGcFhPRXRWUmF6a1NTdEpOYWNtbXh1VFNBMCJdLCJfc2RfYWxnIjoic2hhLTI1NiJ9.BKpypVc8EcB0CIFGEMbGRWzb6GozjAWBKB-Z5m2S-9LlG8xyyjbq9PM94PaEwQwfNuqVsipsMVSLa7RqmdS2Bg~WyJoWXlrVVhNbHZ3ektoVWJlVEJkd1Z3IiwiZW1haWwiLCJnYW1hcmNhZGV0QGdtYWlsLmNvbSJd~WyJjT1RvN0dzYkI0SWNXS0VGY01SazdBIiwiZmlDZXJ0aWZpY2F0ZUhhc2giLCJmMGE3Y2JmM2MyNDJhNzE0NTVkMDQyMzNjNDI2NjFjN2IyMGU4M2U0MDkzZGE5NmFlMDEzZTBkYzgxMTJmNTAzIl0~"
                }
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
        appLedgerMicroblock.setGasPrice(CMTSToken.createMilliToken(1));
        await appLedgerMicroblock.setGasAndSeal(provider, sk);
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
