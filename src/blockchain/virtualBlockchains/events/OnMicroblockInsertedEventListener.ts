import {VirtualBlockchain} from "../VirtualBlockchain";
import {Microblock} from "../../microblock/Microblock";

export interface OnMicroblockInsertionEventListener {
    onMicroblockInserted(virtualBlockchain: VirtualBlockchain, microblock: Microblock): void | Promise<void>;
}