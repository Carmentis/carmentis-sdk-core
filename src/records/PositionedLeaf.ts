import {MerkleLeaf} from "./MerkleLeaf";
import {Path} from "./types";

export type PositionedLeaf = {
    leaf: MerkleLeaf,
    index: number,
    path: Path,
}
