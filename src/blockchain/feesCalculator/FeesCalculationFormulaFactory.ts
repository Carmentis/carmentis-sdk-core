import {FirstFeesFormula} from "./FirstFeesFormula";
import {IFeesFormula} from "./IFeesFormula";
import {IProvider} from "../../providers/IProvider";

/**
 * The FeesCalculator class is responsible for calculating fees associated with a given microblock.
 */
export class FeesCalculationFormulaFactory {
    /**
     * This method returns the fees calculation formula used for the first microblock of the blockchain.
     */
    static getGenesisFeesCalculationFormula(provider: IProvider): IFeesFormula {
        return new FirstFeesFormula(provider);
    }

    static getSecondFeesCalculationFormula(provider: IProvider): IFeesFormula {
        return new FirstFeesFormula(provider);
    }

    static async getFeesCalculationFormulaByVersion(provider: IProvider, feesCalculationVersion: number): Promise<IFeesFormula> {
        switch (feesCalculationVersion) {
            case 1: {
                return this.getGenesisFeesCalculationFormula(provider);
            }
            case 2: {
                return this.getSecondFeesCalculationFormula(provider);
            }
        }
        throw new Error(`No fees formula for feesCalculationVersion = ${feesCalculationVersion}`);
    }
}
