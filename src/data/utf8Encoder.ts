const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const Utf8Encoder = {
  encode,
  decode
};

function encode(str: any) {
  return encoder.encode(str);
}

function decode(array: any) {
  return decoder.decode(array);
}
