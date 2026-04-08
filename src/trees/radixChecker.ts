import {RADIX_CST} from "./radixConstants";
import {RadixUtils} from "./radixUtils";
import {Crypto} from "../crypto/crypto";
import {Utils} from "../utils/utils";

export const RadixChecker = {
  verifyProof
};

async function verifyProof(key: any, value: any, proof: any) {
  return (await verify(key, value, proof, null, 0)) && Crypto.Hashes.sha256AsBinary(proof[0]);
}

// @ts-expect-error TS(7023): 'verify' implicitly has return type 'any' because ... Remove this comment to see the full error message
async function verify(key: any, value: any, proof: any, nodeHash: any, depth: any) {
  if(depth == RADIX_CST.HASH_SIZE * 2) {
    return Utils.binaryIsEqual(nodeHash, value);
  }

  const node = proof[depth];

  if(depth && !Utils.binaryIsEqual(Crypto.Hashes.sha256AsBinary(node), nodeHash)) {
    return false;
  }

  const msk = node[0] << 8 | node[1];

  if(msk) {
    const hashList = RadixUtils.getHashList(msk, node);
    const nibble = key[depth >> 1] >> 4 * (depth & 1) & 0xF;

    return msk & 1 << nibble ? await verify(key, value, proof, hashList[nibble], depth + 1) : value === false;
  }

  if(RadixUtils.keyDifference(depth, key, node)) {
    return value === false;
  }

  const len = RADIX_CST.HASH_SIZE * 2 + 1 - depth >> 1;

  return Utils.binaryIsEqual(node.slice(2 + len), value);
}
