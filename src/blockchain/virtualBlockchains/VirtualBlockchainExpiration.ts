import {Utils} from "../../utils/utils";

/**
 * Class representing the expiration of a virtual blockchain.
 */
export class VirtualBlockchainExpiration {

    /**
     * Represents a method that returns a constant value indicating no expiration.
     *
     * @return {number} Returns the numeric representation of no expiration, typically 0.
     */
    static noExpiration() {
        return 0;
    }

    /**
     * Calculates the expiration timestamp in seconds based on the current timestamp and the provided number of days.
     *
     * @param {number} numberOfDaysOnChain - The number of days to add to the current timestamp to determine the expiration.
     * @return {number} The expiration timestamp in seconds.
     */
    static expiresInDays(numberOfDaysOnChain: number) {
        return Utils.addDaysToTimestamp(Utils.getTimestampInSeconds(), numberOfDaysOnChain)
    }


    /**
     * Calculates the timestamp in seconds representing the expiration date after a given number of days from a reference timestamp.
     *
     * @param {number} referenceTimestampInSeconds - The initial timestamp in seconds used as the starting point.
     * @param {number} numberOfDaysOnChain - The number of days to add to the reference timestamp to determine the expiration date.
     * @return {number} The calculated timestamp in seconds representing the expiration date.
     */
    static expiresInDaysAfter(referenceTimestampInSeconds: number, numberOfDaysOnChain: number) {
        return Utils.addDaysToTimestamp(referenceTimestampInSeconds, numberOfDaysOnChain)
    }

}