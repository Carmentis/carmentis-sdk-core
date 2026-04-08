import {VirtualBlockchain} from "../VirtualBlockchain";
import {Height} from "../../../type/Height";
import {Microblock} from "../../microblock/Microblock";

/**
 * Interface representing a fallback mechanism for handling microblock search failures.
 */
export interface IMicroblockSearchFailureFallback {

    /**
     * Handles the case where the search for a microblock fails due to exceeding the blockchain's height.
     *
     * @param {VirtualBlockchain} vb - The virtual blockchain instance where the microblock search is being conducted.
     * @param {Height} askedHeight - The requested height that exceeds the blockchain's current limits.
     * @return {Promise<Microblock>} A promise that resolves to the found microblock if available.
     */
    onMicroblockSearchFailureForExceedingHeight(vb: VirtualBlockchain, askedHeight: Height): Promise<Microblock>;
}