import {Microblock} from "./Microblock";
import {VirtualBlockchain} from "../virtualBlockchains/VirtualBlockchain";
import {Utils} from "../../utils/utils";
import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {OrganizationVb} from "../virtualBlockchains/OrganizationVb";
import {AccountVb} from "../virtualBlockchains/AccountVb";
import {ApplicationVb} from "../virtualBlockchains/ApplicationVb";
import {ValidatorNodeVb} from "../virtualBlockchains/ValidatorNodeVb";
import {ProtocolVb} from "../virtualBlockchains/ProtocolVb";
import {ApplicationLedgerVb} from "../virtualBlockchains/ApplicationLedgerVb";
import {TimestampValidationResult} from "./TimestampValidationResult";
import {MicroblockHeaderObject} from "../../type/types";
import {Optional} from "../../entities/Optional";
import {IllegalStateError} from "../../errors/carmentis-error";
import {Hash} from "../../entities/Hash";
import {IProvider} from "../../providers/IProvider";
import {BlockchainUtils} from "../../utils/BlockchainUtils";
import {FeesCalculationFormulaFactory} from "../feesCalculator/FeesCalculationFormulaFactory";
import {IFeesFormula} from "../feesCalculator/IFeesFormula";

type MicroblockCheckerState =
    { isMicroblockParsingCompleted: false } |
    {
        isMicroblockParsingCompleted: true,
        virtualBlockchain: VirtualBlockchain,
    }
/**
 * This class is responsible for checking the validity of a microblock.
 * An improved version of MicroblockImporter with cleaner separation of concerns.
 */
export class MicroblockConsistencyChecker {
    private _error: Optional<Error> = Optional.none();
    private hash!: Uint8Array;
    private header!: MicroblockHeaderObject;
    private verificationState: MicroblockCheckerState = { isMicroblockParsingCompleted: false };

    constructor(
        private readonly provider: IProvider,
        private readonly checkedMicroblock: Microblock
    ) {}

    async checkVirtualBlockchainConsistencyOrFail() {
        if (this.verificationState.isMicroblockParsingCompleted)
            throw new IllegalStateError("You have already called parseMicroblock() method. You can only call it once.")

        // Validate body hash
        const isDeclaringConsistentBodyHash = this.checkedMicroblock.isDeclaringConsistentBodyHash();
        if (!isDeclaringConsistentBodyHash) {
            throw new Error(`inconsistent body hash detected for microblock hash ${Utils.binaryToHexa(this.checkedMicroblock.getHashAsBytes())}`);
        }

        // Determine VB type and handle VB loading/creation
        let type: VirtualBlockchainType = this.checkedMicroblock.getType();
        let expirationDay = 0;
        let vbId: Hash;
        const previousHash = this.checkedMicroblock.getPreviousHash().toBytes();
        if (this.checkedMicroblock.isGenesisMicroblock()) {
            // Genesis microblock - extract type and expiration day from previousHash field
            const genesisPreviousHash = previousHash;
            type = Microblock.extractTypeFromGenesisPreviousHash(genesisPreviousHash)
            vbId = this.checkedMicroblock.getHash();
        } else {
            // load the microblock information of the previous block
            const previousMicroblockHeader = await this.provider.getMicroblockHeader(Hash.from(previousHash));
            if (!previousMicroblockHeader) {
                throw new Error(`previous microblock ${Utils.binaryToHexa(previousHash)} not found`);
            }
            if (this.checkedMicroblock.getHeight() != previousMicroblockHeader.height + 1) {
                throw new Error(`inconsistent microblock height (expected ${previousMicroblockHeader.height + 1}, got ${this.checkedMicroblock.getHeight()})`);
            }

            //type = previousMicroblockInfo.virtualBlockchainType;
            const previousBlockHash = BlockchainUtils.computeMicroblockHashFromHeader(previousMicroblockHeader);
            vbId = await this.provider.getVirtualBlockchainIdContainingMicroblock(Hash.from(previousBlockHash))
        }


        // Instantiate the appropriate VB class
        let vb: VirtualBlockchain;
        if (this.checkedMicroblock.isGenesisMicroblock()) {
            switch (type) {
                case VirtualBlockchainType.ORGANIZATION_VIRTUAL_BLOCKCHAIN:
                    vb = new OrganizationVb(this.provider)
                    break;
                case VirtualBlockchainType.ACCOUNT_VIRTUAL_BLOCKCHAIN:
                    vb = new AccountVb(this.provider)
                    break;
                case VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN:
                    vb = new ApplicationVb(this.provider)
                    break;
                case VirtualBlockchainType.NODE_VIRTUAL_BLOCKCHAIN:
                    vb = new ValidatorNodeVb(this.provider)
                    break;
                case VirtualBlockchainType.PROTOCOL_VIRTUAL_BLOCKCHAIN:
                    vb = new ProtocolVb(this.provider);
                    break;
                case VirtualBlockchainType.APP_LEDGER_VIRTUAL_BLOCKCHAIN:
                    vb = new ApplicationLedgerVb(this.provider);
                    break;
                default:
                    throw new Error(`Unknown virtual blockchain type: ${type}`);
            }
            const genesisPreviousHash = this.checkedMicroblock.getPreviousHash().toBytes();
            expirationDay = Microblock.extractExpirationDayFromGenesisPreviousHash(genesisPreviousHash)
            vb.setExpirationDay(expirationDay);
        } else {
            switch (type) {
                case VirtualBlockchainType.ORGANIZATION_VIRTUAL_BLOCKCHAIN:
                    vb = await this.provider.loadOrganizationVirtualBlockchain(vbId)
                    break;
                case VirtualBlockchainType.ACCOUNT_VIRTUAL_BLOCKCHAIN:
                    vb = await this.provider.loadAccountVirtualBlockchain(vbId)
                    break;
                case VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN:
                    vb = await this.provider.loadApplicationVirtualBlockchain(vbId)
                    break;
                case VirtualBlockchainType.NODE_VIRTUAL_BLOCKCHAIN:
                    vb = await this.provider.loadValidatorNodeVirtualBlockchain(vbId)
                    break;
                case VirtualBlockchainType.PROTOCOL_VIRTUAL_BLOCKCHAIN:
                    vb = await this.provider.loadProtocolVirtualBlockchain(vbId)
                    break;
                case VirtualBlockchainType.APP_LEDGER_VIRTUAL_BLOCKCHAIN:
                    vb = await this.provider.loadApplicationLedgerVirtualBlockchain(vbId)
                    break;
                default:
                    throw new Error(`Unknown virtual blockchain type: ${type}`);
            }
        }
            // TODO assert the type

        // we finally update the state of the virtual blockchain by adding the parsed microblock inside the vb
        await vb.appendMicroBlock(this.checkedMicroblock)
        this.verificationState = { isMicroblockParsingCompleted: true, virtualBlockchain: vb };
    }

