import {EconomicsError, InvalidTokenUnitError} from "../../errors/carmentis-error";
import {Currency} from "./currency";
import Decimal from "decimal.js";
import {toNumber} from "valibot";

/**
 * Enum representing the units of a tokenized system.
 *
 * `TokenUnit` defines multiple denominations of a token, where
 * each denomination is represented by a numeric value that
 * corresponds to the fractional relationship with the base unit.
 *
 * Properties:
 * - `TOKEN`: The base unit of the system. Equals 1.
 * - `CENTI_TOKEN`: Represents one-hundredth (1/100) of the base unit. Equals 100.
 * - `MILLI_TOKEN`: Represents one-thousandth (1/1000) of the base unit. Equals 1000.
 *
 * This enum can be used for token denomination conversions and comparisons.
 */
export enum TokenUnit {
    TOKEN = 100_000,       // 1 CMTS
    DECI_TOKEN = 10_000,   // deci-token = 0.1 CMTS
    CENTI_TOKEN = 1_000,   // centi-token = 0.01 CMTS
    MILLI_TOKEN = 100,     // milli-token = 0.001 CMTS
    MICRO_TOKEN = 10,      // micro-token = 0.0001 CMTS (FIXME: misleading name)
    ATOMIC = 1,            // atomic unit = 0.00001 CMTS (smallest token unit)
}

/**
 * Enum representing token unit labels.
 *
 * This enum is used to define a label for tokens, where each key represents
 * the name of the label and its associated value represents the specific token unit.
 *
 * The `TokenUnitLabel` provides a standardized way to represent token-related labels in the application.
 *
 * Enum Members:
 * - `TOKEN`: Represents the token unit labeled as 'CMTS'.
 *
 * Typically used in contexts where token structure or labeling standardization is required.
 */
export enum TokenUnitLabel {
    TOKEN = 'CMTS',          // 100_000 (1 CMTS)
    DECI_TOKEN = 'dCMTS',    // 10_000 (0.1 CMTS)
    CENTI_TOKEN = 'cCMTS',   // 1_000 (0.01 CMTS)
    MILLI_TOKEN = 'mCMTS',   // 100 (0.001 CMTS)
    MICRO_TOKEN = 'μCMTS',   // 10 (0.0001 CMTS) (FIXME: misleading name)
    ATOMIC = 'aCMTS',        // 1 (0.00001 CMTS)
}


/**
 * A class representing a specific amount of a token in a defined unit.
 */
export class CMTSToken implements Currency{

    private constructor(private amount: Decimal) {}

    /**
     * Creates an instance of TokenAmount with the given amount and unit.
     * Throws an error if the provided unit is not of type TokenUnit.TOKEN.
     *
     * @param {number} amount - The numeric amount to be used for the TokenAmount instance.
     * @param {TokenUnit} [unit=TokenUnit.TOKEN] - The unit type for the token, defaults to TokenUnit.TOKEN.
     * @return {CMTSToken} A new instance of TokenAmount with the specified amount and unit.
     */
    static create(amount: number, unit: TokenUnit = TokenUnit.TOKEN) {
        if (unit != TokenUnit.TOKEN) throw new InvalidTokenUnitError();
        return this.createCMTS(amount);
    }

    static createCMTS(amount: number) {
        return this.createSafeCmtsToken(Decimal(amount), Decimal(TokenUnit.TOKEN));
    }

    static createDeciToken(amount: number) {
        return this.createSafeCmtsToken(Decimal(amount), Decimal(TokenUnit.DECI_TOKEN));
    }

    static createMicroToken(amount: number) {
        return this.createSafeCmtsToken(Decimal(amount), Decimal(TokenUnit.MICRO_TOKEN));
    }

    static createMilliToken(amount: number) {
        return this.createSafeCmtsToken(Decimal(amount), Decimal(TokenUnit.MILLI_TOKEN));
    }

