import {Crypto} from "../crypto/crypto";
import {Utils} from "./utils";


import {MicroblockHeader, MicroblockHeaderSchema} from "../type/valibot/blockchain/microblock/MicroblockHeader";
import {MicroblockBody, MicroblockBodySchema} from "../type/valibot/blockchain/microblock/MicroblockBody";
import * as v from 'valibot';
import {
    VirtualBlockchainState,
    VirtualBlockchainStateSchema
} from "../type/valibot/blockchain/virtualBlockchain/virtualBlockchains";
import {Section, SectionSchema} from "../type/valibot/blockchain/section/sections";
import {VirtualBlockchainInfo, VirtualBlockchainInfoSchema} from "../type/valibot/provider/VirtualBlockchainInfo";
import {MicroblockInformation, MicroblockInformationSchema} from "../type/valibot/provider/MicroblockInformationSchema";
import {
    AccountBreakdown,
    AccountBreakdownSchema,
    AccountInformation,
    AccountInformationSchema,
    AccountState,
    AccountStateSchema,
    EscrowLock,
    EscrowLockSchema,
    EscrowParameters,
    EscrowParametersSchema,
    Lock,
    LockSchema,
    NodeStakingLock,
    NodeStakingLockSchema,
    NodeStakingParameters,
    NodeStakingParametersSchema,
    VestingLock,
    VestingLockSchema,
    VestingParameters,
    VestingParametersSchema
} from "../type/valibot/account/Account";
import {Logger} from "./Logger";
import {CryptoEncoderFactory} from "../crypto/encoder/CryptoEncoderFactory";

export class BlockchainUtils {
    private static encoder  = CryptoEncoderFactory.getCryptoBinaryEncoder();
    private static logger = Logger.getLogger(["utils"]);

    static computeMicroblockHashFromHeader(header: MicroblockHeader) {
        const serializedHeader = BlockchainUtils.encodeMicroblockHeader(header);
        return Crypto.Hashes.sha256AsBinary(serializedHeader);
    }

    /**
      Takes a list of consecutive microblock headers in binary format and in anti-chronological order.
      Returns an object with a flag telling if the hash chain is valid and the list of microblock hashes (also in anti-chronological order).
    */
    static checkHeaderList(serializedHeaders: Uint8Array[]) {
        // if the list of headers contains zero or one header, the verification succeed
        const numberOfHeaders = serializedHeaders.length;
        if (numberOfHeaders === 0) return { valid: true, hashes: [] }
        if (numberOfHeaders === 1) return { valid: true, hashes: [Crypto.Hashes.sha256AsBinary(serializedHeaders[0])] }

        // on the other cases (at least two headers), we have to start from the header before the last one, whose
        // the hash must match the previous hash of the last one, etc
        const hashes = [];
        let expectedHash = null;
        const logger = Logger.getProviderLogger();
        for (const header of serializedHeaders.reverse()) {
            const hash = Crypto.Hashes.sha256AsBinary(header);

            if (expectedHash && !Utils.binaryIsEqual(hash, expectedHash)) {
                logger.error(`Received headers mismatch: Expected ${Utils.binaryToHexa(expectedHash)}, got ${Utils.binaryToHexa(hash)}: aborting verification`)
                return {
                    valid: false,
                    hashes: []
                };
            }

            hashes.push(hash);
            expectedHash = BlockchainUtils.previousHashFromHeader(header);
        }

        return {
            valid: true,
            hashes: hashes
        };
    }

    /**
      Extracts the 'previousHash' field from a microblock header in binary format.
    */
    static previousHashFromHeader(serializedHeader: Uint8Array) {
        const header = BlockchainUtils.decodeMicroblockHeader(serializedHeader);
        return header.previousHash;
    }


    static encodeVirtualBlockchainInfo(virtualBlockchainInfo: VirtualBlockchainInfo) {
        return this.encodeObjectToBinary(v.parse(VirtualBlockchainInfoSchema, virtualBlockchainInfo));
    }

    static decodeVirtualBlockchainInfo(serializedInfo: Uint8Array) {
        return v.parse(VirtualBlockchainInfoSchema, this.decodeObjectFromBinary(serializedInfo));
    }

    /**
     *
     * @param vbState
     */
    static encodeVirtualBlockchainState(vbState: VirtualBlockchainState) {
        return this.encodeObjectToBinary(v.parse(VirtualBlockchainStateSchema, vbState));
    }

    /**
     * Decodes a virtual blockchain state object from the given binary data.
     *
     * @param {Uint8Array} serializedVirtualBlockchainState The binary encoded virtual blockchain state data.
     * @return {VirtualBlockchainState} The decoded virtual blockchain state object.
     */
    static decodeVirtualBlockchainState(serializedVirtualBlockchainState: Uint8Array) : VirtualBlockchainState {
        return v.parse(VirtualBlockchainStateSchema, this.decodeObjectFromBinary(serializedVirtualBlockchainState))
    }

    static encodeMicroblockBody(body: MicroblockBody) {
        return this.encodeObjectToBinary(v.parse(MicroblockBodySchema, body));
    }

    static decodeMicroblockBody(serializedBody: Uint8Array) {
        return v.parse(MicroblockBodySchema, this.decodeObjectFromBinary(serializedBody));
    }

    static encodeSection(section: Section) {
        return this.encodeObjectToBinary(v.parse(SectionSchema, section));
    }

