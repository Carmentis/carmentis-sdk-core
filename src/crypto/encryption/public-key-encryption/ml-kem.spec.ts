import {MlKemPrivateDecryptionKey} from "./MlKemPrivateDecryptionKey";
import {MlKemPublicEncryptionKey} from "./MlKemPublicEncryptionKey";
import {PublicKeyEncryptionSchemeId} from "./PublicKeyEncryptionSchemeId";
import {AES256GCMSymmetricEncryptionKey} from "../symmetric-encryption/encryption-interface";
import {DecryptionError} from "../../../errors/carmentis-error";

function u8(arr: number[] | number, len?: number): Uint8Array {
  if (typeof arr === 'number') {
    const v = new Uint8Array(arr);
    if (len != null) v.fill(len);
    return v;
  }
  return new Uint8Array(arr);
}

describe("ML-KEM Public/Private Key Encryption", () => {
  it("should generate a private key from a 64-byte seed and provide a matching public key", async () => {
    const seed = u8(64).fill(7);
    const sk = await MlKemPrivateDecryptionKey.genFromSeed(seed);
    const pk = await sk.getPublicKey();

    expect(sk.getSupportedSeedLength()).toEqual([64]);
    expect(pk).toBeInstanceOf(MlKemPublicEncryptionKey);
    expect(await pk.getRawPublicKey()).toBeInstanceOf(Uint8Array);
    expect((await pk.getRawPublicKey()).length).toBeGreaterThan(0);

    // Scheme ID sanity check
    expect(pk.getSchemeId()).toBe(PublicKeyEncryptionSchemeId.ML_KEM_768_AES_256_GCM);
    expect(sk.getScheme().getSchemeId()).toBe(PublicKeyEncryptionSchemeId.ML_KEM_768_AES_256_GCM);
  });

  it("should encrypt with the public key and decrypt with the private key (round-trip)", async () => {
    const seed = u8(64);
    for (let i = 0; i < seed.length; i++) seed[i] = i + 1;

    const sk = await MlKemPrivateDecryptionKey.genFromSeed(seed);
    const pk = await sk.getPublicKey();

    const msg = u8([1, 2, 3, 4, 5, 200, 201, 0, 255]);

    const ct = await pk.encrypt(msg);
    expect(ct).toBeInstanceOf(Uint8Array);
    expect(ct.length).toBeGreaterThan(0);

    const pt = await sk.decrypt(ct);
    expect(pt).toEqual(msg);
  });

  it("should support encrypting and decrypting an empty message", async () => {
    const seed = u8(64).fill(9);
    const sk = await MlKemPrivateDecryptionKey.genFromSeed(seed);
    const pk = await sk.getPublicKey();

    const empty = new Uint8Array(0);
    const ct = await pk.encrypt(empty);
    const pt = await sk.decrypt(ct);

    expect(pt).toEqual(empty);
  });

  it("should fail to decrypt if ciphertext is tampered", async () => {
    const seed = u8(64).fill(4);
    const sk = await MlKemPrivateDecryptionKey.genFromSeed(seed);
    const pk = await sk.getPublicKey();

    const msg = u8([10, 20, 30, 40, 50]);
    const ct = await pk.encrypt(msg);

    // Tamper with the ciphertext bytes (this should break either decapsulation or AES-GCM integrity)
    const tampered = new Uint8Array(ct);
    if (tampered.length > 0) {
      tampered[0] = tampered[0] ^ 0xff;
    }

    await expect(sk.decrypt(tampered)).rejects.toThrow(DecryptionError);
  });

  it("should work for encrypting an AES-256-GCM key (repeated 100 times)", async () => {
      for (let i = 0; i < 100; i++) {
          const key = await AES256GCMSymmetricEncryptionKey.generate();
          const rawKey = key.getRawSecretKey();
          const sk = await MlKemPrivateDecryptionKey.gen();
          const pk = await sk.getPublicKey();
          const ct = await pk.encrypt(rawKey);
          const pt = await sk.decrypt(ct);
          expect(pt).toEqual(rawKey);
      }
  })
});
