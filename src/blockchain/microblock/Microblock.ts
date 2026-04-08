import {CHAIN} from "../../constants/constants";
import {Utils} from "../../utils/utils";
import {Crypto} from "../../crypto/crypto";
import {Hash} from "../../entities/Hash";
import {
    CarmentisError,
    IllegalParameterError,
    IllegalStateError,
    SectionNotFoundError
} from "../../errors/carmentis-error";
import {SectionType} from "../../type/valibot/blockchain/section/SectionType";
import {PrivateSignatureKey} from "../../crypto/signature/PrivateSignatureKey";
import {Section, SignatureSection} from "../../type/valibot/blockchain/section/sections";
import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {CMTSToken} from "../../economics/currencies/token";
import {EncoderFactory} from "../../utils/encoder";
import {TimestampValidationResult} from "./TimestampValidationResult";
import {PublicSignatureKey} from "../../crypto/signature/PublicSignatureKey";
import {Logger} from "../../utils/Logger";
import {MicroblockHeader} from "../../type/valibot/blockchain/microblock/MicroblockHeader";
import {BlockchainUtils} from "../../utils/BlockchainUtils";
import {MicroblockBody} from "../../type/valibot/blockchain/microblock/MicroblockBody";
import * as v from 'valibot';
import {decode, encode} from 'cbor-x';
import {MicroblockStruct, MicroblockStructSchema} from "../../type/valibot/blockchain/microblock/MicroblockStruct";
import {SectionLabel} from "../../utils/SectionLabel";

/**
 * Represents a microblock in the blockchain that contains sections of data.
 * Handles creation, modification, serialization and verification of microblock data.
 */
export class Microblock {

    // ------------------------------------------
    // Static methods
    // ------------------------------------------
    /**
     * Creates a genesis microblock with specified type and expiration.
     * @param {number} mbType - The type of microblock to create
     * @param {number} expirationDay - The expiration day value
     * @returns {Microblock} A new genesis microblock instance
     * @deprecated Use a more specific microblock genesis creation method.
     */
    static createGenesisMicroblock(mbType: number, expirationDay: number = 0) {
        const mb = new Microblock(mbType);
        mb.create(1, null, expirationDay );
        return mb;
    }

    /**
     * Creates a new microblock with specified parameters.
     * @param {number} mbType - The type of microblock to create
     * @param {number} height - The height of the microblock in the chain
     * @param {Uint8Array} previousHash - The hash of the previous microblock
     * @param {number} expirationDay - The expiration day value
     * @returns {Microblock} A new microblock instance
     */
    static createMicroblock(mbType: number, height: number, previousHash: Uint8Array, expirationDay: number) {
        const mb = new Microblock(mbType);
        mb.create(height, previousHash, expirationDay );
        return mb;
    }

    /**
     * Creates a genesis microblock for account virtual blockchain.
     * @returns {Microblock} A new genesis microblock instance
     */
    static createGenesisAccountMicroblock(): Microblock {
        return new Microblock(VirtualBlockchainType.ACCOUNT_VIRTUAL_BLOCKCHAIN)
    };

    /**
     * Creates a genesis microblock for validator node virtual blockchain.
     * @returns {Microblock} A new genesis microblock instance
     */
    static createGenesisValidatorNodeMicroblock(): Microblock {
        return new Microblock(VirtualBlockchainType.NODE_VIRTUAL_BLOCKCHAIN)
    };

    /**
     * Creates a genesis microblock for application virtual blockchain.
     * @returns {Microblock} A new genesis microblock instance
     */
    static createGenesisApplicationMicroblock(): Microblock {
        return new Microblock(VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN)
    };

    /**
     * Creates a genesis microblock for protocol virtual blockchain.
     * @returns {Microblock} A new genesis microblock instance
     */
    static createGenesisProtocolMicroblock(): Microblock {
        return new Microblock(VirtualBlockchainType.PROTOCOL_VIRTUAL_BLOCKCHAIN)
    };

