import * as v from 'valibot';
import {MicroblockHeaderSchema} from "./MicroblockHeader";
import {MicroblockBodySchema} from "./MicroblockBody";

export const MicroblockStructSchema = v.object({
    header: MicroblockHeaderSchema,
    body: MicroblockBodySchema,
})
export type MicroblockStruct = v.InferOutput<typeof MicroblockStructSchema>