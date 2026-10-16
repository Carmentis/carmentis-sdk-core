import * as fs from 'fs';
import { JsonObject } from '../src/type/valibot/json/Json';
import { DigestDataHandler } from '../src/records/DigestData';
import { ResolverHydrator, ResolverOutput, MbRef } from '../src/resolver/ResolverTypes';
import { Provider } from '../src/providers/Provider';
import { Hash } from '../src/entities/Hash';
import { ApplicationLedgerVb } from "../src/blockchain/virtualBlockchains/ApplicationLedgerVb";
import { WalletCrypto } from "../src/wallet/WalletCrypto";
import { CryptoHandlerApplicationLedgerActorIdentityAdapter } from "../src/blockchain/virtualBlockchains/IApplicationLedgerActorIdentity";
import { LinkResolver } from "../src/resolver/LinkResolver";
import { Resolver } from "../src/resolver/Resolver";
import { ResolutionProofProofs } from "../src/type/valibot/proofs/ResolutionProof";
import { AppLedgerProof } from "../src/type/valibot/proofs/AppLedgerProof";
import { Test } from "../src/test/Test";

const nodeUrl = "http://localhost:26657";
const encodedSk = 'sig:secp256k1:sk:cd42ad5f7a7823f3ab4da368ea4f807fa8246526ea4ea7eeb4879c42048916a5';
const usePublicChannel = false;

const pem1 = `-----BEGIN CERTIFICATE-----
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
-----END CERTIFICATE-----`;

const pem2 = `-----BEGIN CERTIFICATE-----
MIIDQzCCAiugAwIBAgIUajNNq6ugW4bRvfQd5EqUKmmXp1AwDQYJKoZIhvcNAQEL
BQAwGjEYMBYGA1UEAwwPd3d3LmZpbmN0ZWsuY29tMB4XDTI2MTAwMTEzNDYzMloX
DTI3MTAwMTEzNDYzMlowGjEYMBYGA1UEAwwPd3d3LmZpbmN0ZWsuY29tMIIBIjAN
BgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAofsQ/bWSyHgznDXSduZ0PrkVMasZ
+W0Ut4cuDRAOSvKeaSLbZusQdwA0f8rFdAFOgQTGyCxGceAjYqg5SAkglWR8+ix8
TITGsSOhnFBOvII/Fq86ORIFFiR8BUQVD0t/VddSU65ANqSVpCLKVlXKXseLy/LU
dgUE4fw2NqHLsO5DLK5NPhlQ5LwhH4WtubhM0R73LvhgcdB0Vual6lGNdMM0Sc5Z
14M6KcqVT/HIICkKivq7RALpDZHE2XiLlO7sflwS/qO3EhQpy2vMvQyrvatogHsW
bMasgkmhVZlL+IKoik8Bvtscie0tXKtLKErZobY4WcYUUd6ARFuhOPvU5wIDAQAB
o4GAMH4wDAYDVR0TAQH/BAIwADALBgNVHQ8EBAMCBaAwHQYDVR0lBBYwFAYIKwYB
BQUHAwIGCCsGAQUFBwMBMCMGCSsGAQQBg5gqAQQWDBQ5Njk1MDBQVEpKWlRDRTBJ
M0I2MDAdBgNVHQ4EFgQU3KVAzQ5YukRxub0v7konaXutJH0wDQYJKoZIhvcNAQEL
BQADggEBACjXpuB7PJXHeOTUcbmZH3wwHXR0Ewj9ZCAxp3/XJTFmuJuKfBUcYwH8
BcrnrENaoHOtBfA9OoUkyE4esjaNZJkH4IdX+OHlMHc8SuK/WCcXu0N2rzDahnJj
pZ5qWOEVM8SENAdf8fJUt3mUKKKCKehJOPmMtC6CtUcyUJCCBCE56lBoF614KTda
trMhQjbMgyx80Girlq6VCwxqkqt2OSQL7cUAvlzejW1l9ff+AihS8hdvBpLCoUEt
/yoLA8kW/zrgUqUn+MGmAfCBG6byk0s6y0DhNM4Fgba9lGldxV3RfyCf/QgTfC7m
BVgu+T7rIjrdma8yPm+y+c8w6jSMoxs=
-----END CERTIFICATE-----`;

