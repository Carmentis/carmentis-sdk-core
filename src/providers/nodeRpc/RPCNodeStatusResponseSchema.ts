import * as v from "valibot";

export const RPCNodeStatusResponseSchema = v.object({
    jsonrpc: v.literal("2.0"),
    id: v.number(),
    result: v.object({
        node_info: v.object({
            protocol_version: v.object({
                p2p: v.string(),
                block: v.string(),
                app: v.string(),
            }),
            id: v.string(),
            listen_addr: v.string(),
            network: v.string(),
            version: v.string(),
            channels: v.string(),
            moniker: v.string(),
            other: v.object({
                tx_index: v.string(),
                rpc_address: v.string(),
            }),
        }),
        sync_info: v.object({
            latest_block_hash: v.string(),
            latest_app_hash: v.string(),
            latest_block_height: v.string(),
            latest_block_time: v.string(),
            earliest_block_hash: v.string(),
            earliest_app_hash: v.string(),
            earliest_block_height: v.string(),
            earliest_block_time: v.string(),
            catching_up: v.boolean(),
        }),
        validator_info: v.object({
            address: v.string(),
            pub_key: v.object({
                type: v.string(), // "tendermint/PubKeyEd25519"
                value: v.string(), // base64
            }),
            voting_power: v.string(),
        }),
    }),
});
export type RPCNodeStatusResponseType = v.InferOutput<typeof RPCNodeStatusResponseSchema>;