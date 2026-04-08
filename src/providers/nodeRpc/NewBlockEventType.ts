import * as v from "valibot";

export const NewBlockEventSchema = v.object({
    jsonrpc: v.literal("2.0"),
    id: v.number(),
    result: v.object({
        query: v.string(),
        data: v.object({
            type: v.literal("tendermint/event/NewBlock"),
            value: v.object({
                block: v.object({
                    header: v.object({
                        version: v.object({
                            block: v.string(),
                            app: v.optional(v.string()),
                        }),
                        chain_id: v.string(),
                        height: v.string(),
                        time: v.string(),
                        last_block_id: v.object({
                            hash: v.string(),
                            parts: v.object({
                                total: v.number(),
                                hash: v.string(),
                            }),
                        }),
                        last_commit_hash: v.string(),
                        data_hash: v.string(),
                        validators_hash: v.string(),
                        next_validators_hash: v.string(),
                        consensus_hash: v.string(),
                        app_hash: v.string(),
                        last_results_hash: v.string(),
                        evidence_hash: v.string(),
                        proposer_address: v.string(),
                    }),
                    data: v.object({
                        txs: v.array(v.string()),
                    }),
                    evidence: v.object({
                        evidence: v.array(v.any()),
                    }),
                    last_commit: v.object({
                        height: v.string(),
                        round: v.number(),
                        block_id: v.object({
                            hash: v.string(),
                            parts: v.object({
                                total: v.number(),
                                hash: v.string(),
                            }),
                        }),
                        signatures: v.array(
                            v.object({
                                block_id_flag: v.number(),
                                validator_address: v.string(),
                                timestamp: v.string(),
                                signature: v.string(),
                            })
                        ),
                    }),
                }),
                block_id: v.object({
                    hash: v.string(),
                    parts: v.object({
                        total: v.number(),
                        hash: v.string(),
                    }),
                }),
                result_finalize_block: v.object({
                    validator_updates: v.optional(v.union([v.null(), v.any()])),
                    app_hash: v.string(),
                }),
            }),
        }),
        events: v.object({
            "tm.event": v.array(v.string()),
        }),
    }),
});

export type NewBlockEventType = v.InferOutput<typeof NewBlockEventSchema>;