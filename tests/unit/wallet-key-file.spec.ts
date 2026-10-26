import {describe, expect, it} from 'vitest';
import {WalletKeyFileService} from '../../src/wallet/export/WalletKeyFileService';
import {WalletKeyFileBuilder} from '../../src/wallet/export/WalletKeyFileBuilder';
import {KeyFileEncryptionSchemeRegistry} from '../../src/wallet/export/KeyFileEncryptionSchemeRegistry';
import {Argon2idAes256GcmV1Scheme} from '../../src/wallet/export/Argon2idAes256GcmV1Scheme';
import {KeyFileEncryptionScheme} from '../../src/wallet/export/KeyFileEncryptionScheme';
import {ExportedWalletMapper} from '../../src/wallet/export/ExportedWalletMapper';
import {KeyFileCodec} from '../../src/wallet/export/KeyFileCodec';
import {KeyType} from '../../src/type/valibot/walletExport/WalletExportSchema';
import {WalletCrypto} from '../../src/wallet/WalletCrypto';
import {SignatureSchemeId} from '../../src/crypto/signature/SignatureSchemeId';
import {DecryptionError, WalletKeyFileError} from '../../src/errors/carmentis-error';
import {encode} from 'cbor-x';
import {AES256GCMSymmetricEncryptionKey} from '../../src/crypto/encryption/symmetric-encryption/encryption-interface';
import {Argon2id} from '../../src/crypto/kdf/Argon2id';

const FAST = {t: 1, m: 64, p: 1};
const PASSWORD = 'correct horse battery staple';

function service() {
    return new WalletKeyFileService(new KeyFileEncryptionSchemeRegistry(new Argon2idAes256GcmV1Scheme(FAST)));
}

function builder() {
    return new WalletKeyFileBuilder()
        .addWallet({
            name: 'seed-wallet',
            privateKey: ExportedWalletMapper.seedKeyFromWallet(WalletCrypto.generateWallet(), SignatureSchemeId.SECP256K1),
            actorPassphrase: 'actor passphrase',
            connectivity: {networkName: 'testnet', nodeEndpoint: 'https://node.example', rpcEndpoint: 'https://node.example/rpc'},
        })
        .addWallet({
            name: 'jwk-wallet',
            privateKey: {keyType: KeyType.JWK, jwk: {kty: 'OKP', crv: 'Ed25519', d: 'x', x: 'y'}},
            actorPassphrase: 'other passphrase',
        });
}

