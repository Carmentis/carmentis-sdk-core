import {IProvider} from "./IProvider";
import {PublicSignatureKey} from "../crypto/signature/PublicSignatureKey";
import {Hash} from "../entities/Hash";
import {ValidatorNodeVb} from "../blockchain/virtualBlockchains/ValidatorNodeVb";
import {AccountVb} from "../blockchain/virtualBlockchains/AccountVb";
import {ApplicationLedgerVb} from "../blockchain/virtualBlockchains/ApplicationLedgerVb";
import {ApplicationVb} from "../blockchain/virtualBlockchains/ApplicationVb";
import {OrganizationVb} from "../blockchain/virtualBlockchains/OrganizationVb";
import {ProtocolVb} from "../blockchain/virtualBlockchains/ProtocolVb";
import {VirtualBlockchain} from "../blockchain/virtualBlockchains/VirtualBlockchain";
import {VirtualBlockchainNotFoundError} from "../errors/carmentis-error";
import {ProtocolInternalState} from "../blockchain/internalStates/ProtocolInternalState";
import {InternalStateFactory} from "../blockchain/internalStates/InternalStateFactory";
import {Logger} from "../utils/Logger";
import {MicroblockHeader} from "../type/valibot/blockchain/microblock/MicroblockHeader";
import {MicroblockBody} from "../type/valibot/blockchain/microblock/MicroblockBody";
import {VirtualBlockchainState} from "../type/valibot/blockchain/virtualBlockchain/virtualBlockchains";
import {VirtualBlockchainStatus} from "../type/valibot/provider/VirtualBlockchainStatus";
import {VirtualBlockchainType} from "../type/VirtualBlockchainType";
import {Microblock} from "../blockchain/microblock/Microblock";
import {FeesCalculationFormulaFactory} from "../blockchain/feesCalculator/FeesCalculationFormulaFactory";
import {CMTSToken} from "../economics/currencies/token";
import {SignatureSchemeId} from "../crypto/signature/SignatureSchemeId";
import {Utils} from "../utils/utils";

export abstract class AbstractProvider implements IProvider {
    private log = Logger.getAbstractProviderLogger(AbstractProvider.name);

    async loadValidatorNodeVirtualBlockchain(validatorNodeId: Hash) {
        const vb = new ValidatorNodeVb(this);
        await this.initializeVirtualBlockchain(vb, validatorNodeId);
        return vb;
    }

    async loadAccountVirtualBlockchain(accountId: Hash) {
        this.log.debug(`Loading account virtual blockchain with id ${accountId.encode()}`)
        const vb = new AccountVb(this);
        await this.initializeVirtualBlockchain(vb, accountId);
        return vb;
    }

    async loadApplicationLedgerVirtualBlockchain(appLedgerId: Hash) {
        const vb = new ApplicationLedgerVb(this);
        await this.initializeVirtualBlockchain(vb, appLedgerId);
        return vb;
    }

    async loadApplicationVirtualBlockchain(applicationId: Hash) {
        const vb = new ApplicationVb(this);
        await this.initializeVirtualBlockchain(vb, applicationId);
        return vb;
    }

    async loadOrganizationVirtualBlockchain(organizationId: Hash) {
        const orgVb = new OrganizationVb(this);
        await this.initializeVirtualBlockchain(orgVb, organizationId);
        return orgVb;
    }

    async loadProtocolVirtualBlockchain(protocolId: Hash) {
        const vb = new ProtocolVb(this);
        await this.initializeVirtualBlockchain(vb, protocolId);
        return vb;
    }

    async loadVirtualBlockchain(vbId: Hash): Promise<VirtualBlockchain> {
        const vbStatus = await this.getVirtualBlockchainState(vbId.toBytes());
        if (vbStatus === null) throw new Error(
            `Virtual Blockchain with hash ${vbId.encode()} does not exist.`
        );
        const vbType = vbStatus.type;
        switch (vbType) {
            case VirtualBlockchainType.ACCOUNT_VIRTUAL_BLOCKCHAIN: return await this.loadAccountVirtualBlockchain(vbId);
            case VirtualBlockchainType.ORGANIZATION_VIRTUAL_BLOCKCHAIN: return await this.loadOrganizationVirtualBlockchain(vbId);
            case VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN: return await this.loadApplicationVirtualBlockchain(vbId);
            case VirtualBlockchainType.NODE_VIRTUAL_BLOCKCHAIN:  return await this.loadValidatorNodeVirtualBlockchain(vbId);
            case VirtualBlockchainType.PROTOCOL_VIRTUAL_BLOCKCHAIN: return await this.loadProtocolVirtualBlockchain(vbId);
            case VirtualBlockchainType.APP_LEDGER_VIRTUAL_BLOCKCHAIN: return await this.loadApplicationLedgerVirtualBlockchain(vbId);
            default: throw new Error(`Unknown virtual blockchain type: ${vbType}`);
        }
    }

