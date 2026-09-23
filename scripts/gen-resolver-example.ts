import {CryptoEncoderFactory} from "../src/crypto/encoder/CryptoEncoderFactory";
import {ProviderFactory} from "../src/providers/ProviderFactory";
import {Logger} from "../src/utils/Logger";
import {Microblock} from "../src/blockchain/microblock/Microblock";
import {CMTSToken} from "../src/economics/currencies/token";
import {SectionType} from "../src/type/valibot/blockchain/section/SectionType";
import {ApplicationLedgerVb} from "../src/blockchain/virtualBlockchains/ApplicationLedgerVb";
import {VirtualBlockchainType} from "../src/type/VirtualBlockchainType";
import {WalletCrypto} from "../src/wallet/WalletCrypto";
import {
    WalletRequestBasedApplicationLedgerMicroblockBuilder
} from "../src/blockchain/virtualBlockchains/WalletRequestBasedApplicationLedgerMicroblockBuilder";
import {Hash} from "../src/entities/Hash";
import {AppLedgerMicroblockBuildRequest} from "../src/type/AppLedgerStateUpdateRequest";
import {
    PublicKeyEncryptionSchemeId
} from "../src/crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeId";
import {SignatureSchemeId} from "../src/crypto/signature/SignatureSchemeId";
import {Utils} from "../src/utils/utils";
import * as fs from 'fs';

const usePublicChannel = false;
const nodeUrl = "http://localhost:26657";
const provider = ProviderFactory.createInMemoryProviderWithExternalProvider(nodeUrl);
const sigEncoder = CryptoEncoderFactory.defaultStringSignatureEncoder();
const encodedSk = "sig:secp256k1:sk:e94dfef251c2da1feda001a82137f40a6517a544e4ac6eedb2a88f5aa98c4dd4";

// set up the logger
Logger.enableLogs();

run();

