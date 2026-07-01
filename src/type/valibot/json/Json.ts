import * as v from 'valibot';

export type JsonData =
    | string
    | number
    | boolean
    | null
    | JsonData[]
    | { [key: string]: JsonData };

export const JsonSchema: v.GenericSchema<JsonData> = v.lazy(() =>
    v.union([
        v.string(),
        v.number(),
        v.boolean(),
        v.null(),
        v.array(JsonSchema),
        v.record(v.string(), JsonSchema),
    ])
);

export type Json = v.InferOutput<typeof JsonSchema>;
