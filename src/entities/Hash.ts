import {BytesToBase64Encoder, BytesToHexEncoder, EncoderFactory, EncoderInterface} from "../utils/encoder";

/**
 * Represents a hash object that allows encoding and creation from a string or Uint8Array.
 */
export class Hash {
    /**
     * Constructs a new instance of the class with the provided hash value.
     *
     * @param {Uint8Array} hash - The hash value to be used for this instance.
     */
    constructor(private hash: Uint8Array) {
    }

    /**
     * Creates a new instance of Hash from a string or Uint8Array.
     *
     * ```
     * const hash = Hash.from('0x1234567890abcdef');
     * const hash = Hash.from(new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef]));
     * ```
     *
     * @param {string | Uint8Array} hash - The hash input, which can either be a string or a Uint8Array.
     * @return {Hash} A new Hash instance created from the given input.
     *
     *
     */
    static from(hash: string | Uint8Array) {
        const isString = typeof hash === "string";
        const isBinary = hash instanceof Uint8Array;
        if (!isString && !isBinary) throw new TypeError(`Expected hash of type string or Uint8Array: got ${typeof hash}`);
        const encoder = EncoderFactory.bytesToHexEncoder();
        return new Hash(
            typeof hash == 'string' ? encoder.decode(hash) : hash
        )
    }

    static fromHex(hash: string) {
        return new Hash( EncoderFactory.bytesToHexEncoder().decode(hash) )
    }

    /**
     * Encodes the current hash using the provided encoder.
     *
     * ```
     * const hash = Hash.from('0x1234567890abcdef');
     * const hexEncoder = EncoderFactory.bytesToHexEncoder();
     * const hexString = hash.encode(hexEncoder); // '0x1234567890abcdef'
     * const hexString = hash.encode(); // '0x1234567890abcdef'
     * ```
     *
     * @param {EncoderInterface<Uint8Array, string>} [encoder=new BytesToBase64Encoder()] - The encoder used to encode the hash. Defaults to a BytesToBase64Encoder.
     * @return {string} The encoded string representation of the hash.
     */
    encode(encoder: EncoderInterface<Uint8Array, string> = new BytesToHexEncoder()): string {
        return encoder.encode(this.hash).toUpperCase();
    }

    /**
     * Converts and retrieves the hash value as a Uint8Array.
     *
     * ```
     * const hash = Hash.from('0x1234567890abcdef');
     * const bytes = hash.toBytes(); // Uint8Array([0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef])
     * ```
     *
     * @return {Uint8Array} The hash value as a Uint8Array.
     */
    toBytes(): Uint8Array {
        return new Uint8Array(this.hash);
    }

    /**
     * Checks equality of this hash with respect to another hash provided in parameter.
     *
     * @param other
     */
    equals(other: Hash): boolean {
        return this.hash.every((value, index) => value === other.hash[index])
    }
}