    static createCentiToken(amount: number) {
        return this.createSafeCmtsToken(Decimal(amount), Decimal(TokenUnit.CENTI_TOKEN));
    }

    static createMillionToken(amount: number) {
        return this.createSafeCmtsToken(Decimal(amount), Decimal(TokenUnit.MICRO_TOKEN));
    }

    static createAtomic(amount: number) {
        return this.createSafeCmtsToken(Decimal(amount), Decimal(TokenUnit.ATOMIC));
    }

    private static createSafeCmtsToken(amount: Decimal, unit: Decimal) {
        const amountInAtomic = amount.mul(unit);
        if (amountInAtomic.isInteger()) {
            return new CMTSToken(amountInAtomic);
        } else {
            throw new EconomicsError(`Invalid amount: An atomic token should be insecable: got ${amountInAtomic}`)
        }
    }

    /**
     * Creates an instance of CMTSToken having zero-value.
     *
     * Example:
     * ```ts
     * const zero = CMTSToken.zero();
     * ```
     */
    static zero() {
        return this.createAtomic(0);
    }

    static oneCMTS() {
        return this.createCMTS(1);
    }

    /**
     * Parses a string representing a token amount and returns a TokenAmount instance.
     *
     * @param {string} value - The input string containing a numeric amount followed by a unit (e.g., "10.50 CMTS", "5 mCMTS").
     * @return {CMTSToken} A TokenAmount object containing the parsed numeric amount and the token unit.
     * @throws {EconomicsError} If the input string format is invalid.
     * @throws {InvalidTokenUnitError} If the unit in the input string is not valid.
     */
    static parse(value: string) {
        const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*(\S+)$/);
        if (!match) {
            throw new EconomicsError(`Invalid token amount format: "${value}"`);
        }
        const [, amountStr, unit] = match;
        const amount = parseFloat(amountStr);