    /**
     * Creates a genesis microblock for organization virtual blockchain.
     * @returns {Microblock} A new genesis microblock instance
     */
    static createGenesisOrganizationMicroblock(): Microblock {
        return new Microblock(VirtualBlockchainType.ORGANIZATION_VIRTUAL_BLOCKCHAIN)
    };

    /**
     * Creates a genesis microblock for application ledger virtual blockchain.
     * @returns {Microblock} A new genesis microblock instance
     */
    static createGenesisApplicationLedgerMicroblock(): Microblock {
        return new Microblock(VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN)
    };

    static loadFromSerializedMicroblock(serializedMicroblock: Uint8Array, expectedMbType?: VirtualBlockchainType) {
        const mbStruct = v.parse(MicroblockStructSchema, decode(serializedMicroblock));
        return Microblock.loadFromHeaderAndBody(mbStruct.header, mbStruct.body, expectedMbType)
    }

    static loadFromHeaderAndBody(header: MicroblockHeader, body: MicroblockBody, expectedMbType?: VirtualBlockchainType): Microblock {
        // Validate that expected type matches if provided
        const microblockType = header.microblockType;
        if (expectedMbType !== undefined && expectedMbType !== microblockType) {
            throw new CarmentisError(
                `Microblock type mismatch: expected ${expectedMbType}, got ${microblockType} from header`
            );
        }

        // Validate basic header fields
        if (header.magicString != CHAIN.MAGIC_STRING) {
            throw new Error(`magic string '${CHAIN.MAGIC_STRING}' is missing`);
        }

        // we pin the body hash
        const bodyHashContainedInHeader = header.bodyHash;

        const mb = new Microblock(microblockType);
        mb.header = structuredClone(header);
        mb.addSections(body.sections);

        // we check that the hash of the body is consistent with the body hash contained in the header
        const computedBodyHash = mb.computeBodyHash();
        const areBodyHashMatching = Utils.binaryIsEqual(bodyHashContainedInHeader, computedBodyHash)
        if (!areBodyHashMatching) {
            const encoder = EncoderFactory.bytesToHexEncoder();
            throw new CarmentisError(
                `Body hash in the header is different of the locally computed body hash: header.bodyHash=${encoder.encode(bodyHashContainedInHeader)}, computed=${encoder.encode(computedBodyHash)}`
            );
        }

        // we compute the hash of the microblock being the hash of the serialized header and assign the gas price
        mb.setMicroblockHash(mb.computeHash());

        return mb;
    }

    static loadFromSerializedHeaderAndBody(serializedHeader: Uint8Array, serializedBody: Uint8Array, expectedMbType?: VirtualBlockchainType): Microblock {
        const header = BlockchainUtils.decodeMicroblockHeader(serializedHeader);
        const body = BlockchainUtils.decodeMicroblockBody(serializedBody);
        return Microblock.loadFromHeaderAndBody(header, body, expectedMbType);
    }

    /**
     * Computes the initial hash for the body by utilizing sections of a microblock.
     * This method uses an empty array of sections to determine the body hash.
     *
     * @return {Uint8Array} The computed hash of the body based on the provided sections.
     */
    private static computeInitialBodyHash(): Uint8Array {
        return Microblock.computeBodyHashFromSections([])
    }

    private static computeMicroblockHash(header: MicroblockHeader) {
        const headerData = BlockchainUtils.encodeMicroblockHeader(header);
        return Crypto.Hashes.sha256AsBinary(headerData);
    }

    private static computeBodyHashFromSections(sections: Section[]): Uint8Array {
       const body: MicroblockBody = {
            sections: sections
        }
        const serializedBody = BlockchainUtils.encodeMicroblockBody(body);
        return Crypto.Hashes.sha256AsBinary(serializedBody);
    }


