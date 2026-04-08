import {IMicroblockStructureChecker} from "./IMicroblockStructureChecker";
import {StructureChecker} from "./StructureChecker";
import {Microblock} from "../microblock/Microblock";
import {SECTIONS} from "../../constants/constants";
import {SectionConstraint} from "./SectionConstraint";
import {SectionType} from "../../type/valibot/blockchain/section/SectionType";
import {MicroblockStructureCheckingError} from "../../errors/carmentis-error";
import {Logger} from "../../utils/Logger";

export class AccountMicroblockStructureChecker implements IMicroblockStructureChecker {
    private logger = Logger.getMicroblockStructureCheckerLogger();
    checkMicroblockStructure(microblock: Microblock): boolean {
        try {
            const checker = new StructureChecker(microblock);
            checker.expects(
                checker.isFirstBlock() ? SectionConstraint.ONE : SectionConstraint.AT_MOST_ONE,
                SectionType.ACCOUNT_PUBLIC_KEY
            );
            if (checker.isFirstBlock()) {
                checker.group(
                    SectionConstraint.ONE,
                    [
                        [ SectionConstraint.AT_MOST_ONE, SectionType.ACCOUNT_TOKEN_ISSUANCE ],
                        [ SectionConstraint.AT_MOST_ONE, SectionType.ACCOUNT_CREATION ]
                    ]
                )
            } else {
                checker.group(
                    SectionConstraint.AT_LEAST_ONE,
                    [
                        [ SectionConstraint.ANY, SectionType.ACCOUNT_TRANSFER ],
                        [ SectionConstraint.ANY, SectionType.ACCOUNT_VESTING_TRANSFER ],
                        [ SectionConstraint.ANY, SectionType.ACCOUNT_STAKE ],
                        [ SectionConstraint.ANY, SectionType.ACCOUNT_UNSTAKE ],
                        [ SectionConstraint.ANY, SECTIONS.ACCOUNT_ESCROW_TRANSFER ],
                        [ SectionConstraint.ANY, SectionType.ACCOUNT_ESCROW_SETTLEMENT ]
                    ]
                );
            }
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