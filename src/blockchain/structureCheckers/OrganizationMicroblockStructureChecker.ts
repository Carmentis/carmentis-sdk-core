import {IMicroblockStructureChecker} from "./IMicroblockStructureChecker";
import {StructureChecker} from "./StructureChecker";
import {Microblock} from "../microblock/Microblock";
import {Logger} from "../../utils/Logger";
import {MicroblockStructureCheckingError} from "../../errors/carmentis-error";
import {SectionConstraint} from "./SectionConstraint";
import {SectionType} from "../../type/valibot/blockchain/section/SectionType";

export class OrganizationMicroblockStructureChecker implements IMicroblockStructureChecker {
    private logger = Logger.getMicroblockStructureCheckerLogger()
    checkMicroblockStructure(microblock: Microblock): boolean {
        try {
            const checker = new StructureChecker(microblock);
            checker.expects(
                checker.isFirstBlock() ? SectionConstraint.ONE : SectionConstraint.ZERO,
                SectionType.ORG_CREATION
            );
            checker.group(
                SectionConstraint.AT_MOST_ONE,
                [
                    [SectionConstraint.ONE, SectionType.ORG_DESCRIPTION]
                ]
            );
            checker.expects(SectionConstraint.ONE, SectionType.SIGNATURE);
            checker.endsHere();
            return true;
        } catch (e) {
            if (typeof e === 'string') this.logger.error(`Microblock structure error details: ${e}`)
            if (e instanceof Error) {
                if (e instanceof MicroblockStructureCheckingError) {
                    this.logger.error(`Microblock structure error: ${e.message}`)
                } else {
                    this.logger.error(`An unexpected error occurred during structure checking: ${e.message} at ${e.stack}`)
                }
            }
            return false;
        }
    }

}