import * as v from 'valibot'
import {SignatureObjectSchema} from "../JsonSignatureSchemas";

export const SignatureTagSchema = SignatureObjectSchema

export type SignatureTag = v.InferOutput<typeof SignatureTagSchema>
