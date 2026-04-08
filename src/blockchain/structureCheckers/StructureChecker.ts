import {Microblock} from "../microblock/Microblock";
import {MicroblockStructureCheckingError} from "../../errors/carmentis-error";
import {ConstraintNameByConstraint, SectionConstraint} from "./SectionConstraint";
import {SectionType} from "../../type/valibot/blockchain/section/SectionType";
import {SectionLabel} from "../../utils/SectionLabel";

/**
 * The StructureChecker class is responsible for validating the structure of a microblock.
 * It enforces constraints and expectations on specific sections within a microblock based on their types.
 * The class includes functionality to navigate sections, verify constraints, and group sections for validation.
 */
export class StructureChecker {
    /**
     * Represents a microblock in a blockchain system.
     */
    private microblock: Microblock;
    /**
     * A numeric variable that stores a memory address or a reference to another variable.
     * This pointer is used to indirectly access the value or object located at the specified memory address.
     *
     * @type {number} The numeric address or reference.
     */
    private pointer: number;

    /**
     * Constructs an instance of the class with the provided Microblock object.
     *
     * @param {Microblock} microblock - The Microblock instance to be associated with this object.
     * @return {void} No return value.
     */
    constructor(microblock: Microblock) {
        this.microblock = microblock;
        this.pointer = 0;
    }

    /**
     * Checks if the current block is the first block in the chain.
     *
     * @return {boolean} Returns true if the block's height is 1, otherwise false.
     */
    isFirstBlock() {
        return this.microblock.getHeight() == 1;
    }

    /**
     * Validates and counts consecutive sections of a specified type in a list against a given constraint.
     *
     * @param constraint The constraint that defines the allowed count of sections.
     * @param type The type of sections to be counted and validated.
     * @return void
     * @throws An error if the count of sections does not meet the specified constraint.
     */
    expects(constraint: SectionConstraint, type: SectionType) {
        let count = 0;

        while (!this.endOfList() && this.currentSection().type == type) {
            count++;
            this.pointer++;
        }

        if (!this.checkConstraint(constraint, count)) {
            throw new MicroblockStructureCheckingError(`expected ${ConstraintNameByConstraint[constraint]} of type ${this.getSectionLabelBySectionType(type)}, got ${count}`);
        }
    }

    /**
     * Groups elements based on the provided group constraint and a list of type constraints.
     *
     * @param groupConstraint The constraint that defines the grouping condition.
     * @param list A list of type constraints, where each element is a tuple containing a constraint and a type.
     * @return void
     * @throws An error if the group constraint or type constraints are not met.
     */
    group(groupConstraint: SectionConstraint, list: [SectionConstraint, SectionType][]) {
        const counts = new Map;
        let groupCount = 0;

        for (const [constraint, type] of list) {
            counts.set(type, 0);
        }

        while (!this.endOfList()) {
            const currentType = this.currentSection().type;

            if (!list.some(([count, type]) => type == currentType)) {
                break;
            }
            counts.set(currentType, counts.get(currentType) + 1);
            groupCount++;
            this.pointer++;
        }

        if (!this.checkConstraint(groupConstraint, groupCount)) {
            throw new MicroblockStructureCheckingError(`expected ${ConstraintNameByConstraint[groupConstraint]} in group, got ${groupCount}`);
        }

        for (const [constraint, type] of list) {
            const count = counts.get(type);

            if (!this.checkConstraint(constraint, count)) {
                throw new MicroblockStructureCheckingError(`expected ${ConstraintNameByConstraint[constraint]} of type ${this.getSectionLabelBySectionType(type)}, got ${count}`);
            }
        }
    }

    /**
     * Validates if the current section is at the end of the list.
     * Throws an error if the current section is not the expected end.
     *
     * @return {void} Does not return a value.
     */
    endsHere(): void {
        if (!this.endOfList()) {
            const currentSection = this.currentSection();
            const currentSectionType = currentSection.type;
            throw new MicroblockStructureCheckingError(`Unexpected section ${this.getSectionLabelBySectionType(currentSectionType)}`);
        }
    }

    /**
     * Retrieves the current section based on the pointer's position.
     *
     * @return {Object} The current section object from the list of all sections.
     */
    currentSection() {
        return this.microblock.getAllSections()[this.pointer];
    }

    /**
     * Determines if the current section is at its end.
     *
     * @return {boolean} Returns true if the current section is null or undefined, indicating the end of the list. Otherwise, returns false.
     */
    endOfList() {
        return !this.currentSection();
    }

    /**
     * Evaluates a given constraint on a specified count and returns whether the constraint is satisfied.
     *
     * @param {number} constraint - The constraint to check. This could be any predefined constant such as SECTIONS.ANY, SECTIONS.ZERO, etc.
     * @param {any} count - The actual count value to assess against the given constraint.
     * @return {boolean} Returns true if the count satisfies the given constraint, otherwise false.
     */
    checkConstraint(constraint: SectionConstraint, count: number) {
        switch (constraint) {
            case SectionConstraint.ANY         : {
                return true;
            }
            case SectionConstraint.ZERO        : {
                return count == 0;
            }
            case SectionConstraint.ONE         : {
                return count == 1;
            }
            case SectionConstraint.AT_LEAST_ONE: {
                return count >= 1;
            }
            case SectionConstraint.AT_MOST_ONE : {
                return count <= 1;
            }
        }
        return false;
    }

    /**
     * Retrieves the label for a given type based on the defined sections of the microblock.
     *
     * @param {number} type - The type for which the label needs to be retrieved.
     * @return {string} The label associated with the given type, or "unknown" if the type is not defined.
     */
    getSectionLabelBySectionType(type: SectionType): string {
        return SectionLabel.getSectionLabelFromSectionType(type)
        /*
        const section = SECTIONS.DEF[this.microblock.getType()][type];
        return section ? section.label : "unknown";

         */
    }
}
