import {CMTSToken, TokenUnit} from "../../src/economics/currencies/token";
import {describe, it, expect} from 'vitest';

describe('CMTS tokens formatting', () => {
    it('should format CMTS tokens properly', () => {
        const tokens = CMTSToken.createAtomic(123_456_789_123_456);

        expect(tokens.toString()).toBe("1234567891.23456 CMTS");

        expect(tokens.toString(
            TokenUnit.TOKEN,
            {
                grouping: true,
            }
        )).toBe("1,234,567,891.23456 CMTS");

        expect(tokens.toString(
            TokenUnit.TOKEN,
            {
                grouping: true,
                decimalPlaces: 3,
            }
        )).toBe("1,234,567,891.235 CMTS");

        expect(tokens.toString(
            TokenUnit.TOKEN,
            {
                grouping: true,
                decimalPlaces: 2,
                locale: "fr-FR",
            }
        )).toBe("1 234 567 891,23 CMTS");

        const myLocale = Intl.NumberFormat().resolvedOptions().locale;
        expect(tokens.toString(
            TokenUnit.TOKEN,
            {
                grouping: true,
                decimalPlaces: 3,
                locale: "system",
            }
        )).toBe(tokens.toString(
            TokenUnit.TOKEN,
            {
                grouping: true,
                decimalPlaces: 3,
                locale: myLocale
            }
        ));
    });
});