    /**
     * Generates a previous hash value for a genesis microblock.
     * @param {VirtualBlockchainType} mbType - The type of virtual blockchain
     * @param {number} expirationDay - The expiration day value
     * @returns {Uint8Array} The generated previous hash
     * @private
     */
    private static generatePreviousHashForGenesisMicroblock(mbType: VirtualBlockchainType, expirationDay: number = 0): Uint8Array {
        // TODO(crypto): Use a longer seed
        const genesisSeed = Crypto.Random.getBytes(24);

        const previousHash = Utils.getNullHash();
        previousHash[0] = mbType;
        previousHash[1] = expirationDay >> 24;
        previousHash[2] = expirationDay >> 16;
        previousHash[3] = expirationDay >> 8;
        previousHash[4] = expirationDay;
        previousHash.set(genesisSeed, 8);
        return previousHash
    }

    /**
     * Represents an instance of a logger used for microblock-level logging.
     */
    private static logger = Logger.getMicroblockLogger();

    // ------------------------------------------
    // Instance implementation
    // ------------------------------------------

    /**
     * A variable representing binary data encoded as a `Uint8Array`.
     *
     * This variable is typically used to handle cryptographic or hashed data.
     * It stores an array of 8-bit unsigned integers.
     *
     * Common use cases include:
     * - Storing hashes generated from input data using cryptographic algorithms.
     * - Transmitting compact binary data.
     * - Performing binary-level operations on arrays of unsigned integers.
     */
    private hash: Uint8Array;

    /**
     * Represents the header for a microblock.
     * The `MicroblockHeader` provides metadata and essential details about the microblock,
     * such as its version, parent block reference, microblock sequence, and other relevant data.
     *
     * This object is integral for validating and processing microblocks and ensuring they
     * are chained properly within their respective blockchains.
     */
    private header: MicroblockHeader;

    /**
     * Represents an array of sections.
     *
     * Each section contains structured data, typically used to divide or group related content
     * or functionality within a microblock.
     */
    private readonly sections: Section[];

    /**
     * Represents a virtual blockchain type.
     */
    private readonly type: VirtualBlockchainType;

    /**
     * Creates a new Microblock instance.
     * @param {VirtualBlockchainType} type - The type of virtual blockchain this microblock belongs to
     */
    constructor(type: VirtualBlockchainType) {
        const defaultExpirationDay = 0;
        const defaultTimestampInSeconds = Math.floor(Date.now() / 1000);
        const defaultGasPrice = CMTSToken.zero().getAmountAsAtomic();
        const initialHeader : MicroblockHeader = {
            magicString: CHAIN.MAGIC_STRING,
            protocolVersion: CHAIN.PROTOCOL_VERSION,
            microblockType: type,
            height: 1,
            previousHash: Microblock.generatePreviousHashForGenesisMicroblock(type, defaultExpirationDay),
            timestamp: defaultTimestampInSeconds,
            maxFees: 0,
            gasPrice: defaultGasPrice,
            bodyHash: Microblock.computeInitialBodyHash(),
            feesPayerAccount: Utils.getNullHash(),
        };

        this.type = type;
        this.sections = [];
        this.header = initialHeader;
        this.hash = Microblock.computeMicroblockHash(initialHeader);
    }


    /**
     * Creates a microblock at a given height.
     * If the height is greater than 1, a 'previousHash' is expected.
     * @param height
     * @param previousHash
     * @param expirationDay
     */
    private create(height: number, previousHash: Uint8Array | null, expirationDay: number) {
        if (height == 1) {
          previousHash = Microblock.generatePreviousHashForGenesisMicroblock(this.type, expirationDay);
        } else if (previousHash === null) {
            throw new Error(`previous hash not provided`);
        }

        this.header = {
            magicString: CHAIN.MAGIC_STRING,
            protocolVersion: CHAIN.PROTOCOL_VERSION,
            microblockType: this.type,
            height: height,
            previousHash: previousHash,
            timestamp: Utils.getTimestampInSeconds(),
            maxFees: 0,
            gasPrice: 0,
            bodyHash: Utils.getNullHash(),
            feesPayerAccount: Utils.getNullHash(),
        };
        this.hash = Microblock.computeMicroblockHash(this.header)
    }

    /**
     * Returns true if the microblock is signed, false otherwise.
     *
     * A microblock is considered signed if the *last* section contains a digital signature.
     */
    isSigned() {
        if (this.sections.length == 0) return false;
        return this.sections[this.sections.length - 1].type === SectionType.SIGNATURE;
    }

