import * as fs from 'fs';
import { Test } from "../src/test/Test";
import { JsonObject } from '../src/type/valibot/json/Json';
import { DigestDataHandler } from '../src/records/DigestData';
import { ResolverHydrator, ResolverOutput, ResolverReport, MbRef } from '../src/resolver/ResolverTypes';
import { Provider } from '../src/providers/Provider';
import { Hash } from '../src/entities/Hash';
import { ApplicationLedgerVb } from "../src/blockchain/virtualBlockchains/ApplicationLedgerVb";
import { WalletCrypto } from "../src/wallet/WalletCrypto";
import { CryptoHandlerApplicationLedgerActorIdentityAdapter } from "../src/blockchain/virtualBlockchains/IApplicationLedgerActorIdentity";
import { LinkResolver } from "../src/resolver/LinkResolver";
import { Resolver } from "../src/resolver/Resolver";
import { ResolverNodeMapper } from "../src/resolver/ResolverNodeMapper";
import { ResolverPath } from "../src/resolver/ResolverPath";
import { ResolutionProofProofs } from "../src/type/valibot/proofs/ResolutionProof";
import { AppLedgerProof } from "../src/type/valibot/proofs/AppLedgerProof";
import { ResolutionProofWrapper } from "../src/proofs/ResolutionProofWrapper";
import { SignatureContext } from "../src/type/JsonSignatureSchemas";
import { JwkPrivateSignatureKey } from "../src/crypto/signature/jwk/JwkPrivateSignatureKey";
import { JsonCanonicalUtf8Signer } from "../src/crypto/signature/signer/json/JsonCanonicalUtf8Signer";
import { BinaryEncoding } from '../src/crypto/signature/signer/binary/BinaryEndoding';
import { Utils } from '../src/utils/utils';

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

