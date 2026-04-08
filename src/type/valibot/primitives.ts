// This file contains primitive types used by the SDK and defined using valibot.

import * as val from "valibot";

export const ARRAY    = 0x0;
export const OBJECT   = 0x1;
export const STRING   = 0x2;
export const NUMBER   = 0x3;
export const BOOLEAN  = 0x4;
export const NULL     = 0x5;
export const UINT8    = 0x6;
export const UINT16   = 0x7;
export const UINT24   = 0x8;
export const UINT32   = 0x9;
export const UINT48   = 0xA;
export const BINARY   = 0xB;
export const BIN256   = 0xC;
export const HASH_STR = 0xD;

export type AnySchema = val.BaseSchema<any, any, any>;

export interface ArrayOptions { items: AnySchema }
export interface NumberOptions {}
export interface StringOptions { size?: number; }
export interface NumberOptions {}
export interface BooleanOptions {}
export interface NilOptions {}
export interface UintOptions {}
export interface BinaryOptions { size?: number; }
export interface Bin256Options { }


export function array(options: ArrayOptions) {
    const schema = val.pipe(
        val.array(options.items),
        val.metadata({ typeId: ARRAY, elementSchema: options.items, ...options })
    );

    return schema;
}


export function string(options: StringOptions = {}) {
    const size = (options && options.size) || -1;

    const schema = val.pipe(
        val.string(),
        val.custom((v) => typeof v === "string" && (size === -1 || v.length === size), `Expected size is ${size} bytes`),
        val.metadata({ typeId: STRING, size, ...options })
    );

    return schema;
}

export function number(options: NumberOptions = {}) {
    const schema = val.pipe(
        val.number(),
        val.metadata({ typeId: NUMBER, ...options })
    );

    return schema;
}


export function boolean(options: BooleanOptions = {}) {
    const schema = val.pipe(
        val.boolean(),
        val.metadata({ typeId: BOOLEAN, ...options })
    );

    return schema;
}


function uint(typeId: number, bits: number, options: UintOptions) {
    const schema = val.pipe(
        val.number(),
        val.integer(),
        val.minValue(0),
        val.maxValue(2 ** bits - 1),
        val.metadata({ typeId, ...options })
    );

    return schema;
}
export function uint8(options: UintOptions = {}) { return uint(UINT8, 8, options); }
export function uint16(options: UintOptions = {}) { return uint(UINT16, 16, options); }
export function uint24(options: UintOptions = {}) { return uint(UINT24, 24, options); }
export function uint32(options: UintOptions = {}) { return uint(UINT32, 32, options); }
export function uint48(options: UintOptions = {}) { return uint(UINT48, 48, options); }


export function binary(options: BinaryOptions = {}) {
    const size = (options && options.size) || -1;

    const schema = val.pipe(
        val.instance(Uint8Array),
        val.custom((v) => v instanceof Uint8Array && (size === -1 || v.length === size), `Expected size is ${size} bytes`),
        val.metadata({ typeId: BINARY, ...options })
    );

    return schema;
}

export function bin256(options: Bin256Options = {}) {
    const schema = val.pipe(
        val.instance(Uint8Array<ArrayBuffer | ArrayBufferLike>),
        val.custom((v) => v instanceof Uint8Array && v.length === 32, `Expected Uint8Array of 32 bytes`),
        val.metadata({ typeId: BIN256, ...options })
    );

    return schema;
}

export function uint8array()  {
    return val.instance(Uint8Array<ArrayBuffer | ArrayBufferLike>)
}

export function accountId() {
    return uint8array();
}

export function height() {
    return val.pipe(
        val.number(),
        val.minValue(0)
    )
}