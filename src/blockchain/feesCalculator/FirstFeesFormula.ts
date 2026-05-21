import {IFeesFormula} from "./IFeesFormula";
import {Microblock} from "../microblock/Microblock";
import {CMTSToken} from "../../economics/currencies/token";
import {ECO} from "../../constants/constants";
import {SectionType} from "../../type/valibot/blockchain/section/SectionType";
import {SignatureSchemeId} from "../../crypto/signature/SignatureSchemeId";
import {Section} from "../../type/valibot/blockchain/section/sections";
import {BlockchainUtils} from "../../utils/BlockchainUtils";
import {IProvider} from "../../providers/IProvider";
import {RetentionCostCalculator} from "./RetentionCostCalculator";
import {Utils} from "../../utils/utils";

/**
 * FirstFeesFormula is a concrete implementation of the IFeesFormula interface.
 * It provides a mechanism to compute the fees for a transaction based on
 * the size of a given microblock and a fixed gas fee formula.
 */
export class FirstFeesFormula implements IFeesFormula {
    private static DEFAULT_GAS_PRICE = CMTSToken.createAtomic(1);

    constructor(private provider: IProvider) {
    }

    async computeFees(
        signatureSchemeId: SignatureSchemeId,
        microblock: Microblock,
        expirationDay: number,
        referenceTimestampInSeconds = Utils.getTimestampInSeconds()
    ): Promise<CMTSToken> {
        if (expirationDay < 0) throw new Error("Invalid expiration day");

        // we start by computing the base gas price
        const definedGasPrice = microblock.getGasPrice();
        const usedGasPrice = definedGasPrice.isZero() ? FirstFeesFormula.DEFAULT_GAS_PRICE : definedGasPrice;
        const gas = await this.computeGas(
            signatureSchemeId,
            microblock,
            expirationDay,
            referenceTimestampInSeconds,
        );
        const fees = CMTSToken.createAtomic(
            gas * usedGasPrice.getAmountAsAtomic()
        );
        return fees;
    }

    async computeGas(
        signatureSchemeId: SignatureSchemeId,
        microblock: Microblock,
        expirationDay: number,
        referenceTimestampInSeconds = Utils.getTimestampInSeconds()
    ) {
        // we compute the base fee
        const totalSize = this.computeSizeInBytesOfMicroblock(microblock);
        const baseStorageCostInGasAtoms = ECO.GAS_PER_BYTE * totalSize * ECO.GAS_ATOMS_PER_GAS;

        // we compute the final price: first, the storage price
        const protocolState = await this.provider.getProtocolState();
        const priceStructure = protocolState.getRetentionPolicy();
        const storagePriceManager = new RetentionCostCalculator(priceStructure);
        const numberOfDaysStorage = storagePriceManager.getNumberOfDaysOfStorage(referenceTimestampInSeconds, expirationDay);
        const storageCostInGasAtoms = storagePriceManager.getStorageCost(baseStorageCostInGasAtoms, numberOfDaysStorage);

        // then, the additional signature-related costs
        const additionalCosts = this.getAdditionalCosts(signatureSchemeId);
        const gas =
            Math.floor(storageCostInGasAtoms / ECO.GAS_ATOMS_PER_GAS) +
            additionalCosts +
            ECO.FIXED_GAS_FEE;
        return gas;
    }

    private getAdditionalCosts(signatureSchemeId: SignatureSchemeId) {
        switch (signatureSchemeId) {
            case SignatureSchemeId.SECP256K1: {
                return 1000;
            }
            case SignatureSchemeId.ML_DSA_65: {
                return 5000;
            }
            case SignatureSchemeId.PKMS_SECP256K1: {
                return 0;
            }
        }
        return 0;
    }

    /**
     * Computes the total size in bytes of the provided microblock, excluding the last section
     * if it is a SIGNATURE type section.
     *
     * @param {Microblock} microblock - The microblock object whose size needs to be computed.
     * @return {number} The total size in bytes of the microblock, excluding any SIGNATURE type section at the end.
     */
    private computeSizeInBytesOfMicroblock(microblock: Microblock): number {
        const sections = microblock.getAllSections();
        if (sections.length === 0) return 0;

        // if the last section is of type SIGNATURE, we exclude it from the computation of the total size
        const isLastSectionSig = sections[sections.length - 1].type === SectionType.SIGNATURE;
        let sectionsUsedInComputeOfSize = isLastSectionSig ?
            sections.slice(0, sections.length - 1) :
            sections;
        const totalSize = this.getSizeOfListOfSections(sectionsUsedInComputeOfSize)
        return totalSize
    }

    private getSizeOfListOfSections(sections: Section[]): number {
        return sections.reduce(
            (total: number, section: Section) => {
                const serializedSection = BlockchainUtils.encodeSection(section)
                return total + serializedSection.length
            },
            0
        );
    }
}