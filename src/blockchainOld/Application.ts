export {}
/*
import {SECTIONS} from "../constants/constants";
import {ApplicationVb} from "./ApplicationVb";
import {Crypto} from "../crypto/crypto";
import {Provider} from "../providers/Provider";
import {Hash} from "../entities/Hash";
import {CMTSToken} from "../economics/currencies/token";
import {PublicSignatureKey} from "../crypto/signature/PublicSignatureKey";
import {ApplicationDeclarationSection, ApplicationDescriptionSection} from "./sectionSchemas";

export class Application {
    provider: any;
    signatureSchemeId: any;
    vb: ApplicationVb;
    gasPrice: CMTSToken;

    constructor({
                    provider
                }: { provider: Provider }) {
        this.vb = new ApplicationVb(provider);
        this.provider = provider;
        this.gasPrice = CMTSToken.zero();

        if (this.provider.isKeyed()) {
            const privateKey = this.provider.getPrivateSignatureKey();
            this.signatureSchemeId = privateKey.getSignatureSchemeId();
        }
    }

    async _create(organizationId: any) {
        await this.vb.setSignatureScheme({
            schemeId: this.signatureSchemeId
        });

        await this.vb.setDeclaration({
            organizationId: organizationId
        });
    }

    async _load(identifier: any) {
        await this.vb.synchronizeVirtualBlockchain(identifier);
    }

    async setDescription(object: ApplicationDescriptionSection) {
        await this.vb.setDescription(object);
    }

    setGasPrice(gasPrice: CMTSToken) {
        this.gasPrice = gasPrice;
    }

    async getDeclaration() {
        const microblock = await this.vb.getFirstMicroBlock();
        const section = microblock.getSection<ApplicationDeclarationSection>(
            (section: any) => section.type == SECTIONS.APP_DECLARATION
        );
        return section.object;
    }

    async getDescription() {
        const microblock = await this.vb.getMicroblock(this.vb.getDescriptionHeight());
        const section = microblock.getSection<ApplicationDescriptionSection>(
            (section: any) => section.type == SECTIONS.APP_DESCRIPTION
        );
        return section.object;
    }

    async getOrganizationId(): Promise<Hash> {
        const declaration = await this.getDeclaration();
        return Hash.from(declaration.organizationId);
    }

    async getOrganizationPublicKey(): Promise<PublicSignatureKey> {
        return await this.vb.getOrganizationPublicKey();
    }

    async publishUpdates(waitForAnchoring = true) {
        if (!this.provider.isKeyed()) throw 'Cannot publish updates without keyed provider.'
        const privateKey = this.provider.getPrivateSignatureKey();
        this.vb.setGasPrice(this.gasPrice);
        await this.vb.setSignature(privateKey);
        return await this.vb.publish(waitForAnchoring);
    }
}

 */
