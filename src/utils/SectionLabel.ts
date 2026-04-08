import {SectionType} from "../type/valibot/blockchain/section/SectionType";
import {Section} from "../type/valibot/blockchain/section/sections";

const sectionLabelBySectionType: Record<SectionType, string> = {
    // Generic sections
    [SectionType.SIGNATURE]: 'SIGNATURE',
    [SectionType.ALLOWED_ADDITIONAL_WRITER]: 'ALLOWED_ADDITIONAL_WRITER_CREATION',
    [SectionType.CUSTOM]: 'CUSTOM',

    // Protocol
    [SectionType.PROTOCOL_CREATION]: 'PROTOCOL_CREATION',
    [SectionType.PROTOCOL_UPDATE]: 'PROTOCOL_UPDATE',
    [SectionType.PROTOCOL_VARIABLES]: 'PROTOCOL_VARIABLES',

    // Account
    [SectionType.ACCOUNT_PUBLIC_KEY]: 'ACCOUNT_PUBLIC_KEY',
    [SectionType.ACCOUNT_TOKEN_ISSUANCE]: 'ACCOUNT_TOKEN_ISSUANCE',
    [SectionType.ACCOUNT_CREATION]: 'ACCOUNT_CREATION',
    [SectionType.ACCOUNT_TRANSFER]: 'ACCOUNT_TRANSFER',
    [SectionType.ACCOUNT_VESTING_TRANSFER]: 'ACCOUNT_VESTING_TRANSFER',
    [SectionType.ACCOUNT_ESCROW_TRANSFER]: 'ACCOUNT_ESCROW_TRANSFER',
    [SectionType.ACCOUNT_ESCROW_SETTLEMENT]: 'ACCOUNT_ESCROW_SETTLEMENT',
    [SectionType.ACCOUNT_STAKE]: 'ACCOUNT_STAKE',
    [SectionType.ACCOUNT_UNSTAKE]: 'ACCOUNT_UNSTAKE',

    // Validator node
    [SectionType.VN_CREATION]: 'VN_CREATION',
    [SectionType.VN_COMETBFT_PUBLIC_KEY_DECLARATION]: 'VN_COMETBFT_PUBLIC_KEY_DECLARATION',
    [SectionType.VN_RPC_ENDPOINT]: 'VN_RPC_ENDPOINT',
    [SectionType.VN_APPROVAL]: 'VN_APPROVAL',
    [SectionType.VN_SLASHING_CANCELLATION]: 'VN_SLASHING_CANCELLATION',

    // Organization
    [SectionType.ORG_CREATION]: 'ORG_CREATION',
    [SectionType.ORG_DESCRIPTION]: 'ORG_DESCRIPTION',

    // Application
    [SectionType.APP_CREATION]: 'APP_CREATION',
    [SectionType.APP_DESCRIPTION]: 'APP_DESCRIPTION',

    // Application Ledger
    [SectionType.APP_LEDGER_ALLOWED_SIG_SCHEMES]: 'APP_LEDGER_ALLOWED_SIG_SCHEMES',
    [SectionType.APP_LEDGER_ALLOWED_PKE_SCHEMES]: 'APP_LEDGER_ALLOWED_PKE_SCHEMES',
    [SectionType.APP_LEDGER_CREATION]: 'APP_LEDGER_CREATION',
    [SectionType.APP_LEDGER_ACTOR_CREATION]: 'APP_LEDGER_ACTOR_CREATION',
    [SectionType.APP_LEDGER_CHANNEL_CREATION]: 'APP_LEDGER_CHANNEL_CREATION',
    [SectionType.APP_LEDGER_SHARED_SECRET]: 'APP_LEDGER_SHARED_SECRET',
    [SectionType.APP_LEDGER_CHANNEL_INVITATION]: 'APP_LEDGER_CHANNEL_INVITATION',
    [SectionType.APP_LEDGER_ACTOR_SUBSCRIPTION]: 'APP_LEDGER_ACTOR_SUBSCRIPTION',
    [SectionType.APP_LEDGER_PUBLIC_CHANNEL_DATA]: 'APP_LEDGER_PUBLIC_CHANNEL_DATA',
    [SectionType.APP_LEDGER_PRIVATE_CHANNEL_DATA]: 'APP_LEDGER_PRIVATE_CHANNEL_DATA',
    [SectionType.APP_LEDGER_AUTHOR]: 'APP_LEDGER_AUTHOR',
    [SectionType.APP_LEDGER_ENDORSEMENT_REQUEST]: 'APP_LEDGER_ENDORSEMENT_REQUEST',
};

/**
 * A utility class for determining section labels based on section objects or section types.
 */
export class SectionLabel {
    /**
     * Retrieves the label corresponding to a given section.
     *
     * @param {Section} section - The section object from which the label will be derived.
     * @return {string} The label associated with the given section.
     */
    static getSectionLabelFromSection(section: Section): string {
        return this.getSectionLabelFromSectionType(section.type);
    }

    /**
     * Retrieves the label associated with a given section type.
     *
     * @param {SectionType} sectionType - The type of the section for which the label is required.
     * @return {string} The label corresponding to the specified section type.
     */
    static getSectionLabelFromSectionType(sectionType: SectionType): string {
        return sectionLabelBySectionType[sectionType];
    }
}