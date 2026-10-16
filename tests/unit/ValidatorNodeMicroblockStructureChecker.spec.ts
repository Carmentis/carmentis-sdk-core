import { describe, it, expect } from 'vitest'
import { ValidatorNodeMicroblockStructureChecker } from "../../src/blockchain/structureCheckers/ValidatorNodeMicroblockStructureChecker";
import { SectionType } from "../../src/type/valibot/blockchain/section/SectionType";
import { Microblock } from "../../src/blockchain/microblock/Microblock";

// the checker only relies on the height and on the ordered list of sections
function microblock(height: number, types: SectionType[]): Microblock {
    return {
        getHeight: () => height,
        getAllSections: () => types.map(type => ({ type })),
    } as unknown as Microblock;
}

const { VN_CREATION, VN_COMETBFT_PUBLIC_KEY_DECLARATION: COMETBFT, VN_RPC_ENDPOINT: RPC, SIGNATURE } = SectionType;

describe('ValidatorNodeMicroblockStructureChecker', () => {
    const checker = new ValidatorNodeMicroblockStructureChecker();

    describe('genesis microblock', () => {
        it('accepts one cometbft public key and one RPC endpoint', () => {
            expect(checker.checkMicroblockStructure(microblock(1, [VN_CREATION, COMETBFT, RPC, SIGNATURE]))).toBe(true);
        });

        it('rejects a missing cometbft public key', () => {
            expect(checker.checkMicroblockStructure(microblock(1, [VN_CREATION, RPC, SIGNATURE]))).toBe(false);
        });

        it('rejects a missing RPC endpoint', () => {
            expect(checker.checkMicroblockStructure(microblock(1, [VN_CREATION, COMETBFT, SIGNATURE]))).toBe(false);
        });

        it('rejects a duplicated cometbft public key', () => {
            expect(checker.checkMicroblockStructure(microblock(1, [VN_CREATION, COMETBFT, COMETBFT, RPC, SIGNATURE]))).toBe(false);
        });
    });

    describe('later microblocks', () => {
        it('accepts an RPC endpoint redeclaration', () => {
            expect(checker.checkMicroblockStructure(microblock(2, [RPC, SIGNATURE]))).toBe(true);
        });

        it('rejects a cometbft public key redeclaration', () => {
            expect(checker.checkMicroblockStructure(microblock(2, [COMETBFT, SIGNATURE]))).toBe(false);
        });

        it('rejects a cometbft public key redeclaration alongside an RPC endpoint', () => {
            expect(checker.checkMicroblockStructure(microblock(2, [COMETBFT, RPC, SIGNATURE]))).toBe(false);
        });
    });
});