const sdJwtVc = "eyJ0eXAiOiJ2YytzZC1qd3QiLCJhbGciOiJFZERTQSJ9.eyJpc3MiOiJkaWQ6andrOmV5SmpjbllpT2lKRlpESTFOVEU1SWl3aWVDSTZJa3R6Y0RKNlVHdElYM3BhT0ZjdE1ETkxNeTFaUTJaR1prSldSRzlsTTBnNE5GTTBiV1pyY0RSMlpsRWlMQ0pyZEhraU9pSlBTMUFpTENKNE5XTWlPbHNpVFVsSlFteEVRME5CVldGblFYZEpRa0ZuU1ZWSlRXaFVkVE5rZFM5QlpWcE5NM0J6WmtSRVdYZHNMMmcwU0VWM1FsRlpSRXN5Vm5kTlIyOTRSV3BCVVVKblRsWkNRVTFOUTFWT2FHTnRNV3hpYmxKd1kzcEZVMDFDUVVkQk1WVkZRM2QzU2xFeVJubGlWMVoxWkVkc2VrMVJjM2REVVZsRVZsRlJSMFYzU2tkVmFrVlFUVUV3UjBFeFZVVkRRWGRIVW01S2FHSnRUbXhOVVRSM1JFRlpSRlpSVVVoRVFWWlJXVmhLY0dONlJWTk5Ra0ZIUVRGVlJVTm5kMHBSTWtaNVlsZFdkV1JIYkhwTlFqUllSRlJKTWsxRVdYcE5SRUUxVFZSSk1VMXNiMWhFVkVrelRVUlplazFFUVRWTlZFa3hUV3h2ZDJGcVJWTk5Ra0ZIUVRGVlJVRjNkMHBSTWtaNVlsZFdkV1JIYkhwTlVrbDNSVUZaUkZaUlVVeEVRV3hFV1ZoS2RGcFhOVEJoV0UxNFEzcEJTa0puVGxaQ1FWbFVRV3RhVTAxUk9IZEVVVmxFVmxGUlNVUkJXa2RqYlVaMVdUSlZlRVJxUVUxQ1owNVdRa0ZqVFVKV1FtaGpiV3g2VFZKSmQwVkJXVVJXVVZGTFJFRnNSRmxZU25SYVZ6VXdZVmhOZDB0cVFVWkNaMDF5V2xoQlJFbFJRWEY1Ym1KTksxRm1MMDV1ZUdJM1ZHTnlaalZuU2poV09FWlZUMmczWTJaNmFFeHBXaXRUYm1rNU9VUkJSa0puVFhKYVdFRkVVVkZFVUV0VGRrVm9aelp2WTFwa1dqbFlZa2xuWjBOclJrdDRWVlV4ZVdKWmFGVnNaVVkxYTA1R05FTjBUVFI1Tm1oSFJqTXJRM0pHVnpWdldrUnRaM0V5TTBWME0zUnJWSGh1U1haU1NWcHhlVVJUTUdSSlFTSmRmUSIsImlhdCI6MTc5MjQxNDcxOCwidmN0IjoiRW1haWxDcmVkZW50aWFsIiwic3ViIjoiZGlkOmp3azpleUpoYkdjaU9pSlNVekkxTmlJc0ltVWlPaUpCVVVGQ0lpd2lhM1I1SWpvaVVsTkJJaXdpYmlJNklqWlpkREJvT1ZneFNHeEpWMDFxVVVSeWNWaDJaMVJOZGxkdWNVOXNSRTUxYmpZeFh6TlhVR1F5WVdjM2EyRkRZVFpyY0Y5dWRUbDJURmwyU0RkVk4zTnBNRE42YVU5U1JHWmFVMVJ2ZGxob1JtVjRTRUZaZVdsU1EwaEhWVXRmVVhwd05EVTBRV1JFTmxZMlRUSnhla0Z5TFY5SWJrSmxjbGhIWVc1d1lraHhNMDQxY0RCTlgxQjVSa2xFVmpWbVIzcG1VMlJmUkY5QlpGZFFNMmRQYzFRdE9FWnpSVkZHYWpKR1RGSlljMlExUVRGQ1kwOU9jbFpZUlhWM1pEaGZTM1JTZUVOU1JUTkVPVk5WYjBSYVUwOUtWVjlrUkZaRWREZEVOWFJNYmt0emJscENPVVJaVUhKT1ZtMXFORXB3V2pFd1ZUaENTMUZZY0d4V05tSXRPVU5MTTFsS09EaElkVUl4VVVKS1JrOXRialJYTm5nNWRGaExSMWxuTVZGSllrOHpNa0oxUnpKWGIzbEtSM0pGYWtsRmFFcEJMVnBuVjFNM2IzQnZhVzFpT0dReWFHMUdSRTkyYm1oU1JrZFpkR1I2T0ZjeWR5SjkiLCJqdGkiOiIzZjJkZGRhMS1mNzVmLTRiMTktOThiMS02MWMwMjcyMDczMDIiLCJzdGF0dXMiOnsic3RhdHVzX2xpc3QiOnsiaWR4IjoyNSwidXJpIjoiaHR0cHM6Ly9pc3N1ZXIuYWRtaW4uY2FybWVudGlzLmlvL2FwaS9kZW1vLXZjLWVtYWlsL2NyZWRlbnRpYWwvc3RhdHVzIn19LCJfc2QiOlsiM0lQUnFNVVN2WGlEYXNaNXFFNGJVSHJBUkh5UjhpY3Qyd2lPQ2NQZnRxMCIsImZxVDBMZ1A3dVhsUnk3T2VYRmtNX3JOcmwtaU1BRzBuSjV2V2hYN1g3dnMiLCJoMXZfSWpPOUtZUW93N1l6QTM0YXZaRHI3V0w2ekxDNHFhVktHcThPX0ZvIiwidFJkdVdZTC1HMlkwck5CREtqVDdITndCQkxUdkg5S2Y4T1dZZGUtNXhFVSJdLCJfc2RfYWxnIjoic2hhLTI1NiJ9.-u4I6lGE8PkLKLQ_gGtFRf9pmPn9_A3XHZIwo-9ggJFpKuo7pGOkPGE_-h2-IFpl8LLaYBB1TgGszz4rc67KBQ~WyJYN25IZ01KUEdVY1laSmR0N2dfd3hnIiwiZW1haWwiLCJnYWVsLm1hcmNhZGV0QGNhcm1lbnRpcy5pbyJd~eyJ0eXAiOiJrYitqd3QiLCJhbGciOiJSUzI1NiJ9.eyJub25jZSI6ImlDdllUTEpBbTNOMUNkd24xdmxsREp5M2xJL1BQejlHTy9lUFdjajUxYjA9IiwiaWF0IjoxNzkyNDE1MzkxLCJhdWQiOiJodHRwOi8vbG9jYWxob3N0OjUxNzMiLCJzZF9oYXNoIjoiRURBZDBjeXU2WnRWdWNxN00wcTl0Zkc0WHB6UDdfcDFSWFgxM2dWRENxdyJ9.cxFYcYdKQuxZCzK-PnZdu1iZhxGWSYiTIfXmBnkRLO-i_8oHCBJufE-BqnXE-zV7W5T7kySzQ4PKyihXzPAaKDncNi_V1qOHaXqerei1qIH5uj7ORb5oz88LeA_EjTb0hQGAC5MTlSe95K9PgFeRDvjGbJ1dqi_Ovc9fxbbLJ33lSaLmd30L6cFbmnLrJe3z4zyjIC4bonHKMct84vB2pPldVmamWgUBDTCe7L6YOjw4sVni8Jok2sYe6YAlQYn83-FnEOc0BRRnyT02ym52KOsrIRGIwU0Lw-L5WJgsQxPT2oa1QJQfLR1ceYuf-fr2RPUKF-RK1qQT4ZC-4gnhCg";

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

run();

