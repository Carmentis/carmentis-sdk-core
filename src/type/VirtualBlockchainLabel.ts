import {SectionType} from "./valibot/blockchain/section/SectionType";
import {VirtualBlockchainType} from "./VirtualBlockchainType";
import {Section} from "./valibot/blockchain/section/sections";

const virtualBlockchainLabelByVirtualBlockchainType: Record<VirtualBlockchainType, string> = {
    [VirtualBlockchainType.PROTOCOL_VIRTUAL_BLOCKCHAIN]: 'PROTOCOL_VIRTUAL_BLOCKCHAIN',
    [VirtualBlockchainType.NODE_VIRTUAL_BLOCKCHAIN]: 'NODE_VIRTUAL_BLOCKCHAIN',
    [VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN]: 'APPLICATION_VIRTUAL_BLOCKCHAIN',
    [VirtualBlockchainType.ORGANIZATION_VIRTUAL_BLOCKCHAIN]: 'ORGANIZATION_VIRTUAL_BLOCKCHAIN',
    [VirtualBlockchainType.APP_LEDGER_VIRTUAL_BLOCKCHAIN]: 'APP_LEDGER_VIRTUAL_BLOCKCHAIN',
    [VirtualBlockchainType.ACCOUNT_VIRTUAL_BLOCKCHAIN]: 'ACCOUNT_VIRTUAL_BLOCKCHAIN'
}

export class VirtualBlockchainLabel {
    static getVirtualBlockchainLabelFromVirtualBlockchainType(type: VirtualBlockchainType): string {
        return virtualBlockchainLabelByVirtualBlockchainType[type]
    }
}