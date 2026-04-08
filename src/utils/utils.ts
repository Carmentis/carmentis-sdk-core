import {DATA} from "../constants/constants";
import {TypeManager} from "../data/types";
import {Utf8Encoder} from "../data/utf8Encoder";
import {Logger} from "./Logger";
import {IllegalParameterError} from "../errors/carmentis-error";

export const Utils = {
    numberToHexa,
    truncateString,
    truncateStringMiddle,
    getNullHash,
    getTimestampInSeconds,
    encodeDay,
    decodeDay,
    dateToDay,
    dayToDate,
    addDaysToTimestamp,
    timestampDifferenceInDays,
    bufferToUint8Array,
    binaryToHexa,
    binaryFromHexa,
    binaryFrom,
    binaryIsEqual,
    binaryCompare,
    intToByteArray,
    byteArrayToInt,
    getGenesisEpochInTimestamp: getInitialTimestampInSeconds
};

const logger = Logger.getLogger(["utils"])

/**
 * Converts an integer to a hexadecimal string, padded with 0's to reach a given size
 */
function numberToHexa(value: number, size?: number) {
    return value.toString(16).toUpperCase().padStart(size || 1, "0");
}

/**
 * Truncates a string to a given size and appends "(...)" if it's longer
 */
function truncateString(str: string, size: number) {
    return str.slice(0, size) + (str.length > size ? "(...)" : "");
}

/**
 * Truncates a string on both ends and appends "(...)" in the middle if it's longer
 */
function truncateStringMiddle(str: string, leadingSize: number, trailingSize: number) {
    if (str.length <= leadingSize + trailingSize) {
        return str;
    }
    return str.slice(0, leadingSize) + "(...)" + str.slice(str.length - trailingSize);
}

/**
 * Returns a null hash, i.e. an Uint8Array with 32 zero-bytes
 */
function getNullHash() {
    return new Uint8Array(32);
}

/**
 * Returns a timestamp in seconds
 */
function getTimestampInSeconds() {
    return Math.floor(Date.now() / 1000);
}

/**
 * Returns an initial timestamp set to 0
 */
function getInitialTimestampInSeconds() {
    return 0;
}

/**
 * Encodes a day given as (year, month, day) to a 32-bit value
 */
function encodeDay(year: number, month: number, day: number) {
    return year << 9 | month << 5 | day;
}

/**
 * Converts a 32-bit encoded day to [ year, month, day ]
 */
function decodeDay(value: number) {
    const day = value & 0x1F;
    const month = value >> 5 & 0xF;
    const year = value >>> 9;

    return [year, month, day];
}

/**
 * Encodes a day given as a Date to a 32-bit value
 */
function dateToDay(date: Date) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    return encodeDay(year, month, day);
}

/**
 * Converts a 32-bit encoded day to an UTC Date
 */
function dayToDate(value: number) {
    const [year, month, day] = decodeDay(value);

    return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Adds a number of days to a timestamp (in seconds) and returns the resulting timestamp (in seconds),
 * normalized to 00:00:00 UTC of the resulting date.
 *
 * Only the year, month and day are considered: any time-of-day information is discarded.
 * The `days` offset can be positive, zero, or negative.
 * If `days` is zero, the function returns the timestamp corresponding to 00:00:00 UTC of the same day.
 */
function addDaysToTimestamp(ts: number, days: number) {
    const date = new Date(ts * 1000);
    const dayTs = Math.floor(
        Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate() + days
        )
        / 1000
    );
    return dayTs;
}

/**
 * Given two timestamps in seconds, returns the difference in whole days.
 */
function timestampDifferenceInDays(startTs: number, endTs: number) {
    return Math.round((endTs - startTs) / 86400);
}

/**
 * Converts a buffer to an Uint8Array
 */
function bufferToUint8Array(b: any) {
    return new Uint8Array(b.buffer, b.byteOffset, b.byteLength / Uint8Array.BYTES_PER_ELEMENT);
}

/**
 * Converts an Uint8Array to a hexadecimal string
 */