    /**
     Updates the timestamp.
     */
    updateTimestamp() {
        this.header.timestamp = Utils.getTimestampInSeconds();
        this.hash = Microblock.computeMicroblockHash(this.header)
    }

    /**
     * Returns the header of the microblock.
     */
    getHeader(): MicroblockHeader {
        return this.header;
    }


    /**
     * Retrieves the hash of the microblock.
     */
    getHash(): Hash {
        return Hash.from(this.hash);
    }

    /**
     * Retrieves the hash of the microblock as bytes.
     */
    getHashAsBytes(): Uint8Array {
        return this.hash;
    }

    getTimestampAsDate(): Date {
        return new Date(this.header.timestamp * 1000);
    }

    /**
     * Retrieves the height of the header.
     *
     * @return {number} The height of the header as a numeric value.
     */
    getHeight(): number {
        return this.header.height;
    }

    /**
     * Retrieves the hash value of the previous block in the blockchain.
     *
     * @return {Hash} The hash object representing the previous block's hash.
     */
    getPreviousHash(): Hash {
        return Hash.from(this.header.previousHash);
    }

    getTimestamp(): number {
        return this.header.timestamp;
    }


    /**
     * Returns the gas in the header.
     * @deprecated No more gas in contained in the header. Use getMaxFees instead.
     */
    getGas(): CMTSToken {
        return this.getMaxFees();
    }

    /**
     *
     */
    getMaxFees(): CMTSToken {
        return CMTSToken.createAtomic(this.header.maxFees);
    }


    /**
     * Assign the maximum gas fees.
     * @param maxFees
     */
    setMaxFees(maxFees: CMTSToken) {
        this.header.maxFees = maxFees.getAmountAsAtomic();
        this.hash = Microblock.computeMicroblockHash(this.header)
    }


    /**
     * @deprecated No gas in the header anymore. Use setMaxFees instead.
     * @param gas
     */
    setGas(gas: CMTSToken) {
        this.setMaxFees(gas);
    }

    setHeight(number: number) {
        this.header.height = number;
        this.hash = Microblock.computeMicroblockHash(this.header)
    }

    setGasPrice(gasPrice: CMTSToken) {
        this.header.gasPrice = gasPrice.getAmountAsAtomic();
        this.hash = Microblock.computeMicroblockHash(this.header)
    }

    getGasPrice(): CMTSToken {
        return CMTSToken.createAtomic(this.header.gasPrice);
    }

    isFeesPayerAccountDefined(): boolean {
        return Utils.binaryIsEqual(this.getFeesPayerAccount(), Utils.getNullHash()) == false;
    }

    getFeesPayerAccount(): Uint8Array {
        return this.header.feesPayerAccount;
    }

    setTimestamp(timestamp: number) {
        this.header.timestamp = timestamp;
        this.hash = Microblock.computeMicroblockHash(this.header)
    }

    setFeesPayerAccount(accountHash: Uint8Array) {
        // TODO(correctness): Should ensure that the fees payer account is defined
        //if (!(accountHash instanceof Uint8Array)) throw new TypeError(`Invalid fees payer account type: expected Uint8array, got ${typeof accountHash}`)
        this.header.feesPayerAccount = accountHash;
        this.hash = Microblock.computeMicroblockHash(this.header);
    }

    computeBodyHash() {
        return Microblock.computeBodyHashFromSections(this.sections)
    }

    serializeHeader(): Uint8Array {
        return BlockchainUtils.encodeMicroblockHeader(this.header);
        /*
        const headerSerializer = new SchemaSerializer(SCHEMAS.MICROBLOCK_HEADER);
        return headerSerializer.serialize(this.header);

         */
    }

    serializedBody(): Uint8Array {
        return BlockchainUtils.encodeMicroblockBody({
            sections: this.sections
        })
    }


