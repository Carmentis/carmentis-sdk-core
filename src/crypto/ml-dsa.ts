import {ml_dsa65} from "@noble/post-quantum/ml-dsa";
import {randomBytes} from "@noble/post-quantum/utils";

export const MLDsa = {
  generateKeyPair,
  sign,
  verify
};

function generateKeyPair(seed: any) {
  if(seed == undefined) {
    seed = randomBytes(32);
  }

  const keys = ml_dsa65.keygen(seed);

  return { publicKey: keys.publicKey, privateKey: keys.secretKey };
}

function sign(privateKey: any, data: any) {
  return ml_dsa65.sign(privateKey, data);
}

function verify(publicKey: any, data: any, signature: any) {
  return ml_dsa65.verify(publicKey, data, signature);
}
