const CROCKFORD_CHARS = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export const Base32 = {
    verifyFormat,
    encodeNumber,
    decodeNumber,
    encodeToChar,
    decodeFromChar,
    CROCKFORD_CHARS
};

function verifyFormat(str: string, size = str.length) {
    const base32Regex = new RegExp(`^(${[...CROCKFORD_CHARS].join("|")}){${size}}$`);
    return base32Regex.test(str);
}

function encodeNumber(value: number, size: number) {
    if (!Number.isInteger(size) || size < 1 || size > 10) {
        throw new Error("Invalid or unsafe size for base32 encoding");
    }
    if (!Number.isInteger(value) || value < 0 || value >= 32 ** size) {
        throw new Error(`Invalid number for base32 encoding of size ${size}`);
    }
    return [...Array(size).keys()].map((n) =>
        encodeToChar(value >> n * 5 & 0x1F)
    ).join("");
}

function decodeNumber(str: string) {
    if (str.length == 0 || str.length > 10) {
        throw new Error("Invalid base32 string length");
    }
    return [...str].reduceRight(
        (v, c) => v << 5 | decodeFromChar(c),
        0
    );
}

function encodeToChar(value: number) {
    const char = CROCKFORD_CHARS[value];
    if (char === undefined) {
        throw new Error("Invalid base32 value");
    }
    return char;
}

function decodeFromChar(char: string) {
    const value = CROCKFORD_CHARS.indexOf(char);
    if (char.length != 1 || value == -1) {
        throw new Error("Invalid base32 character");
    }
    return value;
}
