import * as val from 'valibot';
import {uint8array} from "../../primitives";
import {MAGIC_STRING} from "../../../../constants/chain";


export const MicroblockHeaderSchema = val.object({
    magicString: val.literal(MAGIC_STRING),

    /**
     * The type of the microblock.
     */
    microblockType: val.number(),

    /**
     * The height of the microblock in the virtual blockchain.
     */
    height: val.number(),

    /**
     * Hash of the previous microblock.
     *
     * When the microblock is the first microblock of the virtual blockchain,
     * then it contains some data:
     * - the validity duration (in days) called expirationDay
     * - a virtual blockchain type
     * - a cryptographically strong random used as a nonce.
     */
    previousHash: uint8array(),

    /**
     * Timestamp of the microblock.
     */
    timestamp: val.number(),

    /**
     * The computed gas for this microblock.
     */
    gas: val.number(),

    /**
     * The gas price is used to convert gas to fees by multiplying it with the gas.
     */
    gasPrice: val.number(),

    /**
     * The body hash is the hash of the body of the microblock.
     */
    bodyHash: uint8array(),

    /**
     * Identifier of the account that pays the fees for this microblock.
     */
    feesPayerAccount: uint8array()
})

export type MicroblockHeader = val.InferOutput<typeof MicroblockHeaderSchema>;