run();

async function run() {
    const test = new Test(nodeUrl, encodedSk);
    const sk = await test.createAccount();
    const custom = [{
        __certificate__: { type: "PEM", pem: pem1 }
    }];
    const organizationId = await test.createOrganization(sk, custom);
    const applicationId = await test.createApplication(sk, organizationId);
    const operatorWallet = test.createWallet();
    const userWallet = test.createWallet();
    const digestStore: Map<string, JsonObject> = new Map;

    // create application ledgers
    // Eleve
    const studentRgpdData = {
        prenom : "Martin",
        nom : "Durand",
        date_naissance : "2008-08-01",
    };

    const studentData = DigestDataHandler.jsonToDigestData(studentRgpdData, true);
    digestStore.set(studentData.digest.digest, studentData.digestData);

    const { applicationLedgerId: studentVbId } = await test.createAppLedger(
        sk,
        applicationId,
        {
            __digest__: studentData.digest,
            niveau : "Terminal",
            classe : "T3"
        },
        userWallet,
        operatorWallet,
        usePublicChannel,
    );

    // Professeur
    const teacherRgpdData = {
        prenom : "Martine",
        nom : "Dupont",
        date_naissance : "1973-12-20"
    };

    const teacherData = DigestDataHandler.jsonToDigestData(teacherRgpdData, true);

    const { applicationLedgerId: teacherVbId } = await test.createAppLedger(
        sk,
        applicationId,
        {
            __digest_data__: {
                [teacherData.digest.digest]: teacherData.digestData
            },
            __digest__: teacherData.digest,
        },
        userWallet,
        operatorWallet,
        usePublicChannel,
    );

    // Epreuve 1
    const { applicationLedgerId: test1VbId } = await test.createAppLedger(
        sk,
        applicationId,
        {
            matiere : "Mathématique",
            coefficient : 3,
            date : "2026-08-26"
        },
        userWallet,
        operatorWallet,
        usePublicChannel,
    );

    // Epreuve 2
    const { applicationLedgerId: test2VbId } = await test.createAppLedger(
        sk,
        applicationId,
        {
            matiere : "Anglais",
            coefficient : 3,
            date : "2026-08-26"
        },
        userWallet,
        operatorWallet,
        usePublicChannel,
    );

    // Note 1
    const { applicationLedgerId: gradeVbId } = await test.createAppLedger(
        sk,
        applicationId,
        {
            eleve: `cmts://resolve/al/${studentVbId}/mb/h/1`,
            professeur: `cmts://resolve/al/${teacherVbId}/mb/h/1`,
            epreuve: `cmts://resolve/al/${test1VbId}/mb/h/1`,
            note: 18.5,
            appreciation: "Excellent travail"
        },
        userWallet,
        operatorWallet,
        usePublicChannel,
    );

    // Note 2
    await test.updateAppLedger(
        gradeVbId,
        sk,
        applicationId,
        {
            eleve: `cmts://resolve/al/${studentVbId}/mb/h/1`,
            professeur: `cmts://resolve/al/${teacherVbId}/mb/h/1`,
            epreuve: `cmts://resolve/al/${test2VbId}/mb/h/1`,
            note: 7.5,
            appreciation: "Travail insuffisant"
        },
        userWallet,
        operatorWallet,
        usePublicChannel,
    );

    // Bulletin
    const { applicationLedgerId: reportVbId } = await test.createAppLedger(
        sk,
        applicationId,
        {
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
            ],
            cert1: `cmts://resolve/org/${organizationId}/mb/h/1/sect/n/__certificate__`,
            cert2: {
                __certificate__: { type: "PEM", pem: pem2 },
            },
        },
        userWallet,
        operatorWallet,
        usePublicChannel,
    );

    const rootObject = {
        linkedJson: {
            report: `cmts://resolve/al/${reportVbId}/mb/h/1`
        },
        digestData: Object.fromEntries(digestStore),
        policies: {            
        }
    };

    const query = JSON.stringify(rootObject, null, 2);
    fs.writeFileSync("resolverQuery.json", query);

    const provider = test.getProvider();

    const generatorResolverHydrator = new GeneratorResolverHydrator(provider, userWallet);
    const generatorResolver = new Resolver(provider, generatorResolverHydrator);
    const generatorResolvedJson = await generatorResolver.resolveFromInput(rootObject);
    const generatorOutput: ResolverOutput = {
        linkedJson: rootObject.linkedJson,
        resolvedJson: generatorResolvedJson,
        digestData: rootObject.digestData,
        proofs: generatorResolverHydrator.getProofs(),
    }

    const generatorJson = JSON.stringify(generatorOutput, null, 2);
    fs.writeFileSync("generator-resolved.json", generatorJson);
    console.log("report", generatorResolver.getReport());

    const checkerResolverHydrator = new CheckerResolverHydrator(provider, generatorOutput.proofs);
    const checkerResolver = new Resolver(provider, checkerResolverHydrator);
    const checkerResolvedJson = await checkerResolver.resolveFromInput(rootObject);
    const checkerOutput: ResolverOutput = {
        linkedJson: rootObject.linkedJson,
        resolvedJson: checkerResolvedJson,
        digestData: rootObject.digestData,
        proofs: generatorResolverHydrator.getProofs(),
    }

    const checkerJson = JSON.stringify(checkerOutput, null, 2);
    fs.writeFileSync("checker-resolved.json", checkerJson);
    console.log("report", checkerResolver.getReport());
}

