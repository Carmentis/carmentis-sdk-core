/*
import { Resolver } from '../../src/resolver/Resolver';
import { JsonObject } from '../../src/type/valibot/json/Json';
import { ResolverHydrator, ResolverOutput, MbRef, SectRef } from '../../src/resolver/ResolverTypes';
import { describe, it, expect } from 'vitest'
import { DigestDataHandler } from '../../src/records/DigestData';

describe("Resolver", () => {
    it("Should resolve as expected", async () => {
        // this Map simulates the chain
        const mbStore: Map<string, JsonObject> = new Map;

        // this Map simulates the application DB
        const digestStore: Map<string, JsonObject> = new Map;

        // this method simulates the chain anchoring
        function createMicroblock(data: JsonObject, vbId?: string, height?: number) {
            console.log("anchoring", data);

            if (vbId !== undefined) {
                if (height === undefined) {
                    throw new Error('vbId without height');
                }
            }
            else {
                vbId = [...Array(64)].map(() => (Math.random() * 16 | 0).toString(16)).join("");
                height = 1;
            }
            const key = vbId + "/" + height;
            mbStore.set(key, data);
            return vbId;
        }

        const studentRgpdData = {
            prenom : "Martin",
            nom : "Durand",
            date_naissance : "2008-08-01",
        };

        const studentData = DigestDataHandler.jsonToDigestData(studentRgpdData, true);
        digestStore.set(studentData.onchainData.digest, studentData.digestData);

        const teacherRgpdData = {
            prenom : "Martine",
            nom : "Dupont",
            date_naissance : "1973-12-20"
        };

        const teacherData = DigestDataHandler.jsonToDigestData(teacherRgpdData, true);

        // Eleve
        const studentVbId = createMicroblock({
            __digest__: studentData.onchainData,
            niveau: "Terminal",
            classe: "T3"
        });

        // Professeur
        const teacherVbId = createMicroblock({
            __digest_data__: {
                [teacherData.onchainData.digest]: teacherData.digestData
            },
            __digest__: teacherData.onchainData,
        });

        // Epreuve 1
        const test1VbId = createMicroblock({
            matiere : "Mathématique",
            coefficient : 3,
            date : "2026-08-26"
        });

        // Epreuve 2
        const test2VbId = createMicroblock({
            matiere : "Anglais",
            coefficient : 3,
            date : "2026-08-26"
        });

        // Note 1
        const gradeVbId = createMicroblock({
            eleve: `cmts://resolve/al/${studentVbId}/mb/h/1`,
            professeur: `cmts://resolve/al/${teacherVbId}/mb/h/1`,
            epreuve: `cmts://resolve/al/${test1VbId}/mb/h/1`,
            note: 18.5,
            appreciation: "Excellent travail"
        });

        // Note 2
        createMicroblock({
            eleve: `cmts://resolve/al/${studentVbId}/mb/h/1`,
            professeur: `cmts://resolve/al/${teacherVbId}/mb/h/1`,
            epreuve: `cmts://resolve/al/${test2VbId}/mb/h/1`,
            note: 7.5,
            appreciation: "Travail insuffisant"
        }, gradeVbId, 2);

        // Bulletin
        const reportVbId = createMicroblock({
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
            digestData: Object.fromEntries(digestStore),
            policies: {            
            }
        };

        class GeneratorResolverHydrator implements ResolverHydrator {
            private mbStore: Map<string, JsonObject>;
            private proofs: Map<string, JsonObject> = new Map;

            constructor(mbStore: Map<string, JsonObject>) {
                this.mbStore = mbStore;
                this.proofs.clear();
            }

            getProofs() {
                return Object.fromEntries(this.proofs);
            }

            async hydrateMicroblock(link: string, mbRef: MbRef) {
                if (mbRef.vb !== undefined && mbRef.height !== undefined) {
                    const key = mbRef.vb.id + "/" + mbRef.height;
                    const data = this.mbStore.get(key) ?? {};
                    this.proofs.set(link, data);
                    return data;
                }
                return {};
            }
        }

        const generatorResolverHydrator = new GeneratorResolverHydrator(mbStore);
        const generatorResolver = new Resolver(generatorResolverHydrator);
        const generatorResolvedJson = await generatorResolver.resolveFromInput(rootObject);
        const generatorOutput: ResolverOutput = {
            linkedJson: rootObject.linkedJson,
            resolvedJson: generatorResolvedJson,
            digestData: rootObject.digestData,
            proofs: generatorResolverHydrator.getProofs(),
        }

        console.log("generatorOutput", JSON.stringify(generatorOutput, null, 2));
        console.log("report", generatorResolver.getReport());

        class CheckerResolverHydrator implements ResolverHydrator {
            private resolverOutput: ResolverOutput;

            constructor(resolverOutput: ResolverOutput) {
                this.resolverOutput = resolverOutput;
            }

            async hydrateMicroblock(link: string, mbRef: MbRef) {
                return this.resolverOutput.proofs[link];
            }
        }

        const checkerResolverHydrator = new CheckerResolverHydrator(generatorOutput);
        const checkerResolver = new Resolver(checkerResolverHydrator);
        const checkerResolvedJson = await checkerResolver.resolveFromOutput(generatorOutput);

        console.log("checkerResolvedJson", JSON.stringify(checkerResolvedJson, null, 2));
        console.log("report", generatorResolver.getReport());
    });
})
*/
