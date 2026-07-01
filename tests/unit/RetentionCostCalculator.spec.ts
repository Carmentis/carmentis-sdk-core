import { describe, it, expect } from 'vitest'
import { RetentionCostCalculator } from '../../src/blockchain/feesCalculator/RetentionCostCalculator';
import { CMTSToken } from "../../src/economics/currencies/token";
import { RetentionPolicy } from "../../src/type/valibot/blockchain/economics/RetentionPolicy";
import { ECO } from "../../src/constants/constants";

describe("storage price manager", () => {
    it("Should compute correct prices", () => {
        const retentionPolicy: RetentionPolicy = [
            { retentionRatio: 100, maximumNumberOfDays: 366, dayDivisor: 366 },       // 1 * 1.0 = 1.0
            { retentionRatio: 50, maximumNumberOfDays: 366 * 5, dayDivisor: 366 },    // 4 * 0.5 = 2.0
            { retentionRatio: 20, maximumNumberOfDays: 366 * 10, dayDivisor: 366 },   // 5 * 0.2 = 1.0
            // an extra rate of 1.0 is applied for any number of days beyond 10 years
            // (in particular, this is what happens for infinite storage)
            { retentionRatio: 100, maximumNumberOfDays: 366 * 10 + 1, dayDivisor: 1 },
        ];

        const storagePriceManager = new RetentionCostCalculator(retentionPolicy);

        const cost30 = Math.floor(30 * 0.1 * ECO.GAS_ATOMS_PER_GAS / 366);
        const cost366 = Math.floor(366 * 0.1 * ECO.GAS_ATOMS_PER_GAS / 366);
        const oneDayBeyondOneYear = Math.floor(0.05 * ECO.GAS_ATOMS_PER_GAS / 366);
        const fourYears = Math.floor(366 * 4 * 0.05 * ECO.GAS_ATOMS_PER_GAS / 366);
        const fiveYears = Math.floor(366 * 5 * 0.02 * ECO.GAS_ATOMS_PER_GAS / 366);
        const infinite = 0.1 * ECO.GAS_ATOMS_PER_GAS;

        const tests = [
            [  30, cost30 ],
            [  366, cost366 ],
            [  367, cost366 + oneDayBeyondOneYear ],
            [  366 * 5, cost366 + fourYears ],
            [  366 * 10, cost366 + fourYears + fiveYears ],
            [  366 * 10 + 1, cost366 + fourYears + fiveYears + infinite ],
            [  366 * 10 + 1000, cost366 + fourYears + fiveYears + infinite ],
        ];

        tests.forEach(([ days, expectedCostInGasAtoms ]) => {
            const baseFee = CMTSToken.createCMTS(1).getAmountAsAtomic();
            const costInGasAtoms = storagePriceManager.getStorageCost(baseFee, days);

            console.log(days, storagePriceManager.getBreakdown(baseFee, days));
            console.log(days, costInGasAtoms);
            expect(costInGasAtoms).toEqual(expectedCostInGasAtoms);
        });
    })
})