        switch (unit) {
            case TokenUnitLabel.TOKEN:
                return CMTSToken.createCMTS(amount);
            case TokenUnitLabel.DECI_TOKEN:
                return CMTSToken.createDeciToken(amount);
            case TokenUnitLabel.CENTI_TOKEN:
                return CMTSToken.createCentiToken(amount);
            case TokenUnitLabel.MILLI_TOKEN:
                return CMTSToken.createMilliToken(amount);
            case TokenUnitLabel.MICRO_TOKEN:
                return CMTSToken.createMicroToken(amount);
            case TokenUnitLabel.ATOMIC:
                return CMTSToken.createAtomic(amount);
            default:
                throw new InvalidTokenUnitError();
        }
    }

    getAmount(unit : TokenUnit = TokenUnit.TOKEN): number {
        switch (unit) {
            case TokenUnit.TOKEN: return this.amount.div(Decimal(TokenUnit.TOKEN)).toNumber();
            case TokenUnit.CENTI_TOKEN: return this.amount.div(Decimal(TokenUnit.CENTI_TOKEN)).toNumber();
            case TokenUnit.MILLI_TOKEN: return this.amount.div(Decimal(TokenUnit.MILLI_TOKEN)).toNumber();
            case TokenUnit.DECI_TOKEN: return this.amount.div(Decimal(TokenUnit.DECI_TOKEN)).toNumber();
            case TokenUnit.MICRO_TOKEN: return this.amount.div(Decimal(TokenUnit.MICRO_TOKEN)).toNumber();
            case TokenUnit.ATOMIC: return this.amount.toNumber();
        }
    }

    /**
     * Retrieves the amount as an atomic unit.
     * Converts and returns the amount in the smallest unit of the token.
     *
     * @return {number} The amount represented as an atomic unit.
     */
    getAmountAsAtomic() {
        return this.getAmount(TokenUnit.ATOMIC)
    }

    /**
     * Retrieves the amount formatted as CMTS (specific token unit).
     * Utilizes the value formatted in the designated token
     */
    getAmountAsCMTS() {
        return this.getAmount(TokenUnit.TOKEN)
    }

    /**
     * Determines if the amount is positive or zero.
     *
     * @return {boolean} Returns true if the amount is greater than or equal to zero; otherwise, false.
     */
    isPositive(): boolean {
        return this.amount.isPositive() || this.amount.isZero();
    }

    isPositiveStrict(): boolean {
        return this.isPositive() && !this.isZero();
    }

    isNegative(): boolean {
        return this.amount.isNegative();
    }

    isZero(): boolean {
        return this.amount.isZero();
    }


    /**
     * Compares the current TokenAmount instance with another TokenAmount instance for equality.
     *
     * @param {CMTSToken} other - The TokenAmount instance to compare with the current instance.
     * @return {boolean} Returns true if both TokenAmount instances have the same amount and unit, otherwise returns false.
     */
    equals(other: CMTSToken): boolean {
        return this.amount.equals(other.amount);
    }

    /**
     * Compares the current TokenAmount with another TokenAmount to determine if it is greater.
     *
     * @param {CMTSToken} other The TokenAmount to compare with.
     * @return {boolean} Returns true if the current TokenAmount is greater than the given TokenAmount, otherwise false.
     */
    isGreaterThan(other: CMTSToken): boolean {
        return this.amount.gt(other.amount);
    }

    /**
     * Compares the current TokenAmount instance with another TokenAmount instance
     * to determine if it is less than the specified instance.
     *
     * @param {CMTSToken} other - The TokenAmount instance to compare against.
     * @return {boolean} True if the current instance is less than the specified instance, otherwise false.
     */
    isLessThan(other: CMTSToken): boolean {
        return this.amount.lt(other.amount);
    }

    /**
     * Adds the given CMTSToken instance to the current instance and returns a new CMTSToken with the combined value.
     *
     * @param {CMTSToken} other - The CMTSToken instance to add to the current instance.
     * @return {CMTSToken} A new CMTSToken instance representing the sum of the two tokens.
     */
    add(other: CMTSToken): CMTSToken {
        return CMTSToken.createAtomic(this.getAmountAsAtomic() + other.getAmountAsAtomic())
    }

    /**
     * Subtracts the value of the provided CMTSToken from the current CMTSToken and returns a new CMTSToken with the resulting value.
     *
     * @param {CMTSToken} other - The CMTSToken to be subtracted from the current token.
     * @return {CMTSToken} A new CMTSToken object representing the result of the subtraction.
     */
    sub(other: CMTSToken): CMTSToken {
        return CMTSToken.createAtomic(this.getAmountAsAtomic() - other.getAmountAsAtomic())
    }

    /**
     * Converts the object to a string representation combining the amount and its unit label.
     * The returned string typically includes the numerical value and its corresponding unit.
     *
     * @return {string} A string representation of the object in the format "{amount} {unitLabel}".
     */
    toString( unit : TokenUnit = TokenUnit.TOKEN ) {
        switch (unit) {
            case TokenUnit.TOKEN: return `${this.getAmountAsCMTS()} ${CMTSToken.getUnitLabel(unit)}`;
            case TokenUnit.ATOMIC:  return `${this.getAmountAsAtomic()} ${CMTSToken.getUnitLabel(unit)}`;
            default: throw new InvalidTokenUnitError();
        }
    }

    /**
     * Retrieves the label corresponding to the current unit of the token.
     *
     * @return {TokenUnitLabel} The label associated with the unit.
     * @throws {InvalidTokenUnitError} If the unit does not have a defined label.
     */
    private static getUnitLabel(unit: TokenUnit) {
        switch (unit) {
            case TokenUnit.TOKEN: return TokenUnitLabel.TOKEN;
            case TokenUnit.ATOMIC: return TokenUnitLabel.ATOMIC;
            default: throw new InvalidTokenUnitError()
        }
    }
}