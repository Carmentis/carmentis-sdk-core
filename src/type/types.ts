import {JsonData} from '../records/types';

export interface ImportedProof {
    height: number;
    data: JsonData;
}

export interface MicroblockHeaderObject {
    magicString: string;
    protocolVersion: number;
    microblockType: number;
    height: number;
    previousHash: Uint8Array;
    timestamp: number;
    gas: number;
    gasPrice: number;
    bodyHash: Uint8Array;
    feesPayerAccount: Uint8Array
}

export interface AccountHash {
    accountHash: Uint8Array
}

/**
 * @deprecated Use `AccountHistoryEntry` instead.
 */
export interface AccountTransactionInterface {
    height: number,
    previousHistoryHash: Uint8Array,
    type: number,
    timestamp: number,
    linkedAccount: Uint8Array,
    amount: number,
    chainReference: Uint8Array
}

export interface Proof {
    info: {
        title: string,
        date: string,
        author: string,
        virtualBlockchainIdentifier: string
    }, proofs: {
        height: number,
        data: any
    }[]
}
