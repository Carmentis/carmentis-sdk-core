import {CarmentisError, EconomicsError} from './carmentis-error';

describe('CarmentisError.isCarmentisError', () => {
    it('should return true for an instance of CarmentisError', () => {
        const error = new CarmentisError('Test error');
        expect(CarmentisError.isCarmentisError(error)).toBe(true);
    });

    it('should return true for an instance of EconomicsError', () => {
        const error = new EconomicsError('Test error');
        expect(CarmentisError.isCarmentisError(error)).toBe(true);
    });

    it('should return false for an instance of a different Error', () => {
        const error = new Error('Test error');
        expect(CarmentisError.isCarmentisError(error)).toBe(false);
    });

    it('should return false for a non-error object', () => {
        const value = {message: 'Test error'};
        expect(CarmentisError.isCarmentisError(value)).toBe(false);
    });

    it('should return false for a null value', () => {
        expect(CarmentisError.isCarmentisError(null)).toBe(false);
    });

    it('should return false for an undefined value', () => {
        expect(CarmentisError.isCarmentisError(undefined)).toBe(false);
    });
});