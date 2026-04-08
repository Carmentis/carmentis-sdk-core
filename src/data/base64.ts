import {Utf8Encoder} from "./utf8Encoder";

const ALPHA  = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const BASE64 = ALPHA + "+/=";
const URL    = ALPHA + "-_=";

export const Base64 = {
  BASE64,
  URL,
  encodeString,
  decodeString,
  encodeBinary,
  decodeBinary
};

function encodeString(str: string, alphabet = BASE64, padding = false) {
  return encodeBinary(Utf8Encoder.encode(str), alphabet, padding);
}

function decodeString(str: string, alphabet = BASE64) {
  return Utf8Encoder.decode(decodeBinary(str, alphabet));
}

function encodeBinary(bin: Uint8Array, alphabet = BASE64, padding = false) {
  let r = bin.length % 3,
      acc = 0,
      out = "";

  for(let i = 0; i < bin.length || i % 3;) {
    acc = acc << 8 | bin[i++];

    if(!(i % 3)) {
      for(let j = 4; j--;) {
        out += alphabet[acc >> j * 6 & 0x3F];
      }
      acc = 0;
    }
  }
  return r ? out.slice(0, r - 3) + alphabet[0x40].repeat(padding ? 3 - r : 0) : out;
}

function decodeBinary(str: string, alphabet = BASE64) {
  let crop = 0,
      acc = 0,
      out = [];

  str += alphabet[0x40].repeat(-str.length & 3);

  for(let i = 0; i < str.length;) {
    let n = alphabet.indexOf(str[i++]);

    if(n == 0x40) {
      crop++;
    }
    acc = acc << 6 | n;

    if(!(i & 3)) {
      out.push(acc >> 16 & 0xFF, acc >> 8 & 0xFF, acc & 0xFF);
    }
  }
  return new Uint8Array(crop ? out.slice(0, -crop) : out);
}