    /**
     Serializes the microblock and returns an object with the microblock hash, the header data,
     the body hash and the body data.
     */
    serialize() {
        const bodyData = this.serializedBody();
        const bodyHash = this.header.bodyHash;
        const headerData = this.serializeHeader();
        const microblockHash = Microblock.computeMicroblockHash(this.header)
        const microblock: MicroblockStruct = {
            header: this.header,
            body: {
                sections: this.sections
            }
        };
        const microblockData = encode(v.parse(MicroblockStructSchema, microblock));
        return {microblockHash, headerData, bodyHash, bodyData, microblockData};
    }

    /**
     *
     * Returns the first section for which the given callback function returns true.
     * @param callback
     * @throws SectionNotFoundError When no section matches.
     */
    getSection<T = any>(callback: (section: Section) => boolean): Section {
        const section = this.sections.find((section: Section) => callback(section));
        if (section === undefined) throw new SectionNotFoundError()
        return section;
    }

    /**
     * Retrieves the total number of sections.
     *
     * @return {number} The total count of sections.
     */
    getNumberOfSections(): number {
        return this.sections.length;
    }

    /**
     Returns all sections for which the given callback function returns true.
     */
    getSections<T = any>(callback: (section: Section) => boolean): Section[] {
        return this.sections.filter((section: Section) => callback(section));
    }

    getSectionsByType<T = any>(sectionType: SectionType): Section[] {
        return this.getSections(s => s.type === sectionType);
    }


    /**
     * Retrieves all sections without applying any filter criteria.
     *
     * @template T - The type of data contained within the sections.
     * @return {Section<T>[]} An array of sections with the specified type.
     */
    getAllSections(): Section[] {
        return this.sections
    }

    /**
     * Seals the microblock by signing it with the provided private key. Optionally, the fees payer account
     * can be set before sealing the microblock.
     *
     * @param {PrivateSignatureKey} privateKey - The private key used to sign the microblock.
     * @param sealingParams
     * @return {Promise<void>} A promise that resolves when the microblock has been successfully sealed.
     * @throws {IllegalStateError} If the microblock is already signed.
     */
    async seal(privateKey: PrivateSignatureKey, sealingParams: { feesPayerAccount?: Uint8Array, includeGas?: boolean } = {}) {
        const feesPayerAccount = sealingParams.feesPayerAccount;
        if (feesPayerAccount) this.setFeesPayerAccount(feesPayerAccount);
        const includeGas = typeof sealingParams.includeGas === 'boolean' ? sealingParams.includeGas : true;
        const signature = await this.sign(privateKey, includeGas);
        const signatureSectionObject: SignatureSection = {
            type: SectionType.SIGNATURE,
            signature,
            schemeId: privateKey.getSignatureSchemeId()
        }
        this.addSection(signatureSectionObject);
    }


    /**
     * Creates a digital signature using the provided private key and optionally includes gas-related data.
     *
     * @param {PrivateSignatureKey} privateKey - The private key used to sign the data.
     * @param {boolean} includeGas - A flag indicating whether gas-related data should be included in the signature.
     * @return {Uint8Array} The generated digital signature as a byte array.
     */
    async sign(privateKey: PrivateSignatureKey, includeGas: boolean = true): Promise<Uint8Array> {
        const sections = this.sections;
        const bodyHash = Microblock.computeBodyHashFromSections(sections);
        const headerToBeSigned: MicroblockHeader = {
            ...this.header,
            maxFees: includeGas ? this.header.maxFees: 0,
            gasPrice: includeGas ? this.header.gasPrice : 0,
            bodyHash,
        }
        const headerData = BlockchainUtils.encodeMicroblockHeader(headerToBeSigned);
        const signature = await privateKey.sign(headerData)
        return signature
    }


