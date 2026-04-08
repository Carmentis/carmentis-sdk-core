import {DATA} from "../constants/constants";
import {Utf8Encoder} from "./utf8Encoder";

import {TypeCheckingFailureError} from "../errors/type-checking-failure-error";

const JSON_TYPES =
  1 << DATA.TYPE_ARRAY |
  1 << DATA.TYPE_OBJECT |
  1 << DATA.TYPE_STRING |
  1 << DATA.TYPE_NUMBER |
  1 << DATA.TYPE_BOOLEAN |
  1 << DATA.TYPE_NULL;

export class TypeManager {
  static getType(value: any) {
    switch(typeof value) {
      case "string": {
        return DATA.TYPE_STRING;
      }
      case "number": {
        return DATA.TYPE_NUMBER;
      }
      case "boolean": {
        return DATA.TYPE_BOOLEAN;
      }
      case "object": {
        if(value === null) {
          return DATA.TYPE_NULL;
        }
        if(Array.isArray(value)) {
          return DATA.TYPE_ARRAY;
        }
        if(value instanceof Uint8Array) {
          return DATA.TYPE_BINARY;
        }
        if(Object.getPrototypeOf(value).isPrototypeOf(Object)) {
          return DATA.TYPE_OBJECT;
        }
      }
    }
    return DATA.TYPE_UNKNOWN;
  }

  static isJsonType(type: any) {
    return JSON_TYPES >> type & 1;
  }
}

export class TypeChecker {
  basicType: any;
  definition: any;
  value: any;
  constructor(definition: any, value: any) {
    this.definition = definition;
    this.value = value;
    this.basicType = TypeManager.getType(value);
  }

  /**
    Tests whether this.value conforms to this.definition.
  */
  check() {
    const mainType = this.definition.type & DATA.TYPE_MAIN;

    switch(mainType) {
      case DATA.TYPE_STRING  : { this.isString(); break; }
      case DATA.TYPE_NUMBER  : { this.isNumber(); break; }
      case DATA.TYPE_BOOLEAN : { this.isBoolean(); break; }
      case DATA.TYPE_UINT8   : { this.isUnsignedInteger(8); break; }
      case DATA.TYPE_UINT16  : { this.isUnsignedInteger(16); break; }
      case DATA.TYPE_UINT24  : { this.isUnsignedInteger(24); break; }
      case DATA.TYPE_UINT32  : { this.isUnsignedInteger(32); break; }
      case DATA.TYPE_UINT48  : { this.isUnsignedInteger(48); break; }
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      case DATA.TYPE_BINARY  : { this.isBinary(); break; }
      case DATA.TYPE_BIN256  : { this.isBinary(32); break; }
      case DATA.TYPE_HASH_STR: { this.isHashString(); break; }

      default: {
        throw `unexpected definition type ${mainType}`;
      }
    }
  }

  isString() {
    if(this.basicType != DATA.TYPE_STRING) {
      throw `string expected`;
    }

    if(this.definition.size) {
      const utf8 = Utf8Encoder.encode(this.value);

      this.checkSize(utf8.length, this.definition.size);
    }
  }

  isNumber() {
    if(this.basicType != DATA.TYPE_NUMBER) {
      throw `number expected`;
    }
  }

  isBoolean() {
    if(this.basicType != DATA.TYPE_BOOLEAN) {
      throw `Boolean value expected`;
    }
  }

  isInteger() {
    this.isNumber();

    if(this.value % 1) {
      throw `integer expected`;
    }
    if(this.value < Number.MIN_SAFE_INTEGER || this.value > Number.MAX_SAFE_INTEGER) {
      throw `value is outside the safe integer range`;
    }
  }

  isUnsignedInteger(nBits: any) {
    this.isInteger();

    if(this.value < 0) {
      throw new TypeCheckingFailureError(`non-negative value expected`);
    }
    if(this.value >= 2 ** nBits) {
      throw new Error(`value is too big (${nBits}-bit value expected)`);
    }
  }

  isBinary(size: any) {
    if(this.basicType != DATA.TYPE_BINARY) {
      throw `Uint8Array expected`;
    }

    this.checkSize(this.value.length, size || this.definition.size);
  }

  isHashString() {
    this.isString();
    this.checkSize(this.value.length, 64);

    if(/[^\da-f]/i.test(this.value)) {
      throw `hexadecimal string expected`;
    }
  }

  checkSize(actualSize: any, expectedSize: any) {
    if(expectedSize !== undefined && actualSize != expectedSize) {
      throw `invalid size (expecting ${expectedSize}, got ${actualSize})`;
    }
  }
}
