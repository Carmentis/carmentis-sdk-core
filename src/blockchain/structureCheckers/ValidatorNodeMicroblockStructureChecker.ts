import {IMicroblockStructureChecker} from "./IMicroblockStructureChecker";
import {StructureChecker} from "./StructureChecker";
import {Microblock} from "../microblock/Microblock";
import {Logger} from "../../utils/Logger";
import {MicroblockStructureCheckingError} from "../../errors/carmentis-error";
import {SectionType} from "../../type/valibot/blockchain/section/SectionType";
import {SectionConstraint} from "./SectionConstraint";

export class ValidatorNodeMicroblockStructureChecker implements IMicroblockStructureChecker {
    private logger = Logger.getMicroblockStructureCheckerLogger();
    checkMicroblockStructure(microblock: Microblock): boolean {
        try {
            const checker = new StructureChecker(microblock);
            const isApproval =
                !checker.isFirstBlock() &&
                checker.expects(SectionConstraint.AT_MOST_ONE, SectionType.VN_APPROVAL) === 1;
            const isSlashingCancellation =
                !isApproval &&
                !checker.isFirstBlock() &&
                checker.expects(SectionConstraint.AT_MOST_ONE, SectionType.VN_SLASHING_CANCELLATION) === 1;
            if (!isApproval && !isSlashingCancellation) {
                checker.expects(
                    checker.isFirstBlock() ? SectionConstraint.ONE : SectionConstraint.ZERO,
                    SectionType.VN_CREATION
                );
                checker.group(
                    SectionConstraint.AT_LEAST_ONE,
                    [
                        [SectionConstraint.AT_MOST_ONE, SectionType.VN_COMETBFT_PUBLIC_KEY_DECLARATION],
                        [SectionConstraint.AT_MOST_ONE, SectionType.VN_RPC_ENDPOINT],
                        [SectionConstraint.ANY, SectionType.CUSTOM],
                    ]
                );
            }
            checker.expects(SectionConstraint.ANY, SectionType.AUXILIARY_SIGNATURE);
            checker.expects(SectionConstraint.ONE, SectionType.SIGNATURE);
            checker.endsHere();
            return true;
        } catch (e) {
            if (e instanceof Error) {
                if (e instanceof MicroblockStructureCheckingError) {
                    this.logger.error(`Invalid microblock structure: ${e.message}`)
                } else {
                    this.logger.error(`Unexpected error occurred during microblock structure checking: ${e.message} at ${e.stack}`)
                }
            }
            return false;
        }
    }
}