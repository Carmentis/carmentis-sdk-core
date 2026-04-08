import {IInternalState} from "./IInternalState";
import {Utils} from "../../utils/utils";
import {
    ProtocolVBInternalStateObject,
    ProtocolVBInternalStateObjectSchema
} from "../../type/valibot/blockchain/virtualBlockchain/internalStates";
import * as v from 'valibot';
import {ProtocolVariables} from "../../type/valibot/blockchain/protocol/ProtocolVariables";
import {PriceStructure} from "../../type/valibot/blockchain/economics/PriceStructure";
import {CMTSToken} from "../../economics/currencies/token";

enum ProtocolName {
    INITIAL_PROTOCOL_VERSION_NAME = "Clermont"
}

export class ProtocolInternalState implements IInternalState {

    constructor(private internalState: ProtocolVBInternalStateObject) {
    }

    static createFromObject(internalState: unknown) {
        const parseResult = v.safeParse(ProtocolVBInternalStateObjectSchema, internalState);
        if (parseResult.success) {
            return new ProtocolInternalState(parseResult.output)
        } else {
            throw new Error(`Provided internal state is not valid: ${parseResult.issues}` )
        }
    }

    static createInitialState() {
        const priceStructure: PriceStructure = [
            { pricingRate: 100, maximumNumberOfDays: 7 },
            { pricingRate: 70, maximumNumberOfDays: 30 },
            { pricingRate: 40, maximumNumberOfDays: 365 },
            { pricingRate: 20, maximumNumberOfDays: 3650 },
            { pricingRate: 10, maximumNumberOfDays: 36500 },
        ];

        return new ProtocolInternalState({
            organizationId: Utils.getNullHash(),
            currentProtocolVariables: {
                protocolVersionName: ProtocolName.INITIAL_PROTOCOL_VERSION_NAME,
                protocolVersion: 1,
                feesCalculationVersion: 1,
                globalStateUpdaterVersion: 1,
                applicationLedgerInternalStateUpdaterVersion: 1,
                applicationInternalStateUpdaterVersion: 1,
                organizationInternalStateUpdaterVersion: 1,
                validatorNodeInternalStateUpdaterVersion: 1,
                accountInternalStateUpdaterVersion: 1,
                protocolInternalStateUpdaterVersion: 1,
                minimumNodeStakingAmountInAtomics: CMTSToken.create(1_000_000).getAmountAsAtomic(),
                maximumNodeStakingAmountInAtomics: CMTSToken.create(10_000_000).getAmountAsAtomic(),
                unstakingDelayInDays: 30,
                maxBlockSizeInBytes: 4_194_304,
                priceStructure,
                abciVersion: 1,
            },
            protocolUpdates: []
        });
    }

    /**
     * Returns the ABCI version to use.
     *
     * See https://docs.cometbft.com/v0.38/spec/abci/
     */
    getAbciVersion() {
        return this.internalState.currentProtocolVariables.abciVersion;
    }

    /**
     * Returns the maximum block size in bytes allowed by the current protocol variables.
     */
    getMaximumBlockSizeInBytes() {
        return this.internalState.currentProtocolVariables.maxBlockSizeInBytes;
    }

    getProtocolVariables() {
        return this.internalState.currentProtocolVariables;
    }

    getApplicationLedgerInternalStateUpdaterVersion() {
        return this.internalState.currentProtocolVariables.applicationLedgerInternalStateUpdaterVersion;
    }

    getApplicationInternalStateUpdaterVersion() {
        return this.internalState.currentProtocolVariables.applicationInternalStateUpdaterVersion;
    }

    getOrganizationInternalStateUpdaterVersion() {
        return this.internalState.currentProtocolVariables.organizationInternalStateUpdaterVersion;
    }

    getValidatorNodeInternalStateUpdaterVersion() {
        return this.internalState.currentProtocolVariables.validatorNodeInternalStateUpdaterVersion;
    }

    getAccountInternalStateUpdaterVersion() {
        return this.internalState.currentProtocolVariables.accountInternalStateUpdaterVersion;
    }

    getProtocolInternalStateUpdaterVersion() {
        return this.internalState.currentProtocolVariables.protocolInternalStateUpdaterVersion;
    }

    getMinimumNodeStakingAmountInAtomics() {
        return this.internalState.currentProtocolVariables.minimumNodeStakingAmountInAtomics;
    }

    getMaximumNodeStakingAmountInAtomics() {
        return this.internalState.currentProtocolVariables.maximumNodeStakingAmountInAtomics;
    }

    getUnstakingDelayInDays() {
        return this.internalState.currentProtocolVariables.unstakingDelayInDays;
    }

    getPriceStructure() {
        return this.internalState.currentProtocolVariables.priceStructure;
    }

    toObject(): ProtocolVBInternalStateObject {
        return this.internalState;
    }

    getFeesCalculationVersion() {
        return this.internalState.currentProtocolVariables.feesCalculationVersion;
    }

    setProtocolVersion(protocolVersion: number) {
        this.internalState.currentProtocolVariables.protocolVersion = protocolVersion;
    }

    setProtocolVersionName(protocolVersionName: string) {
        this.internalState.currentProtocolVariables.protocolVersionName = protocolVersionName;
    }

    setProtocolVariables(protocolVariables: ProtocolVariables) {
        this.internalState.currentProtocolVariables = protocolVariables;
    }

	setOrganizationId(organizationId: Uint8Array) {
		this.internalState.organizationId = organizationId;
	}
}