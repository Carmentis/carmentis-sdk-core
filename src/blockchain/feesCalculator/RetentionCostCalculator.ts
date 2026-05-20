import {RetentionCostBreakdown, RetentionPolicy} from "../../type/valibot/blockchain/economics/RetentionPolicy";

const SECONDS_IN_DAY = 86400;

export class RetentionCostCalculator {
    constructor(private readonly retentionPolicy: RetentionPolicy) {
        // make sure that the price categories are sorted from lowest to highest number of days
        this.retentionPolicy.sort((a, b) => a.maximumNumberOfDays - b.maximumNumberOfDays);
    }

    getNumberOfDaysOfStorage(blockTimestamp: number, expirationDay: number) {
        if (expirationDay > 0) {
            return Math.max(1, Math.round((expirationDay - blockTimestamp) / SECONDS_IN_DAY));
        }
        // for endless storage, we pay for the highest number of days defined in the retention policy
        return this.retentionPolicy[this.retentionPolicy.length - 1].maximumNumberOfDays;
    }

    getStorageCost(baseCostInGasAtoms: number, numberOfDays: number) {
        const breakdown = this.getBreakdown(baseCostInGasAtoms, numberOfDays);
        const costInGasAtoms = breakdown.reduce((total, entry) => {
            return total + entry.costInGasAtoms;
        }, 0);
        return costInGasAtoms;
    }

    getBreakdown(baseCostInGasAtoms: number, numberOfDays: number): RetentionCostBreakdown[] {
        const breakdown = [];

        for (let index = 0, days = 0; days < numberOfDays; index++) {
            const policy = this.retentionPolicy[index];
            let policyDays: number;
            let retentionRatio: number;
            let dayDivisor: number;

            if (policy == undefined) {
                policyDays = numberOfDays - days;
                retentionRatio = 0;
                dayDivisor = 1;
            }
            else {
                policyDays = Math.min(policy.maximumNumberOfDays, numberOfDays) - days;
                retentionRatio = policy.retentionRatio;
                dayDivisor = policy.dayDivisor;
            }
            const costInGasAtoms = Math.floor(
                baseCostInGasAtoms * policyDays * retentionRatio / 100 / dayDivisor
            );
            breakdown.push({
                numberOfDays: policyDays,
                retentionRatio,
                costInGasAtoms,
            });
            days += policyDays;
        }
        return breakdown;
    }
}
