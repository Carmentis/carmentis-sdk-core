import {Crypto} from "../crypto/crypto";
import {Utils} from "../utils/utils";

export class SaltShaker {
    private pepper: Uint8Array;
    private hasNullPepper: boolean;
    private sha512: Uint8Array;
    private counter: number;

    constructor(pepper: Uint8Array) {
        this.pepper = pepper;
        this.sha512 = new Uint8Array(64);
        this.counter = 0;
        this.hasNullPepper = this.pepper.every((byte) => byte == 0x00);
    }

    static generatePepper() {
        return Crypto.Random.getBytes(32);
    }

    getPepper() {
        return this.pepper;
    }

    getSalt() {
        const index = this.counter & 3;
        const batch = this.counter++ >> 2;

        if (!index && !this.hasNullPepper) {
            this.sha512 = Crypto.Hashes.sha512AsBinary(Utils.binaryFrom(this.pepper, batch));
        }
        return this.sha512.slice(index << 4, (index + 1) << 4);
    }
}
