import {IMicroblockStructureChecker} from "./IMicroblockStructureChecker";
import {StructureChecker} from "./StructureChecker";
import {Microblock} from "../microblock/Microblock";
import {SectionConstraint} from "./SectionConstraint";
import {SectionType} from "../../type/valibot/blockchain/section/SectionType";
import {MicroblockStructureCheckingError} from "../../errors/carmentis-error";
import {Logger} from "../../utils/Logger";

export class ApplicationLedgerMicroblockStructureChecker implements IMicroblockStructureChecker {
    private logger = Logger.getMicroblockStructureCheckerLogger();

    checkMicroblockStructure(microblock: Microblock): boolean {
        try {
            const checker = new StructureChecker(microblock);
            checker.expects(
                checker.isFirstBlock() ? SectionConstraint.ONE : SectionConstraint.ZERO,
                SectionType.APP_LEDGER_CREATION
            );
            checker.group(
                SectionConstraint.ANY,
                [
                    [SectionConstraint.ANY, SectionType.APP_LEDGER_ACTOR_CREATION],
                    [SectionConstraint.ANY, SectionType.APP_LEDGER_ACTOR_SUBSCRIPTION],
                    [SectionConstraint.ANY, SectionType.APP_LEDGER_ENDORSEMENT_REQUEST],
                    [SectionConstraint.ANY, SectionType.APP_LEDGER_AUTHOR],
                    [SectionConstraint.ANY, SectionType.APP_LEDGER_PUBLIC_CHANNEL_DATA],
                    [SectionConstraint.ANY, SectionType.APP_LEDGER_PRIVATE_CHANNEL_DATA],
                    [SectionConstraint.ANY, SectionType.APP_LEDGER_SHARED_SECRET],
                    [SectionConstraint.ANY, SectionType.APP_LEDGER_CHANNEL_CREATION],
                    [SectionConstraint.ANY, SectionType.APP_LEDGER_CHANNEL_INVITATION],
                    [SectionConstraint.ANY, SectionType.ALLOWED_ADDITIONAL_WRITER],
                ]
            );
            // between one and two (included) signatures
            // TODO(fix): allow more signatures
            checker.expects(SectionConstraint.AT_LEAST_ONE, SectionType.SIGNATURE);
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