    /**
     * Verifies the signature of the last signature section using the provided public key.
     *
     * @param {PublicSignatureKey} publicKey - The public key used to verify the signature.
     * @param {boolean} [includeGas=true] - Optional flag to indicate if gas calculations should be included during verification.
     * @return {Promise<boolean>} A promise that resolves to a boolean indicating whether the signature verification was successful.
     */
    async verify(
        publicKey: PublicSignatureKey,
        verificationParams: { includeGas?: boolean, verifiedSignatureIndex?: number | 'last' }
        = { includeGas: true, verifiedSignatureIndex: 'last' }
    ) {
        const includeGas = typeof verificationParams.includeGas === 'boolean' ? verificationParams.includeGas : true;

        // we cannot verify if there is no signature
        const currentNumberOfSignatures = this.getNumberOfSignatures();
        if (currentNumberOfSignatures === 0) {
            throw new IllegalStateError("Microblock verification failure: The current microblock is not signed")
        }

        // verify the provided signature index
        const providedVerifiedSignatureIndex = verificationParams.verifiedSignatureIndex;
        let verifiedSignatureIndex = currentNumberOfSignatures // by default, we verify the last signature
        if (typeof providedVerifiedSignatureIndex === 'number') {
            if (providedVerifiedSignatureIndex <= 0) throw new IllegalParameterError('verifiedSignatureIndex must be positive');
            if (currentNumberOfSignatures < providedVerifiedSignatureIndex)
                throw new IllegalParameterError(`Invalid provided signature index ${providedVerifiedSignatureIndex}: this microblock contains ${currentNumberOfSignatures} signatures`)
            verifiedSignatureIndex = providedVerifiedSignatureIndex
        } else if (providedVerifiedSignatureIndex === 'last' || providedVerifiedSignatureIndex === undefined) {
            // by default, we verify the last signature and the last index is already assigned, so nothing to be done here
        } else {
            throw new IllegalParameterError(`Unknown signature index: ${providedVerifiedSignatureIndex} (type ${typeof providedVerifiedSignatureIndex})`)
        }

        // search the signature section
        const { signatureSection, sectionIndexInMicroblock } = this.getNthSignatureSectionAndIndexInMicroblock(verifiedSignatureIndex);

        // compute the header
        const sections = this.sections.slice(0, sectionIndexInMicroblock);
        const headerToBeVerified: MicroblockHeader = {
            ...this.header,
            maxFees: includeGas ? this.header.maxFees : 0,
            gasPrice: includeGas ? this.header.gasPrice : 0,
            bodyHash: Microblock.computeBodyHashFromSections(sections)
        }
        const headerData = BlockchainUtils.encodeMicroblockHeader(headerToBeVerified);
        const signature = signatureSection.signature;
        return await publicKey.verify(headerData, signature);
    }

    private getNthSignatureSectionAndIndexInMicroblock(signatureIndex: number): { signatureSection: SignatureSection, sectionIndexInMicroblock: number } {
        if (signatureIndex <= 0) throw new IllegalParameterError(`Cannot return the ${signatureIndex}-th signature: should be strictly positive`)
        const sections = this.sections
            .map((section, index) => ({ section, index }))
            .filter(({section, index}) => section.type === SectionType.SIGNATURE);
        if (sections.length < signatureIndex) throw new IllegalParameterError(`Cannot return the ${signatureIndex}-th signature: only ${sections.length} signature (index starting at 1)`)
        const foundSignatureSection = sections[signatureIndex - 1]; // we search the signature section with an index starting at 1
        if (foundSignatureSection.section.type !== SectionType.SIGNATURE) throw new Error('Returned section is not a signature section')
        return { signatureSection: foundSignatureSection.section, sectionIndexInMicroblock: foundSignatureSection.index  }
    }



    /**
     * Returns the number of signatures contained within the microblock.
     */
    getNumberOfSignatures(): number {
        return this.sections.filter(section => section.type === SectionType.SIGNATURE).length;
    }

    private isLastSectionSignature(): boolean {
        if (this.sections.length == 0) return false;
        return this.sections[this.sections.length - 1].type === SectionType.SIGNATURE;
    }

