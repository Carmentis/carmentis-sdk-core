import * as v from 'valibot';
import {SectionSchema} from "../section/sections";

export const MicroblockBodySchema = v.object({
    sections: v.array(SectionSchema)
})
export type MicroblockBody = v.InferOutput<typeof MicroblockBodySchema>;