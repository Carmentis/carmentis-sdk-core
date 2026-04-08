import {ml_kem768} from "@noble/post-quantum/ml-kem";
import {randomBytes} from "@noble/post-quantum/utils";

export const MLKem = {
  generateKeyPair,
  encapsulate,
  decapsulate
};

function generateKeyPair(seed: any) {
  if(seed == undefined) {
    seed = randomBytes(64);
  }

  const keys = ml_kem768.keygen(seed);

  return keys;
}

function encapsulate(publicKey: any) {
  return ml_kem768.encapsulate(publicKey);
}

function decapsulate(cipherText: any, privateKey: any) {
  return ml_kem768.decapsulate(cipherText, privateKey);
}