describe('wallet key file', () => {
    it('round-trips a list of wallets', async () => {
        const payload = builder().build();
        const file = await service().export(payload, PASSWORD);
        const imported = await service().import(file, PASSWORD);
        expect(imported).toEqual(payload);
        expect(imported.wallets).toHaveLength(2);
        expect(imported.wallets[1].connectivity).toBeUndefined();
    });

    it('round-trips through base64', async () => {
        const payload = builder().build();
        const text = await service().exportToBase64(payload, PASSWORD);
        expect(await service().importFromBase64(text, PASSWORD)).toEqual(payload);
    });

    it('restores a seed key into a signature key', async () => {
        const wallet = WalletCrypto.generateWallet();
        const key = ExportedWalletMapper.seedKeyFromWallet(wallet, SignatureSchemeId.SECP256K1);
        const restored = await ExportedWalletMapper.toPrivateSignatureKey(key);
        expect(restored).toBeDefined();
    });

    it('does not contain secrets in clear and differs between exports', async () => {
        const payload = builder().build();
        const a = await service().export(payload, PASSWORD);
        const b = await service().export(payload, PASSWORD);
        expect(a).not.toEqual(b);
        expect(Buffer.from(a).includes(Buffer.from('actor passphrase'))).toBe(false);
    });

    it('rejects a wrong password', async () => {
        const file = await service().export(builder(), PASSWORD);
        await expect(service().import(file, 'wrong')).rejects.toBeInstanceOf(DecryptionError);
    });

    it('rejects an empty password', async () => {
        await expect(service().export(builder(), '')).rejects.toThrow();
    });

    it('rejects a tampered ciphertext', async () => {
        const codec = new KeyFileCodec();
        const envelope = codec.decodeEnvelope(await service().export(builder(), PASSWORD));
        const ciphertext = Uint8Array.from(envelope.ciphertext);
        ciphertext[ciphertext.length - 1] ^= 1;
        const tampered = codec.encodeEnvelope({...envelope, ciphertext});
        await expect(service().import(tampered, PASSWORD)).rejects.toBeInstanceOf(DecryptionError);
    });

    it('rejects altered KDF parameters (header is authenticated)', async () => {
        const codec = new KeyFileCodec();
        const envelope = codec.decodeEnvelope(await service().export(builder(), PASSWORD));
        const encryption = {...envelope.encryption, kdf: {...(envelope.encryption as any).kdf, t: 2}};
        const tampered = codec.encodeEnvelope({...envelope, encryption});
        await expect(service().import(tampered, PASSWORD)).rejects.toBeInstanceOf(DecryptionError);
    });

    it('rejects hostile KDF parameters before deriving', async () => {
        const codec = new KeyFileCodec();
        const envelope = codec.decodeEnvelope(await service().export(builder(), PASSWORD));
        const encryption = {...envelope.encryption, kdf: {...(envelope.encryption as any).kdf, m: 2 ** 30}};
        const tampered = codec.encodeEnvelope({...envelope, encryption});
        await expect(service().import(tampered, PASSWORD)).rejects.toBeInstanceOf(WalletKeyFileError);
    });

    it('rejects unsupported format versions and unknown schemes', async () => {
        const codec = new KeyFileCodec();
        const envelope = codec.decodeEnvelope(await service().export(builder(), PASSWORD));
        const v2 = Uint8Array.from(encode({...envelope, formatVersion: 2}));
        await expect(service().import(v2, PASSWORD)).rejects.toThrow(/unsupported format version/);

        const unknown = codec.encodeEnvelope({...envelope, encryption: {...envelope.encryption, scheme: 'nope'}});
        await expect(service().import(unknown, PASSWORD)).rejects.toThrow(/unsupported encryption scheme/);
    });

    it('rejects an unknown key type and duplicate or empty lists', () => {
        expect(() => new WalletKeyFileBuilder().addWallet({
            name: 'x', actorPassphrase: 'p', privateKey: {keyType: 'rsa'} as any,
        })).toThrow();
        expect(() => builder().addWallet({
            name: 'seed-wallet', actorPassphrase: 'p', privateKey: {keyType: KeyType.JWK, jwk: {kty: 'EC'}},
        })).toThrow(/duplicate/);
        expect(() => new WalletKeyFileBuilder().build()).toThrow();
    });

    it('reads files of an older scheme once a new default is registered', async () => {
        const v2: KeyFileEncryptionScheme<any> = {
            getSchemeId: () => 'fake-v2',
            getParamsSchema: () => (new Argon2idAes256GcmV1Scheme(FAST).getParamsSchema() as any),
            generateParams: () => ({scheme: 'fake-v2'}),
            encrypt: async (_p, plaintext) => plaintext,
            decrypt: async (_p, ciphertext) => ciphertext,
        };
        const v1 = new Argon2idAes256GcmV1Scheme(FAST);
        const oldFile = await service().export(builder(), PASSWORD);

        const registry = new KeyFileEncryptionSchemeRegistry(v1).register(v2, true);
        expect(registry.getDefault().getSchemeId()).toBe('fake-v2');
        const evolved = new WalletKeyFileService(registry);
        expect((await evolved.import(oldFile, PASSWORD)).wallets).toHaveLength(2);
        expect(registry.get('argon2id-aes256gcm-v1')).toBe(v1);
    });
});

describe('Argon2id and AAD', () => {
    it('is deterministic for same inputs and varies with salt', () => {
        const kdf = new Argon2id(FAST);
        const salt = new Uint8Array(16).fill(1);
        const a = kdf.deriveKey('pw', salt, 32);
        expect(a).toEqual(kdf.deriveKey('pw', salt, 32));
        expect(a).not.toEqual(kdf.deriveKey('pw', new Uint8Array(16).fill(2), 32));
    });

    it('authenticates associated data and stays compatible without it', async () => {
        const key = AES256GCMSymmetricEncryptionKey.createFromBytes(new Uint8Array(32).fill(7));
        const data = new Uint8Array([1, 2, 3]);
        const aad = new Uint8Array([9]);
        expect(await key.decrypt(await key.encrypt(data, aad), aad)).toEqual(data);
        await expect(key.decrypt(await key.encrypt(data, aad), new Uint8Array([8]))).rejects.toThrow();
        expect(await key.decrypt(await key.encrypt(data))).toEqual(data);
    });
});
