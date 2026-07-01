import {MerkleLeaf} from "./MerkleLeaf";
import {Path} from "../type/valibot/proofs/AppLedgerProof";

export type PositionedLeaf = {
    leaf: MerkleLeaf,
    index: number,
    path: Path,
}
