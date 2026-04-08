import * as v from 'valibot';

export const NetworksFileSchema = v.record(
    v.string(),
    v.object({
        networkName: v.optional(v.string()),
        nodes: v.record(
            v.string(),
            v.object({
                nodeName: v.optional(v.string()),
                hostname: v.string(),
                rpcEndpoint: v.string(),
                p2pEndpoint: v.string(),
                trusted: v.optional(v.boolean(), false),
                nodeId: v.string(),
            })
        ),
    })
);

export type NetworksFile = v.InferOutput<typeof NetworksFileSchema>;
