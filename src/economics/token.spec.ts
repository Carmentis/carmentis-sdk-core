import {CMTSToken, TokenUnit, TokenUnitLabel} from './currencies/token';
import {EconomicsError, InvalidTokenUnitError} from '../errors/carmentis-error';
import Decimal from "decimal.js";
import { describe, it, expect } from 'vitest'


describe('CMTSToken', () => {
    describe('CMTSToken.parse', () => {
        it('should correctly parse a valid token amount string with unit', () => {
            const result = CMTSToken.parse('123.45 CMTS');
            expect(result.toString()).toBe('123.45 CMTS');
        });

        it('should correctly parse a valid token amount string with trailing spaces', () => {
            const result = CMTSToken.parse('  123.45 CMTS  ');
            expect(result.toString()).toBe('123.45 CMTS');
        });

        it('should reject an invalid atomic amount', () => {
            expect(() => CMTSToken.parse('  123.45 aCMTS  ')).toThrow(EconomicsError);
        });

        it('should reject with a too precise atomic', () => {
            expect(() => CMTSToken.parse('  123.123456789 CMTS  ')).toThrow(EconomicsError);
        });

        it('should accept decimal token', () => {
            expect(CMTSToken.parse('  123.12345 CMTS  ')).toBeInstanceOf(CMTSToken)
        });

        it('should correctly parse a valid token amount string with trailing spaces', () => {
            const result = CMTSToken.parse('  123.45 CMTS  ');
            expect(result.toString()).toBe('123.45 CMTS');
        });

        it('should throw an error for an invalid token amount format', () => {
            expect(() => CMTSToken.parse('123.456 TOKEN')).toThrow(EconomicsError);
        });

        it('should throw an error for a string without unit', () => {
            expect(() => CMTSToken.parse('123.45')).toThrow(EconomicsError);
        });

        it('should throw an error for an invalid unit format', () => {
            expect(() => CMTSToken.parse('123.45 TOKENS')).toThrow(EconomicsError);
        });

        it('should throw an error for a completely invalid format', () => {
            expect(() => CMTSToken.parse('invalid string')).toThrow(EconomicsError);
        });

        describe('All TokenUnitLabel parsing', () => {
            it('should parse CMTS (TOKEN) unit correctly', () => {
                const result = CMTSToken.parse('100 CMTS');
                expect(result.getAmountAsCMTS()).toBe(100);
                expect(result.getAmountAsAtomic()).toBe(10_000_000);
            });

            it('should parse dCMTS (DECI_TOKEN) unit correctly', () => {
                const result = CMTSToken.parse('100 dCMTS');
                expect(result.getAmountAsAtomic()).toBe(1_000_000);
                expect(result.getAmountAsCMTS()).toBe(10);
            });

            it('should parse cCMTS (CENTI_TOKEN) unit correctly', () => {
                const result = CMTSToken.parse('100 cCMTS');
                expect(result.getAmountAsAtomic()).toBe(100_000);
                expect(result.getAmountAsCMTS()).toBe(1);
            });

            it('should parse mCMTS (MILLI_TOKEN) unit correctly', () => {
                const result = CMTSToken.parse('100 mCMTS');
                expect(result.getAmountAsAtomic()).toBe(10_000);
                expect(result.getAmountAsCMTS()).toBe(0.1);
            });

            it('should parse μCMTS (MICRO_TOKEN) unit correctly', () => {
                const result = CMTSToken.parse('100 μCMTS');
                expect(result.getAmountAsAtomic()).toBe(1_000);
                expect(result.getAmountAsCMTS()).toBe(0.01);
            });

            it('should parse aCMTS (ATOMIC) unit correctly', () => {
                const result = CMTSToken.parse('100 aCMTS');
                expect(result.getAmountAsAtomic()).toBe(100);
                expect(result.getAmountAsCMTS()).toBe(0.001);
            });

            it('should parse decimal amounts for CMTS', () => {
                const result = CMTSToken.parse('123.45 CMTS');
                expect(result.getAmountAsCMTS()).toBe(123.45);
                expect(result.getAmountAsAtomic()).toBe(12_345_000);
            });

            it('should parse decimal amounts for dCMTS', () => {
                const result = CMTSToken.parse('12.5 dCMTS');
                expect(result.getAmountAsAtomic()).toBe(125_000);
                expect(result.getAmountAsCMTS()).toBe(1.25);
            });

            it('should parse decimal amounts for cCMTS', () => {
                const result = CMTSToken.parse('50.5 cCMTS');
                expect(result.getAmountAsAtomic()).toBe(50_500);
                expect(result.getAmountAsCMTS()).toBe(0.505);
            });

            it('should parse decimal amounts for mCMTS', () => {
                const result = CMTSToken.parse('25.25 mCMTS');
                expect(result.getAmountAsAtomic()).toBe(2_525);
                expect(result.getAmountAsCMTS()).toBe(0.02525);
            });

            it('should parse decimal amounts for μCMTS', () => {
                const result = CMTSToken.parse('10.5 μCMTS');
                expect(result.getAmountAsAtomic()).toBe(105);
                expect(result.getAmountAsCMTS()).toBe(0.00105);
            });

            it('should reject decimal amounts for aCMTS (atomic must be integer)', () => {
                expect(() => CMTSToken.parse('10.5 aCMTS')).toThrow(EconomicsError);
            });

            it('should handle zero values for all units', () => {
                expect(CMTSToken.parse('0 CMTS').getAmountAsAtomic()).toBe(0);
                expect(CMTSToken.parse('0 dCMTS').getAmountAsAtomic()).toBe(0);
                expect(CMTSToken.parse('0 cCMTS').getAmountAsAtomic()).toBe(0);
                expect(CMTSToken.parse('0 mCMTS').getAmountAsAtomic()).toBe(0);
                expect(CMTSToken.parse('0 μCMTS').getAmountAsAtomic()).toBe(0);
                expect(CMTSToken.parse('0 aCMTS').getAmountAsAtomic()).toBe(0);
            });

            it('should throw InvalidTokenUnitError for unknown units', () => {
                expect(() => CMTSToken.parse('100 UNKNOWN')).toThrow(InvalidTokenUnitError);
                expect(() => CMTSToken.parse('100 TOKEN')).toThrow(InvalidTokenUnitError);
                expect(() => CMTSToken.parse('100 XYZ')).toThrow(InvalidTokenUnitError);
            });

            it('should handle whitespace variations', () => {
                expect(CMTSToken.parse('  100  CMTS  ').getAmountAsCMTS()).toBe(100);
                expect(CMTSToken.parse('100 dCMTS').getAmountAsCMTS()).toBe(10);
                expect(CMTSToken.parse('100  μCMTS').getAmountAsAtomic()).toBe(1_000);
            });

            it("should handle no-space-separated amount", () => {
                expect(CMTSToken.parse("100CMTS").getAmountAsCMTS()).toBe(100);
            })
        });

        describe('Fuzzing tests', () => {
            const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
            const randomFloat = (min: number, max: number, decimals: number) =>
                parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

            it('should handle random valid CMTS amounts', () => {
                for (let i = 0; i < 50; i++) {
                    const amount = randomFloat(0.00001, 1_000_000, 5);
                    const result = CMTSToken.parse(`${amount} CMTS`);
                    expect(result.getAmountAsCMTS()).toBeCloseTo(amount, 5);
                }
            });


            it('should handle random valid dCMTS amounts', () => {
                for (let i = 0; i < 50; i++) {
                    const amount = randomFloat(0.0001, 10_000_000, 4);
                    const result = CMTSToken.parse(`${amount} dCMTS`);
                    const expectedAtomic = Math.round(amount * TokenUnit.DECI_TOKEN);
                    expect(result.getAmountAsAtomic()).toBe(expectedAtomic);
                }
            });

            it('should handle random valid cCMTS amounts', () => {
                for (let i = 0; i < 50; i++) {
                    const amount = randomFloat(0.001, 100_000_000, 3);
                    const result = CMTSToken.parse(`${amount} cCMTS`);
                    const expectedAtomic = Math.round(amount * TokenUnit.CENTI_TOKEN);
                    expect(result.getAmountAsAtomic()).toBe(expectedAtomic);
                }
            });

            it('should handle random valid mCMTS amounts', () => {
                for (let i = 0; i < 50; i++) {
                    const amount = randomFloat(0.01, 1_000_000_000, 2);
                    const result = CMTSToken.parse(`${amount} mCMTS`);
                    const expectedAtomic = Math.round(amount * TokenUnit.MILLI_TOKEN);
                    expect(result.getAmountAsAtomic()).toBe(expectedAtomic);
                }
            });

            it('should handle random valid μCMTS amounts', () => {
                for (let i = 0; i < 50; i++) {
                    const amount = randomFloat(0.1, 10_000_000_000, 1);
                    const result = CMTSToken.parse(`${amount} μCMTS`);
                    const expectedAtomic = Math.round(amount * TokenUnit.MICRO_TOKEN);
                    expect(result.getAmountAsAtomic()).toBe(expectedAtomic);
                }
            });

            it('should handle random valid integer aCMTS amounts', () => {
                for (let i = 0; i < 50; i++) {
                    const amount = randomInt(0, 1_000_000_000_000);
                    const result = CMTSToken.parse(`${amount} aCMTS`);
                    expect(result.getAmountAsAtomic()).toBe(amount);
                }
            });

            it('should reject random decimal aCMTS amounts', () => {
                for (let i = 0; i < 200; i++) {
                    const amount = randomFloat(0.1, 10_000, 2);
                    if (Number.isInteger(amount)) continue;
                    expect(() => CMTSToken.parse(`${amount} aCMTS`)).toThrow(EconomicsError);
                }
            });

            it('should handle edge case: very large numbers', () => {
                const largeAmount = 999_999_999.99999;
                const result = CMTSToken.parse(`${largeAmount} CMTS`);
                expect(result.getAmountAsCMTS()).toBeCloseTo(largeAmount, 5);
            });

            it('should handle edge case: very small numbers', () => {
                const smallAmount = 0.00001;
                const result = CMTSToken.parse(`${smallAmount} CMTS`);
                expect(result.getAmountAsCMTS()).toBeCloseTo(smallAmount, 5);
            });

            it('should handle conversions between units consistently', () => {
                for (let i = 0; i < 30; i++) {
                    const cmtsAmount: Decimal = Decimal(randomFloat(1, 1_000, 5));
                    const dCmts = cmtsAmount.mul(10);
                    const cCmts = cmtsAmount.mul(100);
                    const mCmts = cmtsAmount.mul(1_000);
                    const muCmts = cmtsAmount.mul(10_000);

                    const token1 = CMTSToken.parse(`${cmtsAmount} CMTS`);
                    const token2 = CMTSToken.parse(`${dCmts} dCMTS`);
                    const token3 = CMTSToken.parse(`${cCmts} cCMTS`);
                    const token4 = CMTSToken.parse(`${mCmts} mCMTS`);
                    const token5 = CMTSToken.parse(`${muCmts} μCMTS`);

                    expect(token1.getAmountAsAtomic()).toBeCloseTo(token2.getAmountAsAtomic(), 0);
                    expect(token2.getAmountAsAtomic()).toBeCloseTo(token3.getAmountAsAtomic(), 0);
                    expect(token3.getAmountAsAtomic()).toBeCloseTo(token4.getAmountAsAtomic(), 0);
                    expect(token4.getAmountAsAtomic()).toBeCloseTo(token5.getAmountAsAtomic(), 0);
                }
            });

            it('should reject random invalid formats', () => {
                const invalidFormats = [
                    'CMTS 100',
                    'abc CMTS',
                    '100 CM TS',
                    '100,000 CMTS',
                    '- CMTS',
                    'CMTS',
                    '  ',
                    '100',
                    '100 ',
                ];

                invalidFormats.forEach(format => {
                    expect(() => CMTSToken.parse(format)).toThrow(EconomicsError);
                });
            });
        });
    });

    describe('CMTSToken.create', () => {
        it('should create a valid CMTSToken instance', () => {
            const result = CMTSToken.create(123.45, TokenUnit.TOKEN);
            expect(result.toString()).toBe('123.45 CMTS');
        });

    });

    describe('equals', () => {
        it('should return true for equal token amounts', () => {
            const a = CMTSToken.create(123.45, TokenUnit.TOKEN);
            const b = CMTSToken.create(123.45, TokenUnit.TOKEN);
            expect(a.equals(b)).toBe(true);
        });

        it('should return false for different token amounts', () => {
            const a = CMTSToken.create(123.45, TokenUnit.TOKEN);
            const b = CMTSToken.create(100, TokenUnit.TOKEN);
            expect(a.equals(b)).toBe(false);
        });
    });

    describe('isGreaterThan and isLessThan', () => {
        const a = CMTSToken.create(123.45, TokenUnit.TOKEN);
        const b = CMTSToken.create(100, TokenUnit.TOKEN);

        it('should return true if a is greater than b', () => {
            expect(a.isGreaterThan(b)).toBe(true);
        });

        it('should return true if a is less than b', () => {
            expect(b.isLessThan(a)).toBe(true);
        });
    });

    describe('toString', () => {
        it('should return the correct string representation', () => {
            const result = CMTSToken.create(123.45, TokenUnit.TOKEN);
            expect(result.toString()).toBe('123.45 CMTS');
        });
    });

    describe("Add and sub correctly", () =>  {
        it("Should add two amounts correctly", () => {
            const a = CMTSToken.createCMTS(10);
            const b = CMTSToken.createCMTS(90);
            const c = CMTSToken.createCMTS(100);
            expect(a.add(b)).toEqual(c)
        })

        it("Should sub two amounts correctly", () => {
            const a = CMTSToken.createCMTS(100);
            const b = CMTSToken.createCMTS(10);
            const c = CMTSToken.createCMTS(90);
            expect(a.sub(b)).toEqual(c)
        })
    })
});