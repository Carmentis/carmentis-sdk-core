import {gcm} from "@noble/ciphers/aes";
import {Logger} from "../utils/Logger";
import {DecryptionError} from "../errors/carmentis-error";

const logger = Logger.getLogger(["crypto", "aes-gcm"])
export const Aes = {
  encryptGcm,
  decryptGcm
};

function encryptGcm(key: Uint8Array, data: Uint8Array, iv: Uint8Array) {
  const stream = gcm(key, iv);
  const encrypted = stream.encrypt(data);

  return encrypted;
}

function decryptGcm(key: Uint8Array, data: Uint8Array, iv: Uint8Array) {
  try {
    const stream = gcm(key, iv);
    const decrypted = stream.decrypt(data);

    return decrypted;
  }
  catch(e) {
      logger.warn('{e}', {e});
      throw new DecryptionError()
  }
}
