import {Utils} from "../utils/utils";
import {sha256 as H256} from "@noble/hashes/sha2.js";
import {sha512 as H512} from "@noble/hashes/sha512";
import {InternalError} from "../errors/carmentis-error";
import {Logger} from "../utils/Logger";

export const Hashes = {
  sha256AsBinary,
  sha256,
  sha512AsBinary,
  sha512
};
const logger = Logger.getLogger(["utils", "crypto"]);
function sha256AsBinary(data: Uint8Array): Uint8Array {
  const isBinary = data instanceof Uint8Array;
  if(!isBinary) {
    throw new InternalError(`Argument passed to compute sha256 is not an instance of Uint8Array: got ${typeof data}`);
  }
  const hash = H256(data);
  //logger.debug(`Computed sha256 hash for data ${Utils.binaryToHexa(data)} (${data.length} bytes): ${Utils.binaryToHexa(hash)}`);
  return hash;
}

function sha256(data: Uint8Array) {
  return Utils.binaryToHexa(sha256AsBinary(data));
}

function sha512AsBinary(data: any) {
  const isBinary = data instanceof Uint8Array;
  if(!isBinary) {
    throw "Argument passed to compute sha512 is not an instance of Uint8Array";
  }
  return H512(data);
}

function sha512(data: any) {
  return Utils.binaryToHexa(sha512AsBinary(data));
}
