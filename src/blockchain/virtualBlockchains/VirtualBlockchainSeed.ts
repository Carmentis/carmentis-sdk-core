import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {Crypto} from "../../crypto/crypto";
import {Utils} from "../../utils/utils";
import {type} from "node:os";
import {Hash} from "../../entities/Hash";

export class VirtualBlockchainSeed {
    private readonly previousHash: Uint8Array;
    constructor(
        private readonly type: VirtualBlockchainType,
        private readonly expirationDay: number,
        private readonly randomness: Uint8Array
    ) {
        this.previousHash = Utils.getNullHash();
        this.previousHash[0] = this.type;
        this.previousHash[1] = this.expirationDay >> 24;
        this.previousHash[2] = this.expirationDay >> 16;
        this.previousHash[3] = this.expirationDay >> 8;
        this.previousHash[4] = this.expirationDay;
        this.previousHash.set(this.randomness, 8);
    }

    static createWithRandomness(type: VirtualBlockchainType, expirationDay: number, randomness: Uint8Array) {
        return new VirtualBlockchainSeed(type, expirationDay, randomness);
    }

    static create(type: VirtualBlockchainType, expirationDay: number) {
        const randomness = Crypto.Random.getBytes(24);
        return new VirtualBlockchainSeed(type, expirationDay, randomness);
    }

    static createFromGenesisSeed(genesisSeed: Uint8Array) {
        const type = this.extractTypeFromGenesisPreviousHash(genesisSeed);
        const expirationDay = this.extractExpirationDayFromGenesisPreviousHash(genesisSeed);
        const randomness = this.extractRandomnessFromGenesisPreviousHash(genesisSeed);
        return new VirtualBlockchainSeed(type, expirationDay, randomness);
    }

    static extractRandomnessFromGenesisPreviousHash(genesisPreviousHash: Uint8Array): Uint8Array {
        // Layout: [0] type | [1..4] expirationDay (big-endian) | [5..7] unused | [8..31] randomness (24 bytes)
        return genesisPreviousHash.slice(8, 32);
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


    getType(): VirtualBlockchainType {
        return this.type;
    }

    getExpirationDay(): number {
        return this.expirationDay;
    }

    getRandomness(): Uint8Array {
        return this.randomness;
    }

    getGenesisSeed() {
        return Hash.from(this.previousHash);
    }


}