async function run() {
    const seed = process.argv[2];
    let reportVbId = process.argv[3];

    const test = new Test(nodeUrl, encodedSk);
    const userWallet = seed ? test.createWalletFromSeed(Utils.binaryFromHexa(seed)) : test.createWallet();
    const digestStore: Map<string, JsonObject> = new Map;

    // create application ledgers
    // Eleve
    const studentRgpdData = {
        prenom : "Martin",
        nom : "Durand",
        date_naissance : "2008-08-01",
    };

    const studentData = DigestDataHandler.jsonToDigestData(studentRgpdData, false);
    digestStore.set(studentData.digest.digest, studentData.digestData);

    if (reportVbId === undefined) {
        reportVbId = await createReport(test, userWallet, studentData);
    }

    const rootObject = {
        linkedJson: {
            report: { __link__: `cmts://resolve/al/${reportVbId}/mb/h/1` }
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

    // const generatorReport = generatorResolver.getReport();
    // dumpReport(generatorReport);

    const proof = ResolutionProofWrapper.createEmptyProof("cmts:localnet");
    proof.setLinkedJson(generatorOutput.linkedJson);
    proof.setResolvedJson(generatorOutput.resolvedJson);
    proof.setDigestData(generatorOutput.digestData);
    proof.setProofs(generatorOutput.proofs);
    const proofJson = JSON.stringify(proof.getObject(), null, 2);
    fs.writeFileSync("generator-proof.json", proofJson);

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

    const checkerReport = checkerResolver.getReport();
    dumpReport(checkerReport);

    const nodeMapper = new ResolverNodeMapper(checkerReport.nodes);
    const path0 = new ResolverPath(["root", "report", "eleve"]);
    console.log(nodeMapper.map(path0));
    const path1 = new ResolverPath(["root", "report", "eleve", "prenom"]);
    console.log(nodeMapper.map(path1));

    console.log('seed:', Utils.binaryToHexa(userWallet.getSeedAsBytes()));
    console.log('reportVbId:', reportVbId);
}

async function createReport(test: Test, userWallet: WalletCrypto, studentData: any) {
    const sk = await test.createAccount();
    const custom = [{
        __certificate__: { type: "PEM", pem: pem1 }
    }];
    const organizationId = await test.createOrganization(sk, custom);
    const applicationId = await test.createApplication(sk, organizationId);
    const operatorWallet = test.createWallet();

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
            eleve: { __link__: `cmts://resolve/al/${studentVbId}/mb/h/1` },
            professeur: { __link__: `cmts://resolve/al/${teacherVbId}/mb/h/1` },
            epreuve: { __link__: `cmts://resolve/al/${test1VbId}/mb/h/1` },
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
            eleve: { __link__: `cmts://resolve/al/${studentVbId}/mb/h/1` },
            professeur: { __link__: `cmts://resolve/al/${teacherVbId}/mb/h/1` },
            epreuve: { __link__: `cmts://resolve/al/${test2VbId}/mb/h/1` },
            note: 7.5,
            appreciation: "Travail insuffisant"
        },
        userWallet,
        operatorWallet,
        usePublicChannel,
    );

    const sigSk = await JwkPrivateSignatureKey.gen('ES256');
    const sigDate = Date.now();
    const signer = new JsonCanonicalUtf8Signer();
    const payload = { message: "Additional signed data" }
    const context: SignatureContext = {
        signedAt: sigDate,
        purpose: 'Test signature',
        notValidBefore: sigDate,
    }
	signer.setIncludePayload(true);
	signer.setIncludePublicKey(true);
	signer.setSignatureEncoding(BinaryEncoding.BASE64);
    const sig = await signer
        .sign(
            sigSk,
            context,
            payload,
        );

    const signedJson = {
        __signature__: sig,
    };

    const vc = {
        __vc__: {
            type: 'SDJWT_IETF',
            sdjwt_ietf: sdJwtVc,
        }
    };

    // Bulletin
    const { applicationLedgerId: reportVbId } = await test.createAppLedger(
        sk,
        applicationId,
        {
            eleve: { __link__: `cmts://resolve/al/${studentVbId}/mb/h/1` },
            periode: {
                debut: "2026-01-01",
                fin: "2026-03-30"
            },
            moyenne: 13,
            appreciation: "Bon trimestre",
            notes: [
                { __link__: `cmts://resolve/al/${gradeVbId}/mb/h/1` },
                { __link__: `cmts://resolve/al/${gradeVbId}/mb/h/2` },
            ],
            signedJson,
            vc,
            cert1: { __link__: `cmts://resolve/org/${organizationId}/mb/h/1/sect/n/__certificate__` },
            cert2: {
                __certificate__: { type: "PEM", pem: pem2 },
            },
        },
        userWallet,
        operatorWallet,
        usePublicChannel,
    );

    return reportVbId;
}

function dumpReport(report: ResolverReport) {
    console.log("passes:", report.passes);
    for (const [ key, value ] of report.nodes) {
        console.log(ResolverPath.fromSerialized(key).toString());
        console.log(JSON.stringify(value));
    }
}