function binaryToHexa(array: Uint8Array) {
    return [...array].map((n) =>
        n.toString(16).toUpperCase().padStart(2, "0")
    ).join("");
}

/**
 * Converts a hexadecimal string to an Uint8Array
 */
function binaryFromHexa(str: string) {
    if (typeof str !== 'string') throw new IllegalParameterError(`Expecting hex-string value: received ${typeof str}`)
    if (!str.match(/^([\da-f]{2})*$/gi)) throw new IllegalParameterError(`Expecting hex-string value: received '${str}'`)
    const res = (str.match(/../g) || []).map((s) => parseInt(s, 16));
    return new Uint8Array(res);
}

/**
 * Builds an Uint8Array from a list made of integers, strings and Uint8Array's
 */
function binaryFrom(...arg: (number | Uint8Array | string)[]) {
    const list: number[] = Array(arg.length);
  const parts: Uint8Array[] = Array(arg.length);
    let ndx = 0;

    arg.forEach((data, i) => {
        const t = TypeManager.getType(data);

        switch (t) {
            case DATA.TYPE_NUMBER: {
                parts[i] = new Uint8Array(intToByteArray(data as number));
                break;
            }
            case DATA.TYPE_STRING: {
                parts[i] = Utf8Encoder.encode(data as string);
                break;
            }
            case DATA.TYPE_BINARY: {
                parts[i] = data as Uint8Array;break;
            }
            default: {
                const numberOfArguments = arg.length;
                const typeOfArguments = arg.map(a => DATA.TYPE_NAMES[TypeManager.getType(a)]).join(", ");
                throw new Error(`unsupported type '${DATA.TYPE_NAMES[t]}' for Utils.binaryFrom(): got ${numberOfArguments} arguments of type ${typeOfArguments}`);
            }
        }
        list[i] = ndx;
        ndx += parts[i].length;
    });

    const arr = new Uint8Array(ndx);

    list.forEach((ndx, i) => {
        arr.set(parts[i], ndx);
    });

    return arr;
}

/**
 * Tests whether two Uint8Array's are equal
 */
function binaryIsEqual(a: Uint8Array, b: Uint8Array) {
    // reject non-binary inputs
    if (!(a instanceof Uint8Array)) throw new Error(`Excepted Uint8array, got ${typeof a}`)
    if (!(b instanceof Uint8Array)) throw new Error(`Excepted Uint8array, got ${typeof b}`)

    const ua = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
    const ub = new Uint8Array(b.buffer, b.byteOffset, b.byteLength);

    if (ua.byteLength !== ub.byteLength) {
        logger.debug(
            `Comparison result is false (distinct length): ${ua.byteLength} != ${ub.byteLength}`
        );
        return false;
    }

    for (let i = 0; i < ua.byteLength; i++) {
        if (ua[i] !== ub[i]) {
            logger.debug(
                `Comparison result is false (distinct value): ${ua[i]} != ${ub[i]}`
            );
            return false;
        }
    }

    logger.debug(`Comparison result is true`);
    return true;
}

/**
 * Compares two Uint8Array's and returns 0 for 'equal', -1 for 'less than', 1 for 'greater than'
 */
function binaryCompare(a: any, b: any) {
    if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array) || a.length != b.length) {
        throw "cannot compare";
    }

    for (const i in a) {
        if (a[i] < b[i]) {
            return -1;
        } else if (a[i] > b[i]) {
            return 1;
        }
    }
    return 0;
}

/**
 * Converts an integer to an array of bytes, with an optional minimum number of bytes
 */
function intToByteArray(n: number, minSize: number = 1) {
    const arr: number[] = [];

    let remaining = n;
    let size = minSize;

    while (remaining > 0 || size > 0) {
        arr.push(remaining & 0xFF);
        remaining = Math.floor(remaining / 0x100);
        size--;
    }

    return arr.reverse();
}

/**
 * Converts an array of bytes to an integer
 */
function byteArrayToInt(array: number[]) {
    return array.reduce((t, n) => t * 0x100 + n, 0);
}
