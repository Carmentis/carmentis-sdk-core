// currency-converter.spec.ts
import {EurosToCMTSConverter} from './currency-converter';
import {Euros} from "./euros";
import {CMTSToken} from "./token";

describe('EurosToCMTSConverter', () => {
    let converter: EurosToCMTSConverter;

    beforeEach(() => {
        converter = new EurosToCMTSConverter();
    });

    describe('convert(from: Euros): CMTSToken', () => {
        it('should convert Euros to CMTS Tokens using the fixed conversion rate', () => {
            const euros = Euros.create(10);
            const tokens = converter.convert(euros);
            expect(tokens.getAmount()).toBe(1000);
        });

        it('should return 0 CMTS Tokens when converting 0 Euros', () => {
            const euros = Euros.create(0);
            const tokens = converter.convert(euros);
            expect(tokens.getAmount()).toBe(0);
        });

        it('should handle fractional Euro amounts correctly', () => {
            const euros = Euros.create(12.5);
            const tokens = converter.convert(euros);
            expect(tokens.getAmount()).toBe(1250);
        });
    });

    describe('invert(to: CMTSToken): Euros', () => {
        it('should convert CMTS Tokens to Euros using the fixed conversion rate', () => {
            const tokens = CMTSToken.create(200);
            const euros = converter.invert(tokens);
            expect(euros.getAmount()).toBe(2);
        });

        it('should return 0 Euros when converting 0 CMTS Tokens', () => {
            const tokens = CMTSToken.create(0);
            const euros = converter.invert(tokens);
            expect(euros.getAmount()).toBe(0);
        });

        it('should handle fractional CMTS Token amounts correctly', () => {
            const tokens = CMTSToken.create(750);
            const euros = converter.invert(tokens);
            expect(euros.getAmount()).toBe(7.5);
        });
    });
});