async function run() {
    const sk = await sigEncoder.decodePrivateKey(encodedSk);
    const pk = await sk.getPublicKey();

    // create organization
    const accountId = await provider.getAccountIdFromPublicKey(pk);
    const carmentisOrganizationMicroblock = Microblock.createGenesisOrganizationMicroblock();
    carmentisOrganizationMicroblock.addSections([
        {
            type: SectionType.ORG_CREATION,
            accountId: accountId.toBytes(),
        },
        {
            type: SectionType.ORG_DESCRIPTION,
            name: `ACME`,
            website: '',
            countryCode: 'FR',
            city: 'Paris',
        },
    ]);
    carmentisOrganizationMicroblock.setFeesPayerAccount(accountId.toBytes());
    carmentisOrganizationMicroblock.setTimestamp(Utils.getTimestampInSeconds());
    carmentisOrganizationMicroblock.setGasPrice(CMTSToken.createMilliToken(1));
    await carmentisOrganizationMicroblock.setGasAndSeal(provider, sk);
    const { microblockHash: orgId } = carmentisOrganizationMicroblock.serialize();
    await provider.publishMicroblock(carmentisOrganizationMicroblock);
    await provider.awaitMicroblockAnchoring(carmentisOrganizationMicroblock.getHash().toBytes());

    // create application
    const applicationMicroblock = Microblock.createGenesisApplicationMicroblock();
    applicationMicroblock.addSections([
        {
            type: SectionType.APP_CREATION,
            organizationId: orgId,
        },
        {
            type: SectionType.APP_DESCRIPTION,
            name: `My Application`,
            logoUrl: '',
            homepageUrl: 'FR',
            description: 'A test application',
        },
    ]);
    applicationMicroblock.setFeesPayerAccount(accountId.toBytes());
    applicationMicroblock.setTimestamp(Utils.getTimestampInSeconds());
    applicationMicroblock.setGasPrice(CMTSToken.createMilliToken(1));
    await applicationMicroblock.setGasAndSeal(provider, sk);
    const { microblockHash: appId } = applicationMicroblock.serialize();
    await provider.publishMicroblock(applicationMicroblock);
    await provider.awaitMicroblockAnchoring(applicationMicroblock.getHash().toBytes());

    // create application ledgers
    // Eleve
    const studentVbId = await createApplicationLedger({
        prenom : "Martin",
        nom : "Durand",
        date_naissance : "2008-08-01",
        niveau : "Terminal",
        classe : "T3"
    });

    // Professeur
    const teacherVbId = await createApplicationLedger({
        prenom : "Martine",
        nom : "Dupont",
        date_naissance : "1973-12-20"
    });

    // Epreuve 1
    const test1VbId = await createApplicationLedger({
        matiere : "Mathématique",
        coefficient : 3,
        date : "2026-08-26"
    });

    // Epreuve 2
    const test2VbId = await createApplicationLedger({
        matiere : "Anglais",
        coefficient : 3,
        date : "2026-08-26"
    });

    // Note 1
    const gradeVbId = await createApplicationLedger({
        eleve: `cmts://resolve/al/${studentVbId}/mb/h/1`,
        professeur: `cmts://resolve/al/${teacherVbId}/mb/h/1`,
        epreuve: `cmts://resolve/al/${test1VbId}/mb/h/1`,
        note: 18.5,
        appreciation: "Excellent travail"
    });

    // Note 2
    await createApplicationLedger({
        eleve: `cmts://resolve/al/${studentVbId}/mb/h/1`,
        professeur: `cmts://resolve/al/${teacherVbId}/mb/h/1`,
        epreuve: `cmts://resolve/al/${test2VbId}/mb/h/1`,
        note: 7.5,
        appreciation: "Travail insuffisant"
    }, gradeVbId);

    // Bulletin 
    const reportVbId = await createApplicationLedger({
        _representation: "...",
        eleve: `cmts://resolve/al/${studentVbId}/mb/h/1`,
        periode: {
            debut: "2026-01-01",
            fin: "2026-03-30"
        },
        moyenne: 13,
        appreciation: "Bon trimestre",
        notes: [
            `cmts://resolve/al/${gradeVbId}/mb/h/1`,
            `cmts://resolve/al/${gradeVbId}/mb/h/2`,
        ]
    });

    const rootObject = {
        linkedJson: {
            report: `cmts://resolve/al/${reportVbId}/mb/h/1`
        },
        policies: {            
        }
    };

    const json = JSON.stringify(rootObject, null, 2);
    fs.writeFileSync("resolverQuery.json", json);

    async function createApplicationLedger(data: object, vbId?: string): Promise<string> {
        let applicationLedger;
        if (vbId) {
            applicationLedger = await provider.loadApplicationLedgerVirtualBlockchain(Hash.from(vbId));
        }
        else {
            applicationLedger = ApplicationLedgerVb.createApplicationLedgerVirtualBlockchain(provider);
        }
        const expirationDay = Utils.addDaysToTimestamp(
            Utils.getTimestampInSeconds(),
            10
        );
        const tempMb = Microblock.createGenesisMicroblock(
            VirtualBlockchainType.APP_LEDGER_VIRTUAL_BLOCKCHAIN,
            expirationDay
        );
        const vbSeed = tempMb.getPreviousHash();
        const walletCrypto = WalletCrypto.generateWallet();
        const accountCrypto = walletCrypto.getDefaultAccountCrypto();
        const actorCrypto = accountCrypto.getActor(vbSeed.toBytes());
        const mbBuilder = await WalletRequestBasedApplicationLedgerMicroblockBuilder.createFromVirtualBlockchain(
            Hash.from(appId),
            applicationLedger
        );
        let request: AppLedgerMicroblockBuildRequest;
        if (vbId) {
            request = {
                virtualBlockchainId: vbId,
                author: 'appOperator',
                endorser: 'user',
                data,
                channelAssignations: [
                    {
                        channelName: 'mainChannel',
                        fieldPath: 'this.*'
                    }
                ],
            };
        }
        else {
            request = {
                author: 'appOperator',
                endorser: 'user',
                data,
                channels: [
                    {
                        name: 'mainChannel',
                        public: usePublicChannel,
                    }
                ],
                channelAssignations: [
                    {
                        channelName: 'mainChannel',
                        fieldPath: 'this.*'
                    }
                ],
                actors: [
                    { name: "appOperator" },
                    { name: "user" },
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
            };
            await mbBuilder.subscribeActor(
                'user',
                await actorCrypto.getPublicSignatureKey(SignatureSchemeId.SECP256K1),
                await actorCrypto.getPublicEncryptionKey(PublicKeyEncryptionSchemeId.ML_KEM_768_AES_256_GCM)
            );
        }
        const appLedgerMicroblock = await mbBuilder.createMicroblockFromStateUpdateRequest(
            accountCrypto,
            request
        );
        let previousHash: Hash;
        if (vbId) {
            const lastMb = await applicationLedger.getLastMicroblock();
            previousHash = lastMb.getHash();
        }
        else {
            previousHash = vbSeed;
        }
        appLedgerMicroblock.setPreviousHash(previousHash);
        appLedgerMicroblock.setFeesPayerAccount(accountId.toBytes());
        appLedgerMicroblock.setTimestamp(Utils.getTimestampInSeconds());
        appLedgerMicroblock.setGasPrice(CMTSToken.createMilliToken(1));
        await appLedgerMicroblock.setGasAndSeal(provider, sk);
        const {microblockHash: applicationLedgerId} = appLedgerMicroblock.serialize();
        await provider.publishMicroblock(appLedgerMicroblock);
        await provider.awaitMicroblockAnchoring(appLedgerMicroblock.getHash().toBytes());

        return Utils.binaryToHexa(applicationLedgerId);
    }
}
