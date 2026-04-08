import {IMicroblockSearchFailureFallback} from "./IMicroblockSearchFailureFallback";
import {VirtualBlockchain} from "../VirtualBlockchain";
import {Height} from "../../../type/Height";
import {Microblock} from "../../microblock/Microblock";
import {MicroBlockNotFoundInVirtualBlockchainAtHeightError} from "../../../errors/carmentis-error";
import {Utils} from "../../../utils/utils";
import {Hash} from "../../../entities/Hash";

export class ThrownErrorMicroblockSearchFailureFallback implements IMicroblockSearchFailureFallback {
    onMicroblockSearchFailureForExceedingHeight(vb: VirtualBlockchain, askedHeight: Height): Promise<Microblock> {
        if (vb.isEmpty()) {
            // no vb id
            throw new MicroBlockNotFoundInVirtualBlockchainAtHeightError(Hash.from(Utils.getNullHash()), askedHeight)
        } else {

            throw new MicroBlockNotFoundInVirtualBlockchainAtHeightError(vb.getIdentifier(), askedHeight)
        }
    }
}