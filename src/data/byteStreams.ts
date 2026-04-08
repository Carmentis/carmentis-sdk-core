import {DATA} from "../constants/constants";
import {Utf8Encoder} from "./utf8Encoder";
import {Utils} from "../utils/utils";

const NUM_SMALL     = 0x80;
const NUM_TYPE      = 0x60;
const NUM_SIZED_INT = 0x00;
const NUM_FLOAT32   = 0x20;
const NUM_FLOAT64   = 0x40;
const NUM_SIZE      = 0x07;
const NUM_SIGN      = 0x08;

export class WriteStream {
  byteStream: any;
  constructor() {
    this.clear();
  }

  clear() {
    this.byteStream = [];
  }

  getByteStream() {
    return new Uint8Array(this.byteStream);
  }

  writeJsonValue(type: any, value: any) {
    switch(type) {
      case DATA.TYPE_STRING : { this.writeString(value); break; }
      case DATA.TYPE_NUMBER : { this.writeNumber(value); break; }
      case DATA.TYPE_BOOLEAN: { this.writeBoolean(value); break; }
      case DATA.TYPE_NULL   : { break; }

      default: {
        throw `Type ${type} is not a JSON type`;
      }
    }
  }

  writeSchemaValue(type: number, value: any, size: number | undefined) {
    switch(type) {
      case DATA.TYPE_STRING  : { this.writeString(value, size); break; }
      case DATA.TYPE_NUMBER  : { this.writeNumber(value); break; }
      case DATA.TYPE_BOOLEAN : { this.writeBoolean(value); break; }
      case DATA.TYPE_NULL    : { break; }
      case DATA.TYPE_UINT8   : { this.writeUint8(value); break; }
      case DATA.TYPE_UINT16  : { this.writeUint16(value); break; }
      case DATA.TYPE_UINT24  : { this.writeUint24(value); break; }
      case DATA.TYPE_UINT32  : { this.writeUint32(value); break; }
      case DATA.TYPE_UINT48  : { this.writeUint48(value); break; }
      case DATA.TYPE_BINARY  : { this.writeBinary(value, size); break; }
      case DATA.TYPE_BIN256  : { this.writeByteArray(value); break; }
      case DATA.TYPE_HASH_STR: { this.writeHashString(value); break; }

      default: {
        throw `Unexpected type ${type}`;
      }
    }
  }

  writeByte(n: number) {
    this.byteStream.push(n & 0xFF);
  }

  writeUnsigned(n: number, nByte: number) {
    while(nByte--) {
      this.writeByte(n / 2 ** (nByte * 8));
    }
  }

  writeUint8(n: number) {
    this.writeUnsigned(n, 1);
  }

  writeUint16(n: number) {
    this.writeUnsigned(n, 2);
  }

  writeUint24(n: number) {
    this.writeUnsigned(n, 3);
  }

  writeUint32(n: number) {
    this.writeUnsigned(n, 4);
  }

  writeUint48(n: number) {
    this.writeUnsigned(n, 6);
  }

  writeBinary(arr: any, size = -1) {
    if(size == -1) {
      this.writeVarUint(arr.length);
    }
    this.writeByteArray(arr);
  }

  writeHashString(str: string) {
    this.writeByteArray(Utils.binaryFromHexa(str));
  }

  writeByteArray(arr: any) {
    for(const n of arr) {
      this.writeByte(n);
    }
  }

  writeString(str: string, size = -1) {
    const bin = Utf8Encoder.encode(str);

    if(size == -1) {
      this.writeVarUint(bin.length);
    }
    this.writeByteArray(bin);
  }

  writeVarUint(n: number) {
    if(n == 0) {
      this.writeByte(0);
    }
    else {
      if(n < 0 || n % 1 || n > Number.MAX_SAFE_INTEGER) {
        throw `Invalid varUint ${n}`;
      }
      while(n) {
        // @ts-expect-error TS(2362): The left-hand side of an arithmetic operation must... Remove this comment to see the full error message
        this.writeByte(n % 0x80 | (n > 0x7F) << 7);
        n = Math.floor(n / 0x80);
      }
    }
  }

  writeBoolean(n: boolean) {
    this.writeByte(n ? 0xFF : 0x00);
  }

