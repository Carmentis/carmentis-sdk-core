import * as v from 'valibot';
import {ProtocolVariablesSchema} from "./ProtocolVariables";

export const ProtocolUpdateSchema = v.object({
    protocolVersion: v.number(),
    protocolVersionName: v.string(),
    changeLog: v.string(),
    protocolVariables: ProtocolVariablesSchema,
});
export type ProtocolUpdate = v.InferOutput<typeof ProtocolUpdateSchema>