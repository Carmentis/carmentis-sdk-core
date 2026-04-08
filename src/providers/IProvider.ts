import {Hash} from "../entities/Hash";
import {ValidatorNodeVb} from "../blockchain/virtualBlockchains/ValidatorNodeVb";
import {AccountVb} from "../blockchain/virtualBlockchains/AccountVb";
import {ApplicationLedgerVb} from "../blockchain/virtualBlockchains/ApplicationLedgerVb";
import {ApplicationVb} from "../blockchain/virtualBlockchains/ApplicationVb";
import {OrganizationVb} from "../blockchain/virtualBlockchains/OrganizationVb";
import {ProtocolVb} from "../blockchain/virtualBlockchains/ProtocolVb";
import {PublicSignatureKey} from "../crypto/signature/PublicSignatureKey";
import {ProtocolInternalState} from "../blockchain/internalStates/ProtocolInternalState";
import {MicroblockHeader} from "../type/valibot/blockchain/microblock/MicroblockHeader";
import {MicroblockBody} from "../type/valibot/blockchain/microblock/MicroblockBody";
import {VirtualBlockchainState} from "../type/valibot/blockchain/virtualBlockchain/virtualBlockchains";
import {VirtualBlockchainStatus} from "../type/valibot/provider/VirtualBlockchainStatus";
import {Microblock} from "../blockchain/microblock/Microblock";
import {SignatureSchemeId} from "../crypto/signature/SignatureSchemeId";
import {Utils} from "../utils/utils";
import {CMTSToken} from "../economics/currencies/token";

export interface IProvider {
    getVirtualBlockchainIdContainingMicroblock(microblockHash: Hash): Promise<Hash>;
    getMicroblockHeader(microblockHash: Hash): Promise<MicroblockHeader|null>;
    getMicroblockBody(microblockHash: Hash): Promise<MicroblockBody|null>;
    getListOfMicroblockBody(microblockHashes: Uint8Array[]):  Promise<MicroblockBody[]>;

    /**
     * Returns the state of the virtual blockchain.
     *
     * When returns null, it means that the virtual blockchain does not exist.
     *
     * Note: It should not be confused with an internal state, which is a blockchain-type-specific state.
     *
     * @param virtualBlockchainId
     */
    getVirtualBlockchainState(virtualBlockchainId: Uint8Array): Promise<VirtualBlockchainState | null>

    /**
     * Returns the status of the virtual blockchains.
     *
     * This method returns the virtual blockchain state and the list of microblock hashes composing the virtual blockchain.
     * @param virtualBlockchainId
     */
    getVirtualBlockchainStatus(virtualBlockchainId: Uint8Array): Promise<VirtualBlockchainStatus | null>
    getAccountIdFromPublicKey(publicKey: PublicSignatureKey): Promise<Hash>;
    loadProtocolVirtualBlockchain(protocolId: Hash): Promise<ProtocolVb>;
    loadValidatorNodeVirtualBlockchain(validatorNodeId: Hash): Promise<ValidatorNodeVb>;
    loadAccountVirtualBlockchain(accountId: Hash): Promise<AccountVb>;
    loadApplicationLedgerVirtualBlockchain(appLedgerId: Hash): Promise<ApplicationLedgerVb>;
    loadApplicationVirtualBlockchain(applicationId: Hash): Promise<ApplicationVb>;
    loadOrganizationVirtualBlockchain(organizationId: Hash): Promise<OrganizationVb>;

    /**
     * Returns the rules of the protocol.
     *
     * Note that the protocol parameters are defined in the internal state of the protocol virtual blockchain.
     */
    getProtocolState(): Promise<ProtocolInternalState>;

    computeMicroblockFees(
        mb: Microblock,
        options?: { signatureSchemeId?: SignatureSchemeId, referenceTimestampInSeconds?: number }
    ): Promise<CMTSToken>
}