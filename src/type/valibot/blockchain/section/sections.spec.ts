import {
    ApplicationCreationSection, OrganizationDescriptionSection,
    OrganizationDescriptionSectionSchema, SignatureSection
} from "./sections";
import {SectionType} from "./SectionType";
import {Utils} from "../../../../utils/utils";
import * as val from 'valibot';

describe("Section encoding and decoding", () => {
    it('Should encode and decode an application creation section',  () => {
        const appCreationSection : ApplicationCreationSection = {
            organizationId: Utils.getNullHash(),
            type: SectionType.APP_CREATION,
        };
    })

    it("Should create a signature section and should be switched with an organization signature", () => {
        const sigSection: SignatureSection = {
            type: SectionType.SIGNATURE,
            signature: Utils.getNullHash(),
            schemeId: 1,
        }
    })

    it("Should validate an organization description section with or without misc", () => {
        const sectWithoutMiscParsing = val.safeParse(OrganizationDescriptionSectionSchema, {
            city: "Paris",
            countryCode: "FR",
            name: "Test",
            website: "https://test.com",
            type: SectionType.ORG_DESCRIPTION
        })

        const sectWithMiscParsing = val.safeParse(OrganizationDescriptionSectionSchema, {
            city: "Paris",
            countryCode: "FR",
            name: "Test",
            website: "https://test.com",
            type: SectionType.ORG_DESCRIPTION,
            misc: {
                "test": "val1",
                "test2": "val2",
            }
        })

        const failedParsing = val.safeParse(OrganizationDescriptionSectionSchema, {
            city: "Paris",
            countryCode: "FR",
            name: "Test",
            website: "https://test.com",
            type: SectionType.ORG_DESCRIPTION,
            misc: {
                "test": "val1",
                "test2": "val2",
                "test4": {
                    "test": "val3"
                }
            }
        })

        expect(sectWithoutMiscParsing.success).toBeTruthy();
        expect(sectWithMiscParsing.success).toBeTruthy();
        expect(failedParsing.success).toBeFalsy();
    })
})