    checkTimestampOrFail(currentTimestamp?: number) {
        if (this.verificationState.isMicroblockParsingCompleted === false)
            throw new IllegalStateError("You have already called reconstructMicroblockAndVirtualBlockchain() method. You can only call it once.")

        // check the microblock timestamp
        const microblock = this.checkedMicroblock;
        currentTimestamp = currentTimestamp || Utils.getTimestampInSeconds();
        const result = microblock.isTemporallyCloseTo(currentTimestamp);

        // raise an error if the timestamp is too far in the past
        if (result === TimestampValidationResult.TOO_FAR_IN_THE_PAST)
            throw new Error(`timestamp is too far in the past (header:${this.header.timestamp} / current:${currentTimestamp})`);

        if (result === TimestampValidationResult.TOO_FAR_IN_THE_FUTURE)
            throw new Error(`timestamp is too far in the future (header:${this.header.timestamp} / current:${currentTimestamp})`);

    }

    /**
     * Verifies that the declared gas matches the computed gas.
     */
    async checkGasOrFail(referenceTimestamp: number = Utils.getTimestampInSeconds()): Promise<void> {
        if (this.verificationState.isMicroblockParsingCompleted === false)
            throw new IllegalStateError("You have already called reconstructMicroblockAndVirtualBlockchain() method. You can only call it once.")

        const microblock = this.checkedMicroblock;
        const computedFees = await this.provider.computeMicroblockFees(
            microblock,
            { referenceTimestampInSeconds: referenceTimestamp }
        );
        const maxFees = microblock.getMaxFees();
        if (maxFees.getAmountAsAtomic() < computedFees.getAmountAsAtomic()) {
            throw new Error(`Computed fees ${computedFees.toString()} is strictly higher than max fees ${maxFees.toString()} `);
        }
    }


    private get virtualBlockchain() {
        if (this.verificationState.isMicroblockParsingCompleted) {
            return this.verificationState.virtualBlockchain
        } else {
            throw new IllegalStateError('Virtual blockchain not initialized.')
        }
    }


    /**
     * Get the virtual blockchain instance.
     */
    getVirtualBlockchain(): VirtualBlockchain {
        return this.virtualBlockchain;
    }

    /**
     * Get the microblock instance.
     */
    getMicroblock(): Microblock {
        return this.checkedMicroblock;
    }

    /**
     * Get the microblock hash.
     */
    getHash(): Uint8Array {
        return this.hash;
    }

    /**
     * Get any error that occurred during processing.
     */
    getError(): Optional<Error> {
        return this._error;
    }

    /**
     * Check if there's an error.
     */
    containsError(): boolean {
        return this._error.isSome();
    }

    /**
     * Get error as string.
     */
    get error(): string {
        if (this.containsError()) {
            return this._error.unwrap().toString();
        } else {
            return '';
        }
    }
}