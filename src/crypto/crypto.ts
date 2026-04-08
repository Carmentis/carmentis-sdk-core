import {Random} from "./random";
import {Hashes} from "./hashes";
import {Aes} from "./aes";
import {MLDsa} from "./ml-dsa";
import {MLKem} from "./ml-kem";
import {Secp256k1} from "./secp256k1";

const SIG_SCHEME_IDS = {
  SECP256K1: 0,
  ML_DSA: 1
};

const SIG_SCHEMES = [
  { name: "SECP256K1", signatureSectionSize: 65 },
  { name: "ML_DSA", signatureSectionSize: 3311 }
];

const KEM_SCHEME_IDS = {
  ML_KEM: 0
};

const KEM_SCHEMES = [
  { name: "ML-KEM" }
];

export const Crypto = {
  ...SIG_SCHEME_IDS,
  SIG_SCHEMES,
  ...KEM_SCHEME_IDS,
  KEM_SCHEMES,
  Random,
  Hashes,
  Aes,
  MLDsa,
  MLKem,
  Secp256k1
};
