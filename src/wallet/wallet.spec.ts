import {WalletCrypto} from './WalletCrypto';
import { describe, it, expect } from 'vitest'
import {randomBytes} from 'node:crypto';

/*
jest.mock('crypto', () => ({
    randomBytes: jest.fn(),
}));


describe('Wallet.generateWallet', () => {
    it('should generate a wallet with a random 64-byte seed', () => {
        const mockSeed = new Uint8Array(64).fill(42);
        (randomBytes as jest.Mock).mockReturnValue(mockSeed);
        const wallet = WalletCrypto.generateWallet();
        
        expect(randomBytes).toHaveBeenCalledWith(64);
        expect(wallet).toBeInstanceOf(WalletCrypto);
        expect((wallet as any).walletSeed).toEqual(mockSeed);
    });
});

describe('WalletCrypto', () => {
    it('should correctly encode and parse a WalletCrypto', () => {
        const wallet = WalletCrypto.generateWallet();
        const encodedWallet = wallet.encode();
        const decodedWallet = WalletCrypto.parseFromString(encodedWallet);
        expect(wallet.getSeedAsBytes()).toEqual(decodedWallet.getSeedAsBytes());
    });
});

 */