    /**
     * Validates whether a given timestamp is within an acceptable range.
     * Checks if the timestamp is too far in the past or too far in the future
     * compared to the reference timestamp.
     *
     * @param {number} [referenceTimestamp=Utils.getTimestampInSeconds()] - The reference timestamp to compare against. Defaults to the current timestamp in seconds.
     * @return {TimestampValidationResult} Returns the validation result:
     * VALID if the timestamp is within the range, TOO_FAR_IN_THE_PAST if it's too far in the past,
     * or TOO_FAR_IN_THE_FUTURE if it's too far in the future.
     */
    isTemporallyCloseTo(referenceTimestamp: number = Utils.getTimestampInSeconds()): TimestampValidationResult {
        // check if too far in the past
        const isTooFarInPast = this.header.timestamp < referenceTimestamp - CHAIN.MAX_MICROBLOCK_PAST_DELAY;
        if (isTooFarInPast) {
            return TimestampValidationResult.TOO_FAR_IN_THE_PAST
        }

        // check if too far in the future
        const isTooFarInFuture = this.header.timestamp > referenceTimestamp + CHAIN.MAX_MICROBLOCK_FUTURE_DELAY;
        if(isTooFarInFuture) {
            return TimestampValidationResult.TOO_FAR_IN_THE_FUTURE
        }

        return TimestampValidationResult.VALID
    }

    /**
     *
     */
    hasSection(sectionType: SectionType) {
        try {
            this.getSectionByType(sectionType);
            return true;
        } catch (e) {
            if (e instanceof SectionNotFoundError) return false;
            throw e;
        }
    }

    /**
     * Checks if all sections in the current instance have types that are included in the provided section types array.
     *
     * @param {SectionType[]} sectionTypes - An array of section types to validate against.
     * @return {boolean} Returns true if all sections have types included in the provided array, otherwise false.
     */
    containsOnlyTheseSections(sectionTypes: SectionType[]) {
        return this.sections.every(section => sectionTypes.includes(section.type));
    }

    getIndexOfSection(sectionType: SectionType): number {
        return this.sections.findIndex(section => section.type === sectionType);
    }

    /**
     * Updates the current microblock to be considered as the successor of the
     * provided microblock.
     *
     * Note that this method only works if both microblock are sharing the same type.
     * @param microblock
     */
    setAsSuccessorOf(microblock: Microblock) {
        // we cannot handle succession if microblocks have different types
        const thisType = this.getType();
        const otherType = microblock.getType();
        if (thisType !== otherType)
            throw new IllegalParameterError(
                `Cannot make this microblock the successor: expected microblock of type ${thisType}, got ${otherType}`
            )

        // to make this microblock of the successor of the provided microblock, we need to update
        // the previous hash and the height of the microblock
        const previousMicroblockHash = microblock.getHash();
        this.setPreviousHash(previousMicroblockHash);
        this.setHeight(microblock.getHeight() + 1);

        // we update the hash of the microblock (we do not have to update the body hash because it only implies modification in the header)
        this.hash = Microblock.computeMicroblockHash(this.header)

        // log the update
        Microblock.logger.info(`Microblock ${Utils.binaryToHexa(this.hash)} updated as successor of microblock ${previousMicroblockHash.encode()}`);
    }

    /**
     * Returns the number of sections having the specified type in the microblock.
     * @param sectionType
     */
    countSectionsByType(sectionType: SectionType): number {
        return this.sections.filter(s => s.type === sectionType).length;
    }



    addSections(sections: Section[]) {
        Microblock.logger.debug("Adding sections to microblock: {names}", () => {
            const labels = sections.map(section => SectionLabel.getSectionLabelFromSection(section))
            return { names: labels.join(', ') }
        })
        this.sections.push(...sections);
        // we update the body hash and microblock hash
        this.header.bodyHash = this.computeBodyHash();
        this.hash = Microblock.computeMicroblockHash(this.header)
    }

    /**
     * Adds a new section of the specified type, serializes the provided object, and stores it.
     *
     * @param {Section} section - The created section.
     */
    addSection(section: Section) {
        this.addSections([section])
    }

