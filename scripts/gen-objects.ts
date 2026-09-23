import {CryptoEncoderFactory} from "../src/crypto/encoder/CryptoEncoderFactory";
import {ProviderFactory} from "../src/providers/ProviderFactory";
import {Logger} from "../src/utils/Logger";
import {Microblock} from "../src/blockchain/microblock/Microblock";
import {CMTSToken} from "../src/economics/currencies/token";
import {Secp256k1PrivateSignatureKey} from "../src/crypto/signature/secp256k1/Secp256k1PrivateSignatureKey";
import {SectionType} from "../src/type/valibot/blockchain/section/SectionType";
import {Utils} from "../src/utils/utils";

const NODE_URL = "http://localhost:26657";
const nodeUrl = NODE_URL;
const provider = ProviderFactory.createInMemoryProviderWithExternalProvider(nodeUrl);
const sigEncoder = CryptoEncoderFactory.defaultStringSignatureEncoder();
const encodedSk = 'sig:secp256k1:sk:cd42ad5f7a7823f3ab4da368ea4f807fa8246526ea4ea7eeb4879c42048916a5';

// set up the logger
Logger.enableLogs();

const BATCH_SIZE = 100;

run();

async function run() {
    const sellerSk = await sigEncoder.decodePrivateKey(encodedSk);
    const sellerPk = await sellerSk.getPublicKey();
    const sellerAccountId = await provider.getAccountIdFromPublicKey(sellerPk);

    // create accounts
    const accountBatch = [];

    for (let n = 0; n < BATCH_SIZE; n++) {
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
        const promise = provider.awaitMicroblockAnchoring(mb.getHash().toBytes());
        accountBatch.push({ index: n, pk, sk, promise });
    }
    await Promise.all(accountBatch.map((o) => o.promise));

    // create organizations
    const orgBatch = [];

    for (const account of accountBatch) {
        const accountId = await provider.getAccountIdFromPublicKey(account.pk);
        const carmentisOrganizationMicroblock = Microblock.createGenesisOrganizationMicroblock();
        carmentisOrganizationMicroblock.addSections([
            {
                type: SectionType.ORG_CREATION,
                accountId: accountId.toBytes(),
            },
            {
                type: SectionType.ORG_DESCRIPTION,
                name: `ACME ${account.index}`,
                website: '',
                countryCode: 'FR',
                city: 'Paris',
            },
        ]);
        carmentisOrganizationMicroblock.setFeesPayerAccount(accountId.toBytes());
        carmentisOrganizationMicroblock.setTimestamp(Utils.getTimestampInSeconds());
        carmentisOrganizationMicroblock.setGasPrice(CMTSToken.createMilliToken(1));
        await carmentisOrganizationMicroblock.setGasAndSeal(provider, account.sk);
        const { microblockHash: orgId } = carmentisOrganizationMicroblock.serialize();
        await provider.publishMicroblock(carmentisOrganizationMicroblock);
        const promise = provider.awaitMicroblockAnchoring(carmentisOrganizationMicroblock.getHash().toBytes());
        orgBatch.push({ index: account.index, sk: account.sk, accountId, orgId, promise });
    }
    await Promise.all(orgBatch.map((o) => o.promise));

    // create applications
    const appBatch = [];

    for (const org of orgBatch) {
        const applicationMicroblock = Microblock.createGenesisApplicationMicroblock();
        applicationMicroblock.addSections([
            {
                type: SectionType.APP_CREATION,
                organizationId: org.orgId,
            },
            {
                type: SectionType.APP_DESCRIPTION,
                name: `Application ${org.index}`,
                logoUrl: '',
                homepageUrl: 'FR',
                description: 'A test application',
            },
        ]);
        applicationMicroblock.setFeesPayerAccount(org.accountId.toBytes());
        applicationMicroblock.setTimestamp(Utils.getTimestampInSeconds());
        applicationMicroblock.setGasPrice(CMTSToken.createMilliToken(1));
        await applicationMicroblock.setGasAndSeal(provider, org.sk);
        await provider.publishMicroblock(applicationMicroblock);
        const promise = provider.awaitMicroblockAnchoring(applicationMicroblock.getHash().toBytes());
        appBatch.push({ promise });
    }
    await Promise.all(appBatch.map((o) => o.promise));
}
