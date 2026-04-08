import {Euros} from "./euros";
import {CMTSToken} from "./token";

/**
 * Represents a generic interface for converting currency values from one type to another.
 *
 * @template FromCurrency - The source currency type.
 * @template ToCurrency - The target currency type.
 */
export interface CurrencyConverter<FromCurrency, ToCurrency> {
    /**
     * Converts an amount from one currency to another.
     *
     * @param {FromCurrency} from - The source currency object containing the amount and currency type to be converted.
     * @return {ToCurrency} The target currency object representing the converted amount and currency type.
     */
    convert(from: FromCurrency): ToCurrency;
    /**
     * Inverts the given currency exchange rate by converting from the target currency back to the original currency.
     *
     * @param {ToCurrency} to - The target currency to be inverted.
     * @return {FromCurrency} The original currency derived from the inversion process.
     */
    invert(to: ToCurrency): FromCurrency;
}

/**
 * A factory class for creating currency converter instances.
 */
export class CurrencyConverterFactory {
    static defaultEurosToCMTSTokenConverter(): CurrencyConverter<Euros, CMTSToken> {
        return new EurosToCMTSConverter();
    }
}

/**
 * A converter class that facilitates the conversion between Euros and CMTS Tokens.
 * Implements the `CurrencyConverter` interface to provide methods for converting
 * from Euros to CMTS Tokens and vice versa.
 *
 * It uses a static conversion rate `TOKENS_FOR_ONE_EUROS` to determine the equivalent amount
 * of CMTS Tokens for a given amount of Euros and inversely the equivalent amount
 * of Euros for a given amount of CMTS Tokens.
 *
 * Methods:
 * - `convert(from: Euros): CMTSToken`: Accepts an amount in Euros and converts it to CMTS Tokens.
 * - `invert(to: CMTSToken): Euros`: Converts an amount in CMTS Tokens back to Euros.
 *
 * This class ensures the consistency of conversions through the use of a fixed conversion rate.
 */
export class EurosToCMTSConverter implements CurrencyConverter<Euros, CMTSToken>{
    private static TOKENS_FOR_ONE_EUROS = 100;

    convert(from: Euros): CMTSToken {
        return CMTSToken.create( from.getAmount() * EurosToCMTSConverter.TOKENS_FOR_ONE_EUROS );
    }

    invert(to: CMTSToken): Euros {
        return Euros.create( to.getAmount() / EurosToCMTSConverter.TOKENS_FOR_ONE_EUROS );
    }
}