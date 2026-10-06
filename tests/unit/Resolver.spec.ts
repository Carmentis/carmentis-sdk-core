import { LinkResolver } from '../../src/resolver/LinkResolver';
import { Resolver } from '../../src/resolver/Resolver';
import { JsonData, JsonObject } from '../../src/type/valibot/json/Json';
import { ResolverHydrator, ResolverInput, ResolverOutput, VbRef, MbRef, SectRef } from '../../src/resolver/ResolverTypes';
import { describe, it, expect } from 'vitest'
import { OffchainDataHandler } from '../../src/records/OffchainData';
import { OnchainData } from '../../src/resolver/ResolverTypes';

type OffchainStore = {
    offchainData: JsonObject,
    id: string | null
}

describe("Resolver", () => {
    it("Link resolver", async () => {
        const vbId = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
        const link0 = `cmts://resolve/vb/${vbId}/mb/h/1`;
        const res0 = LinkResolver.resolve(link0);
        expect(res0.type).toEqual("mb");
        expect((res0.ref as MbRef).vb!.id).toEqual(vbId);

        const link1 = `cmts://resolve/vb/${vbId}/mb/h/1/sect/123`;
        const res1 = LinkResolver.resolve(link1);
        expect(res1.type).toEqual("section");
        expect((res1.ref as SectRef).index).toEqual(123);

        const link2 = `cmts://resolve/vb/${vbId}/mb/h/1/sect/n/foobar`;
        const res2 = LinkResolver.resolve(link2);
        expect(res2.type).toEqual("section");
        expect((res2.ref as SectRef).name).toEqual("foobar");

        const link3 = `cmtx://resolve/vb/${vbId}/mb/h/1/sect/n/foobar`;
        expect(() => LinkResolver.resolve(link3)).toThrow();
    });

    it("Resolver", async () => {
        // this Map simulates the chain
        const mbStore: Map<string, JsonObject> = new Map;

        // this Map simulates the operator DB
        const offchainStore: Map<string, OffchainStore> = new Map;

        // this method simulates the chain anchoring, including __offchain_data__ processing
        function createMicroblock(data: JsonData, vbId?: string, height?: number) {
            if (vbId !== undefined) {
                if (height === undefined) {
                    throw new Error('vbId without height');
                }
            }
            else {
                vbId = [...Array(64)].map(() => (Math.random() * 16 | 0).toString(16)).join("");
                height = 1;
            }
            function walk(node: JsonData): JsonData {
                if (node === null) {
                    return null;
                }
                if (Array.isArray(node)) {
                    return node.map((child) => walk(child));
                }
                if (typeof node === "object") {
                    const newNode: JsonData = {};
                    for (const key of Object.keys(node)) {
                        if (key == '__offchain_data__') {
                            const { onchainData, offchainData, id } = OffchainDataHandler.extract(node[key] as JsonObject);
                            offchainStore.set(onchainData.digest, { offchainData, id });
                            newNode[key] = onchainData;
                        }
                        else {
                            newNode[key] = walk(node[key]);
                        }
                    }
                    return newNode;
                }
                return node;
            }
            const key = vbId + "/" + height;
            mbStore.set(key, walk(data) as JsonObject);
            return vbId;
        }

        // Eleve
        const studentVbId = createMicroblock({
            rgpd: {
                __offchain_data__: {
                    __id__: "12345",
                    prenom : "Martin",
                    nom : "Durand",
                    date_naissance : "2008-08-01",
                },
            },
            niveau: "Terminal",
            classe: "T3"
        });

        // Professeur
        const teacherVbId = createMicroblock({
            prenom : "Martine",
            nom : "Dupont",
            date_naissance : "1973-12-20"
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
            policies: {            
            }
        };

        class GeneratorResolverHydrator implements ResolverHydrator {
            private mbStore: Map<string, JsonObject>;
            private offchainStore: Map<string, JsonObject>;
            private proofs: Map<string, JsonObject> = new Map;
            private offchainData: Map<string, JsonObject> = new Map;

            constructor(mbStore: Map<string, JsonObject>, offchainStore: Map<string, JsonObject>) {
                this.mbStore = mbStore;
                this.offchainStore = offchainStore;
                this.proofs.clear();
                this.offchainData.clear();
            }

            getProofs() {
                return Object.fromEntries(this.proofs);
            }

            getOffchainData() {
                return Object.fromEntries(this.offchainData);
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

            async hydrateOffchainData(onchainData: OnchainData) {
                const data = this.offchainStore.get(onchainData.digest) as OffchainStore;
                if (data === undefined) {
                    return null;
                }
                const { offchainData } = data;
                const res = OffchainDataHandler.inject(onchainData, offchainData);
                this.offchainData.set(onchainData.digest, offchainData);
                return res;
            }
        }

        const generatorResolverHydrator = new GeneratorResolverHydrator(mbStore, offchainStore);
        const generatorResolver = new Resolver(generatorResolverHydrator);
        const generatorResolvedJson = await generatorResolver.resolveFromInput(rootObject);
        const generatorOutput: ResolverOutput = {
            linkedJson: rootObject.linkedJson,
            resolvedJson: generatorResolvedJson,
            offchainData: generatorResolverHydrator.getOffchainData(),
            proofs: generatorResolverHydrator.getProofs(),
        }

        console.log("generatorOutput", JSON.stringify(generatorOutput, null, 2));

        class CheckerResolverHydrator implements ResolverHydrator {
            private resolverOutput: ResolverOutput;

            constructor(resolverOutput: ResolverOutput) {
                this.resolverOutput = resolverOutput;
            }

            async hydrateMicroblock(link: string, mbRef: MbRef) {
                return this.resolverOutput.proofs[link];
            }

            async hydrateOffchainData(onchainData: OnchainData) {
                const offchainData = this.resolverOutput.offchainData[onchainData.digest];
                return OffchainDataHandler.inject(onchainData, offchainData);
            }
        }

        const checkerResolverHydrator = new CheckerResolverHydrator(generatorOutput);
        const checkerResolver = new Resolver(checkerResolverHydrator);
        const checkerResolvedJson = await checkerResolver.resolveFromOutput(generatorOutput);

        console.log("checkerResolvedJson", JSON.stringify(checkerResolvedJson, null, 2));
    });
})
