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

    static getFeesCalculationFormulaByVersion(provider: IProvider, version: number): IFeesFormula {
        return this.getGenesisFeesCalculationFormula(provider);
    }

}