    async loadMicroblockByMicroblockHash(microblockHash: Hash): Promise<Microblock> {
        this.log.info(`Loading microblock ${microblockHash.encode()}`)
        const header = await this.getMicroblockHeader(microblockHash);
        const body = await this.getMicroblockBody(microblockHash);
        if (header === null || body === null) throw new Error(`Microblock ${microblockHash.encode()} not found`);
        return Microblock.loadFromHeaderAndBody(header, body)
    }

    async getCurrentFeesFormula() {
        const protocolState = await this.getProtocolState();
        const feesVersion = protocolState.getFeesCalculationVersion();
        return FeesCalculationFormulaFactory.getFeesCalculationFormulaByVersion(this, feesVersion);
    }

    async computeMicroblockFees(
        mb: Microblock,
        options: { signatureSchemeId?: SignatureSchemeId, referenceTimestampInSeconds?: number } = {}
    ): Promise<CMTSToken> {
        const referenceTimestampInSeconds = options.referenceTimestampInSeconds ?? Utils.getTimestampInSeconds();

        let expirationDay = 0;
        if (mb.isGenesisMicroblock()) {
            expirationDay =    Microblock.extractExpirationDayFromGenesisPreviousHash(mb.getPreviousHash().toBytes());
        } else {
            const vbId = await this.getVirtualBlockchainIdContainingMicroblock(mb.getPreviousHash());
            const vbState = await this.getVirtualBlockchainState(vbId.toBytes());
            if (vbState === null) throw new Error("Virtual blockchain state not found");
            expirationDay = vbState.expirationDay;
        }

        const providedSchemeId = options.signatureSchemeId;
        const sigScheme = providedSchemeId ?? mb.getLastSignatureSection().schemeId;
        if (sigScheme === null) throw new Error("Signature scheme ID cannot be null");

        const feesFormula = await this.getCurrentFeesFormula();
        return feesFormula.computeFees(sigScheme, mb, expirationDay, referenceTimestampInSeconds);
    }

    abstract getVirtualBlockchainStatus(virtualBlockchainId: Uint8Array): Promise<VirtualBlockchainStatus | null>
    abstract getAccountIdFromPublicKey(publicKey: PublicSignatureKey): Promise<Hash>;
    abstract getListOfMicroblockBody(microblockHashes: Uint8Array[]): Promise<MicroblockBody[]>
    abstract getMicroblockBody(microblockHash: Hash): Promise<MicroblockBody | null>;
    abstract getMicroblockHeader(microblockHash: Hash): Promise<MicroblockHeader | null>;
    abstract getVirtualBlockchainIdContainingMicroblock(microblockHash: Hash): Promise<Hash>;
    abstract getVirtualBlockchainState(virtualBlockchainId: Uint8Array): Promise<VirtualBlockchainState | null>;
    abstract getProtocolState(): Promise<ProtocolInternalState>;

    private async initializeVirtualBlockchain(vb :VirtualBlockchain, vbId: Hash) {
        const identifier = vbId.toBytes()
        const vbState = await this.getVirtualBlockchainStatus(identifier);
        if (vbState === null || vbState.state === undefined) {
            throw new  VirtualBlockchainNotFoundError(vbId);
        }
        // the type is already assigned when creating the virtual blockchain
        if (vbState.state.type !== vb.getType()) throw new Error("Invalid blockchain type loaded");

        vb.setIdentifier(identifier) //this.identifier = identifier;
        vb.setHeight(vbState.state.height) //this.height = content.state.height;
        vb.setExpirationDay(vbState.state.expirationDay) //this.expirationDay = content.state.expirationDay;
        vb.setMicroblockHashes(vbState.microblockHashes) // this.microblockHashes = content.microblockHashes;
        vb.setInternalState(
            InternalStateFactory.createInternalStateFromObject(
                vb.getType(),
                vbState.state.internalState
            )
        );
    }





}