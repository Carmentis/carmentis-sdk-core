export enum SectionConstraint {
    ANY,
    ZERO,
    ONE,
    AT_MOST_ONE,
    AT_LEAST_ONE,
}

export const ConstraintNameByConstraint: Record<SectionConstraint, string> = {
    [SectionConstraint.ANY]: 'Any',
    [SectionConstraint.ONE]: 'Exactly one',
    [SectionConstraint.ZERO]: 'Exactly zero',
    [SectionConstraint.AT_LEAST_ONE]: 'At least one',
    [SectionConstraint.AT_MOST_ONE]: 'At most one',
}