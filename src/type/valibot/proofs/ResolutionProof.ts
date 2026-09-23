import * as v from 'valibot';
import { JsonObjectSchema } from '../json/Json';
import { ProofVirtualBlockchainSchema } from './AppLedgerProof';

const ResolutionProofProofsSchema = v.record(v.string(), ProofVirtualBlockchainSchema);
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
