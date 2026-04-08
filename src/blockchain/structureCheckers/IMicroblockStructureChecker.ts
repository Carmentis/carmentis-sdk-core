import {Microblock} from "../microblock/Microblock";

export interface IMicroblockStructureChecker {
    checkMicroblockStructure(microblock: Microblock): boolean;
}