    static decodeSection(serializedSection: Uint8Array): Section {
        return v.parse(SectionSchema, this.decodeObjectFromBinary(serializedSection));
    }

    static encodeMicroblockHeader(header: MicroblockHeader) {
        return this.encodeObjectToBinary(v.parse(MicroblockHeaderSchema, header));
    }

    static decodeMicroblockHeader(serializedHeader: Uint8Array) {
        const decoded = this.decodeObjectFromBinary(serializedHeader)
        const result = v.parse(MicroblockHeaderSchema, decoded);
        if (!Utils.binaryIsEqual(decoded.bodyHash!, result.bodyHash)) {
            BlockchainUtils.logger.error(`Modified validated object: ${JSON.stringify(decoded)} vs ${JSON.stringify(result)}`)
            throw new Error(`Modified body hash detected during deserialization: ${decoded.bodyHash} vs ${result.bodyHash}`)
        }
        return result
    }

    static encodeEscrowParameters(escrowParameters: EscrowParameters) {
        return this.encodeObjectToBinary(v.parse(EscrowParametersSchema, escrowParameters));
    }

    static decodeEscrowParameters(serializedEscrowParameters: Uint8Array): EscrowParameters {
        return v.parse(EscrowParametersSchema, this.decodeObjectFromBinary(serializedEscrowParameters));
    }

    static encodeEscrowLock(escrowLock: EscrowLock) {
        return this.encodeObjectToBinary(v.parse(EscrowLockSchema, escrowLock));
    }

    static decodeEscrowLock(serializedEscrowLock: Uint8Array): EscrowLock {
        return v.parse(EscrowLockSchema, this.decodeObjectFromBinary(serializedEscrowLock));
    }

    static encodeVestingParameters(vestingParameters: VestingParameters) {
        return this.encodeObjectToBinary(v.parse(VestingParametersSchema, vestingParameters));
    }

    static decodeVestingParameters(serializedVestingParameters: Uint8Array): VestingParameters {
        return v.parse(VestingParametersSchema, this.decodeObjectFromBinary(serializedVestingParameters));
    }

    static encodeVestingLock(vestingLock: VestingLock) {
        return this.encodeObjectToBinary(v.parse(VestingLockSchema, vestingLock));
    }

    static decodeVestingLock(serializedVestingLock: Uint8Array): VestingLock {
        return v.parse(VestingLockSchema, this.decodeObjectFromBinary(serializedVestingLock));
    }

    static encodeNodeStakingParameters(nodeStakingParameters: NodeStakingParameters) {
        return this.encodeObjectToBinary(v.parse(NodeStakingParametersSchema, nodeStakingParameters));
    }

    static decodeNodeStakingParameters(serializedNodeStakingParameters: Uint8Array): NodeStakingParameters {
        return v.parse(NodeStakingParametersSchema, this.decodeObjectFromBinary(serializedNodeStakingParameters));
    }

    static encodeNodeStakingLock(nodeStakingLock: NodeStakingLock) {
        return this.encodeObjectToBinary(v.parse(NodeStakingLockSchema, nodeStakingLock));
    }

    static decodeNodeStakingLock(serializedNodeStakingLock: Uint8Array): NodeStakingLock {
        return v.parse(NodeStakingLockSchema, this.decodeObjectFromBinary(serializedNodeStakingLock));
    }

    static encodeLock(lock: Lock) {
        return this.encodeObjectToBinary(v.parse(LockSchema, lock));
    }

    static decodeLock(serializedLock: Uint8Array): Lock {
        return v.parse(LockSchema, this.decodeObjectFromBinary(serializedLock));
    }

    static encodeAccountBreakdown(accountBreakdown: AccountBreakdown) {
        return this.encodeObjectToBinary(v.parse(AccountBreakdownSchema, accountBreakdown));
    }

    static decodeAccountBreakdown(serializedAccountBreakdown: Uint8Array): AccountBreakdown {
        return v.parse(AccountBreakdownSchema, this.decodeObjectFromBinary(serializedAccountBreakdown));
    }

    static encodeAccountState(accountState: AccountState) {
        return this.encodeObjectToBinary(v.parse(AccountStateSchema, accountState));
    }

    static decodeAccountState(serializedAccountState: Uint8Array): AccountState {
        return v.parse(AccountStateSchema, this.decodeObjectFromBinary(serializedAccountState));
    }

    static encodeAccountInformation(accountInformation: AccountInformation) {
        return this.encodeObjectToBinary(v.parse(AccountInformationSchema, accountInformation));
    }

    static decodeAccountInformation(serializedAccountInformation: Uint8Array): AccountInformation {
        return v.parse(AccountInformationSchema, this.decodeObjectFromBinary(serializedAccountInformation));
    }

    static encodeMicroblockInformation(microblockInformation: MicroblockInformation) {
        return this.encodeObjectToBinary(v.parse(MicroblockInformationSchema, microblockInformation));
    }

    static decodeMicroblockInformation(serializedMicroblockInformation: Uint8Array): MicroblockInformation {
        return v.parse(MicroblockInformationSchema, this.decodeObjectFromBinary(serializedMicroblockInformation));
    }
    
    private static encodeObjectToBinary(object: any): Uint8Array {
        return BlockchainUtils.encoder.encode(object);
    } 
    
    private static decodeObjectFromBinary(binary: Uint8Array): any {
        return BlockchainUtils.encoder.decode(binary);
    }

}
