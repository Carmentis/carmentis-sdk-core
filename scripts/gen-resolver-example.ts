import * as fs from 'fs';
import {Test} from "../src/test/Test";

const nodeUrl = "http://localhost:26657";
const encodedSk = 'sig:secp256k1:sk:cd42ad5f7a7823f3ab4da368ea4f807fa8246526ea4ea7eeb4879c42048916a5';
const usePublicChannel = true;

run();

async function run() {
    const test = new Test(nodeUrl, encodedSk);
    const sk = await test.createAccount();
    const organizationId = await test.createOrganization(sk);
    const applicationId = await test.createApplication(sk, organizationId);
    const operatorWallet = test.createWallet();
    const userWallet = test.createWallet();

    // create application ledgers
    // Eleve
    console.log("creating student");
    const { applicationLedgerId: studentVbId } = await test.createAppLedger(
        sk,
        applicationId,
        {
            prenom : "Martin",
            nom : "Durand",
            date_naissance : "2008-08-01",
            niveau : "Terminal",
            classe : "T3"
        },
        userWallet,
        operatorWallet,
        usePublicChannel,
    );

    // Professeur
    console.log("creating teacher");
    const { applicationLedgerId: teacherVbId } = await test.createAppLedger(
        sk,
        applicationId,
        {
            prenom : "Martine",
            nom : "Dupont",
            date_naissance : "1973-12-20"
        },
        userWallet,
        operatorWallet,
        usePublicChannel,
    );

    // Epreuve 1
    console.log("creating test #1");
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
    console.log("creating test #2");
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
    console.log("creating notes VB with note #1");
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
    console.log("adding note #2");
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
    console.log("creating report");
    const { applicationLedgerId: reportVbId } = await test.createAppLedger(
        sk,
        applicationId,
        {
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
        },
        userWallet,
        operatorWallet,
        usePublicChannel,
    );

    const rootObject = {
        linkedJson: {
            report: `cmts://resolve/al/${reportVbId}/mb/h/1`
        },
        policies: {            
        }
    };

    const json = JSON.stringify(rootObject, null, 2);
    fs.writeFileSync("resolverQuery.json", json);
}
