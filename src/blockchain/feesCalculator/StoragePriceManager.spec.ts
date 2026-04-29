import { describe, it, expect } from 'vitest'
import { StoragePriceManager } from './storagePriceManager';
import {CMTSToken} from "../../economics/currencies/token";
import {PriceStructure} from "../../type/valibot/blockchain/economics/PriceStructure";

describe("storage price manager", () => {
    it("Should compute correct prices", () => {
        const priceStructure: PriceStructure = [
            { pricingRate: 100, maximumNumberOfDays: 366, divisor: 366 },       // 1 * 1.0 = 1.0
            { pricingRate: 50, maximumNumberOfDays: 366 * 5, divisor: 366 },    // 4 * 0.5 = 2.0
            { pricingRate: 20, maximumNumberOfDays: 366 * 10, divisor: 366 },   // 5 * 0.2 = 1.0
            // an extra rate of 1.0 is applied for any number of days beyond 10 years
            // (in particular, this is what happens for infinite storage)
            { pricingRate: 100, maximumNumberOfDays: 366 * 10 + 1, divisor: 1 },
        ];

        const storagePriceManager = new StoragePriceManager(priceStructure);

        const cost30 = Math.floor(30 * 100000 / 366);
        const cost366 = Math.floor(366 * 100000 / 366);
        const oneDayBeyondOneYear = Math.floor(0.5 * 100000 / 366);
        const fourYears = Math.floor(366 * 4 * 0.5 * 100000 / 366);
        const fiveYears = Math.floor(366 * 5 * 0.2 * 100000 / 366);

        const tests = [
            [  30, cost30 ],
            [  366, cost366 ],
            [  367, cost366 + oneDayBeyondOneYear ],
            [  366 * 5, cost366 + fourYears ],
            [  366 * 10, cost366 + fourYears + fiveYears ],
            [  366 * 10 + 1, cost366 + fourYears + fiveYears + 100000 ],
            [  366 * 10 + 1000, cost366 + fourYears + fiveYears + 100000 ],
        ];

        tests.forEach(([ days, expectedPriceInAtomics ]) => {
            const baseFee = CMTSToken.createCMTS(1);
            const computedPrice = storagePriceManager.getStoragePrice(baseFee, days);
            const computedPriceInAtomics = computedPrice.getAmountAsAtomic();

            console.log(days, storagePriceManager.getBreakdown(baseFee, days));
            console.log(days, computedPriceInAtomics);
            expect(computedPriceInAtomics).toEqual(expectedPriceInAtomics);
        });
    })
})
