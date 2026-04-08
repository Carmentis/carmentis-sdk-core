import * as v from 'valibot';

const PositiveInt = v.pipe(v.number(), v.integer(), v.minValue(1));
type PositiveInt = v.InferOutput<typeof PositiveInt>;

/**
 * Defines the height in a (virtual) blockchain.
 *
 * Both the height of a block in the blockchain and a micro-block in a virtual blockchain is a strictly positive integer
 * starting at 1 for the first block.
 */
export type Height = PositiveInt;