  writeNumber(n: number) {
    const isInteger = !(n % 1);

    // if this is a small integer in [-64, 63], encode as a single byte
    if(isInteger && n >= -0x40 && n < 0x40) {
      this.writeByte(NUM_SMALL | n & 0x7F);
      return;
    }

    // attempt to encode as 1 prefix byte + 1 to 6 data bytes
    for(let size = 1, max = 0x100; size <= 6; size++, max *= 0x100) {
      // attempt to encode as a signed integer in big-endian format
      if(isInteger && n >= -max && n < max) {
        const sign = n < 0;

        // @ts-expect-error TS(2362): The left-hand side of an arithmetic operation must... Remove this comment to see the full error message
        this.writeByte(sign << 3 | size);
        this.writeUnsigned(sign ? -n - 1 : n, size);
        return;
      }

      // for size 4, test whether this number can be safely encoded as a Float32
      if(size == 4) {
        const f32 = new Float32Array([n]);
        const v32 = +f32[0].toPrecision(7);

        if(v32 === n) {
          this.writeByte(NUM_FLOAT32);
          this.writeByteArray(new Uint8Array(f32.buffer));
          return;
        }
      }
    }

    // fallback for everything else: encode as Float64 (1 prefix byte + 8 bytes)
    this.writeByte(NUM_FLOAT64);
    this.writeByteArray(new Uint8Array(new Float64Array([n]).buffer));
  }
}

export class ReadStream {
  byteStream: any;
  lastPointer: any;
  pointer: any;
  constructor(stream: any) {
    this.byteStream = stream;
    this.pointer = 0;
  }

  readJsonValue(type: any) {
    this.lastPointer = this.pointer;

    switch(type) {
      case DATA.TYPE_STRING : { return this.readString(); }
      case DATA.TYPE_NUMBER : { return this.readNumber(); }
      case DATA.TYPE_BOOLEAN: { return this.readBoolean(); }
      case DATA.TYPE_NULL   : { return null; }

      default: {
        throw `Type ${type} is not a JSON type`;
      }
    }
  }

  readSchemaValue(type: any, size: any) {
    this.lastPointer = this.pointer;

    switch(type) {
      case DATA.TYPE_STRING  : { return this.readString(size); }
      case DATA.TYPE_NUMBER  : { return this.readNumber(); }
      case DATA.TYPE_BOOLEAN : { return this.readBoolean(); }
      case DATA.TYPE_NULL    : { return null; }
      case DATA.TYPE_UINT8   : { return this.readUint8(); }
      case DATA.TYPE_UINT16  : { return this.readUint16(); }
      case DATA.TYPE_UINT24  : { return this.readUint24(); }
      case DATA.TYPE_UINT32  : { return this.readUint32(); }
      case DATA.TYPE_UINT48  : { return this.readUint48(); }
      case DATA.TYPE_BINARY  : { return this.readBinary(size); }
      case DATA.TYPE_BIN256  : { return this.readByteArray(32); }
      case DATA.TYPE_HASH_STR: { return this.readHashString(); }
    }
  }

  getPointer() {
    return this.pointer;
  }

  extractFrom(ptr: any) {
    return this.byteStream.slice(ptr, this.pointer);
  }

  getLastField() {
    return this.byteStream.slice(this.lastPointer, this.pointer);
  }

  readByte() {
    return this.byteStream[this.pointer++];
  }

  readUnsigned(nByte: any) {
    let n = 0;

    while(nByte--) {
      n = n * 0x100 + this.readByte();
    }
    return n;
  }

  readUint8() {
    return this.readUnsigned(1);
  }

  readUint16() {
    return this.readUnsigned(2);
  }

  readUint24() {
    return this.readUnsigned(3);
  }

  readUint32() {
    return this.readUnsigned(4);
  }

  readUint48() {
    return this.readUnsigned(6);
  }

  readBinary(size = -1) {
    return this.readByteArray(size == -1 ? this.readVarUint() : size);
  }

  readHashString() {
    return Utils.binaryToHexa(this.readByteArray(32));
  }

  readByteArray(size: number) {
    return this.byteStream.slice(this.pointer, this.pointer += size);
  }

  readString(size = -1) {
    const array = this.readByteArray(size == -1 ? this.readVarUint() : size);
    return Utf8Encoder.decode(array);
  }

  readVarUint() {
    const parts = [];
    let b;

    do {
      b = this.readByte();
      parts.push(b & 0x7F);
    } while(b & 0x80);

    return parts.reduceRight((value, b) => value * 0x80 + b, 0);
  }

  readBoolean() {
    return !!this.readByte();
  }

  readNumber() {
    const leadingByte = this.readByte();

    if(leadingByte & NUM_SMALL) {
      return ((leadingByte & 0x7F) ^ 0x40) - 0x40;
    }

    switch(leadingByte & NUM_TYPE) {
      case NUM_FLOAT32: {
        return +new Float32Array(this.readByteArray(4).buffer)[0].toPrecision(7);
      }
      case NUM_FLOAT64: {
        return new Float64Array(this.readByteArray(8).buffer)[0];
      }
      default: {
        const n = this.readUnsigned(leadingByte & NUM_SIZE);

        return leadingByte & NUM_SIGN ? -n - 1 : n;
      }
    }
  }
}
