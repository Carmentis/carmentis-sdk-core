import {IMicroblockStructureChecker} from "./IMicroblockStructureChecker";
import {StructureChecker} from "./StructureChecker";
import {Microblock} from "../microblock/Microblock";
import {SECTIONS} from "../../constants/constants";
import {Logger} from "../../utils/Logger";
import {MicroblockStructureCheckingError} from "../../errors/carmentis-error";
import {SectionConstraint} from "./SectionConstraint";
import {SectionType} from "../../type/valibot/blockchain/section/SectionType";

export class ApplicationMicroblockStructureChecker implements IMicroblockStructureChecker {
    private logger = Logger.getMicroblockStructureCheckerLogger();
    checkMicroblockStructure(microblock: Microblock): boolean {
        try {
            const checker = new StructureChecker(microblock);

            checker.expects(
                checker.isFirstBlock() ? SectionConstraint.ONE : SectionConstraint.ZERO,
                SectionType.APP_CREATION
            );
            checker.group(
                SectionConstraint.AT_LEAST_ONE,
                [
                    [ SectionConstraint.AT_MOST_ONE, SectionType.APP_DESCRIPTION ]
                ]
            );
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