class GeneratorResolverHydrator implements ResolverHydrator {
    private proofs: Map<string, AppLedgerProof> = new Map;

    constructor(
        private readonly provider: Provider,
        private readonly wallet: WalletCrypto,
    ) {
        this.proofs.clear();
    }

    getProofs() {
        return Object.fromEntries(this.proofs);
    }

    async hydrateMicroblock(link: string, mbRef: MbRef) {
        const { vb, height } = await LinkResolver.getMicroblockLocation(this.provider, mbRef);

        if (!(vb instanceof ApplicationLedgerVb)) {
            throw new Error(`the microblock does not belong to an application ledger`);
        }

		const vbSeedHash = await vb.getGenesisSeed();
		const vbSeed = vbSeedHash.toBytes();
        const accountCrypto = this.wallet.getDefaultAccountCrypto();
        const actorCrypto = accountCrypto.deriveActorFromVbSeed(vbSeed);
        const identity = new CryptoHandlerApplicationLedgerActorIdentityAdapter(actorCrypto);

        const data = await vb.getRecord(height, identity);
        const proof = await vb.exportMicroblockProof(
            identity,
            height,
        );
        this.proofs.set(link, proof);
        return data;
    }
}

class CheckerResolverHydrator implements ResolverHydrator {
    private readonly provider: Provider;
    private readonly proofs: ResolutionProofProofs;

    constructor(provider: Provider, proofs: ResolutionProofProofs) {
        this.provider = provider;
        this.proofs = proofs;
    }

    async hydrateMicroblock(link: string, mbRef: MbRef) {
        const proof = this.proofs[link];
        const vb = proof.virtualBlockchains[0];
        const vbId = vb.id;
        const appLedgerIdHash = Hash.fromHex(vbId);
        const appLedgerVb = await this.provider.loadApplicationLedgerVirtualBlockchain(appLedgerIdHash);
        const data = await appLedgerVb.importMicroblockProof(vb.microblocks[0]);
        return data;
    }
}