    /**
     * Removes and returns the last section from the sections stack.
     * Throws an IllegalStateError if there are no sections to pop.
     *
     * @return {Section} The last section removed from the sections stack.
     * @throws {IllegalStateError} If the sections stack is empty.
     */
    popSection(): Section {
        // attempt to pop the last section
        const removedSection = this.sections.pop();
        if (this.getNumberOfSections() == 0 || removedSection === undefined)
            throw new IllegalStateError("Cannot pop section from empty microblock");

        // update the microblock state
        this.header.bodyHash = this.computeBodyHash()
        this.hash = Microblock.computeMicroblockHash(this.header)

        return removedSection
    }

    /**
     * Retrieves a section by its type.
     *
     * @param {number} type - The type of the section to find.
     * @return {Section} The section object that matches the specified type.
     * @throws {SectionNotFoundError} If no section with the specified type is found.
     */
    getSectionByType<T = any>(type: number): Section {
        const section = this.sections.find((section: Section) => section.type === type);
        if (section === undefined) throw new SectionNotFoundError();
        return section
    }

    toString(): string {
        const encoder = EncoderFactory.bytesToHexEncoder();
        let output = `Microblock:\n`;
        output += `  Hash: ${encoder.encode(this.hash)}\n`;
        output += `  Recomputed hash: ${encoder.encode(this.computeHash())}\n`;
        output += `  Header:\n`;
        output += `    Microblock type: ${this.header.microblockType} or ${this.type}\n`;
        output += `    Magic String: ${this.header.magicString}\n`;
        output += `    Protocol Version: ${this.header.protocolVersion}\n`;
        output += `    Fees payer account: ${encoder.encode(this.header.feesPayerAccount)}\n`;
        output += `    Height: ${this.header.height}\n`;
        output += `    Previous Hash: ${encoder.encode(this.header.previousHash)}\n`;
        output += `    Timestamp: ${this.header.timestamp}\n`;
        output += `    Max fees: ${this.header.maxFees}\n`;
        output += `    Gas Price: ${this.header.gasPrice}\n`;
        output += `    Body Hash: ${encoder.encode(this.header.bodyHash)}\n`;
        output += `    Computed body Hash: ${encoder.encode(this.computeBodyHash())}\n`;

        output += `  Sections (${this.sections.length}):\n`;
        this.sections.forEach((section, index) => {
            output += `    Section ${index}:\n`;
            output += `      Section Type: ${SectionLabel.getSectionLabelFromSection(section)} (type ${section.type})\n`;
            output += `      Section Data: ${Utils.binaryToHexa(BlockchainUtils.encodeSection(section))}\n`;
        });

        return output;
    }

    /**
     *
     */
    getType(): VirtualBlockchainType {
        return this.type;
    }

    setPreviousHash(previousHash: Hash) {
        this.header.previousHash = previousHash.toBytes()
    }

    static extractTypeFromGenesisPreviousHash(genesisPreviousHash: Uint8Array) {
        const type = genesisPreviousHash[0];
        return type;
    }

    static extractExpirationDayFromGenesisPreviousHash(genesisPreviousHash: Uint8Array) {
        const expirationDay =
            genesisPreviousHash[1] << 24 |
            genesisPreviousHash[2] << 16 |
            genesisPreviousHash[3] << 8 |
            genesisPreviousHash[4];
        return expirationDay;
    }

    getBodyHashInHeader() {
        return this.header.bodyHash;
    }

    isDeclaringConsistentBodyHash() {
        const bodyHash = this.computeBodyHash();
        return Utils.binaryIsEqual(bodyHash, this.header.bodyHash)
    }

    isGenesisMicroblock() {
        return this.getHeight() === 1;
    }

    setBodyHash(bodyHash: Uint8Array<ArrayBufferLike>) {
        this.header.bodyHash = bodyHash;
    }

    computeHash() {
        const {microblockHash} = this.serialize();
        return microblockHash;
    }

    setMicroblockHash(hash: Uint8Array) {
        this.hash = hash;
    }

    getLastSignatureSection(): SignatureSection {
        const lastSection = this.sections[this.sections.length - 1];
        if (lastSection.type !== SectionType.SIGNATURE) throw new Error('Last section is not a signature section');
        return lastSection;
    }
}
