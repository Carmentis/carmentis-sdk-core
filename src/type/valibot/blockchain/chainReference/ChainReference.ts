import * as v from 'valibot';
import { bin256 } from "../../primitives";

export enum ChainReferenceType {
    BLOCK = 0,
    MICROBLOCK = 1,
    SECTION = 2,
};

export const BlockReferenceSchema = v.object({
    type: v.literal(ChainReferenceType.BLOCK),
    height: v.number(),
});
export type BlockReference = v.InferOutput<typeof BlockReferenceSchema>;

export const MicroblockReferenceSchema = v.object({
    type: v.literal(ChainReferenceType.MICROBLOCK),
    microblockHash: bin256(),
});
export type MicroblockReference = v.InferOutput<typeof MicroblockReferenceSchema>;

export const SectionReferenceSchema = v.object({
    type: v.literal(ChainReferenceType.SECTION),
    microblockHash: bin256(),
    sectionIdex: v.number(),
});
export type SectionReference = v.InferOutput<typeof SectionReferenceSchema>;

export const ChainReferenceSchema = v.variant(
    'type',
    [
        BlockReferenceSchema,
        MicroblockReferenceSchema,
        SectionReferenceSchema,
    ],
);
export type ChainReference = v.InferOutput<typeof ChainReferenceSchema>;
