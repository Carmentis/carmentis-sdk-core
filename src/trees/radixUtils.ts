import {RADIX_CST} from "./radixConstants";

export const RadixUtils = {
  keyDifference,
  getHashList
};

/**
  Tests whether the trailing key stored in an early leaf node is different from the key that's being processed.
*/
function keyDifference(depth: any, key: any, node: any) {
  for(let n = depth; n < RADIX_CST.HASH_SIZE * 2; n++) {
    if((key[n >> 1] ^ node[2 + (n >> 1) - (depth >> 1)]) >> 4 * (n & 1) & 0xF) {
      return 1;
    }
  }
  return 0;
}

/**
  Extracts all hashes stored in a standard node and return them as a list. Empty slots are filled with null.
*/
function getHashList(msk: any, node: any) {
  const hashList = [];
  let ptr = 2;

  for(let i = 0; i < 16; i++) {
    hashList.push(msk & 1 << i ? node.slice(ptr, ptr += RADIX_CST.HASH_SIZE) : null);
  }

  return hashList;
}
