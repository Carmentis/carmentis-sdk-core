import { Provider } from "../../providers/Provider";
import { Microblock } from "../microblock/Microblock";
import { MbRef, VbRef, SectRef } from "./LinkResolver";
import { Section } from "../../type/valibot/blockchain/section/sections";
import { SectionType } from "../../type/valibot/blockchain/section/SectionType";
import { ApplicationLedgerVb } from "../../blockchain/virtualBlockchains/ApplicationLedgerVb";
import { ICryptoKeyHandler } from "../../wallet/ICryptoKeyHandler";
import { Utils } from "../../utils/utils";
import { Hash } from "../../entities/Hash";

export class Resolver {
    private readonly provider: Provider;

    constructor(provider: Provider) {
        this.provider = provider;
    }

    async getMicroblockContentFromMicroblockRef(mbRef: MbRef): Promise<Microblock> {
        if (mbRef.hash !== undefined) {
            return this.provider.loadMicroblockByMicroblockHash(Hash.from(mbRef.hash));
        }
        if (mbRef.vb !== undefined && mbRef.height !== undefined) {
            const vb = await this.provider.loadVirtualBlockchain(Hash.from(mbRef.vb.id));
            return vb.getMicroblock(mbRef.height);
        }
        throw new Error(`inconsistent microblock reference`);
    }

    async getAppLedgerContentFromMicroblockRef(mbRef: MbRef, hostIdentity: ICryptoKeyHandler) {
        let vbId: string;
        let height: number;

        if (mbRef.hash !== undefined) {
            const mbInfo = await this.provider.getMicroblockInformation(Utils.binaryFromHexa(mbRef.hash));
            if (mbInfo === null) {
                throw new Error(`microblock not found`);
            }
            vbId = Utils.binaryToHexa(mbInfo.virtualBlockchainId);
            height = mbInfo.header.height;
        } else if (mbRef.vb !== undefined && mbRef.height !== undefined) {
            vbId = mbRef.vb.id;
            height = mbRef.height;            
        } else {
            throw new Error(`inconsistent microblock reference`);
        }

        const vb = await this.provider.loadVirtualBlockchain(Hash.from(vbId));

        if (!(vb instanceof ApplicationLedgerVb)) {
            throw new Error(`the microblock does not belong to an application ledger`);
        }

        const data = await vb.getRecord(height, hostIdentity);
        const proof = await vb.exportProof(
            { author: "" },
            hostIdentity,
            [ height ]
        );
        return {
            data,
            proof: proof.proof
        };
    }

    async getSectionContentFromSectionRef(sectRef: SectRef): Promise<Section> {
        const mb = await this.getMicroblockContentFromMicroblockRef(sectRef.mb);
        let section: Section | undefined;

        if (sectRef.index !== undefined) {
            const allSections = mb.getAllSections();
            section = allSections[sectRef.index];
        } else if (sectRef.name !== undefined) {
            const customSections = mb.getSectionsByType(SectionType.CUSTOM);
            section = customSections.find((s) => sectRef.name! in s);
        } else {
            throw new Error(`inconsistent section reference`);
        }
        if (section === undefined) {
            throw new Error(`section not found`);
        }
        return section;
    }
}
