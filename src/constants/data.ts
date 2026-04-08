export const TYPE_UNKNOWN  = 0x00;
export const TYPE_ARRAY    = 0x01;
export const TYPE_OBJECT   = 0x02;
export const TYPE_STRING   = 0x03;
export const TYPE_NUMBER   = 0x04;
export const TYPE_BOOLEAN  = 0x05;
export const TYPE_NULL     = 0x06;
export const TYPE_UINT8    = 0x07;
export const TYPE_UINT16   = 0x08;
export const TYPE_UINT24   = 0x09;
export const TYPE_UINT32   = 0x0A;
export const TYPE_UINT48   = 0x0B;
export const TYPE_BINARY   = 0x0C;
export const TYPE_BIN256   = 0x0D;
export const TYPE_HASH_STR = 0x0E;

export const TYPE_MAIN     = 0x1F;
export const TYPE_ARRAY_OF = 0x20;

export const TYPE_NAMES = [
  "unknown",
  "array",
  "object",
  "string",
  "number",
  "boolean",
  "null",
  "uint8",
  "uint16",
  "uint24",
  "uint32",
  "uint48",
  "binary",
  "bin256",
  "hashString"
];

export const HASHABLE   = 0x01;
export const MASKABLE   = 0x02;
export const PROPERTIES = 0x03;

export const REDACTED   = 0x04;
export const HASHED     = 0x08;
export const MASKED     = 0x10;
export const FORMAT     = 0x1C;
