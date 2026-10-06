import * as v from 'valibot';
import { JsonObjectSchema } from '../json/Json';
import { AppLedgerProofSchema } from './AppLedgerProof';

const ResolutionProofProofsSchema = v.record(v.string(), AppLedgerProofSchema);
export type ResolutionProofProofs = v.InferOutput<typeof ResolutionProofProofsSchema>;

const ResolutionProofOffchainDataSchema = v.record(v.string(), JsonObjectSchema);
export type ResolutionProofOffchainData = v.InferOutput<typeof ResolutionProofOffchainDataSchema>;

export const ResolutionProofSchema = v.object({
    linkedJson: JsonObjectSchema,
    resolvedJson: JsonObjectSchema,
    offchainData: ResolutionProofOffchainDataSchema,
    proofs: ResolutionProofProofsSchema,
});

export type ResolutionProof = v.InferOutput<typeof ResolutionProofSchema>;
