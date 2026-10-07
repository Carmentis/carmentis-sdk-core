import { JsonEncoder } from '../crypto/signature/signer/json/JsonEncoder';
import { JsonCanonicalizationMethod } from "../crypto/signature/signer/json/JsonCanonicalizationMethod";
import { Crypto } from "../crypto/crypto";
import { Hash } from "../entities/Hash";
import { JsonObject } from "../type/valibot/json/Json";
import { OnchainData, OffchainRecord } from '../resolver/ResolverTypes';

export class OffchainDataHandler {
    static extract(object: JsonObject, addSalt: boolean, encoding = "canonical", digestAlg = "sha256"): OffchainRecord {
        let offchainData;

        if (addSalt) {
            const rawSalt = Crypto.Random.getBytes(16);
            const salt = Hash.from(rawSalt).encode();
            offchainData = { __salt__: salt, ...object };
        }
        else {
            offchainData = { ...object };
        }

        // compute the digest
        const digest = OffchainDataHandler.computeDigest(encoding, digestAlg, offchainData);

        const onchainData: OnchainData = {
            digest,
            encoding,
            digestAlg,
        };

        const record: OffchainRecord = {
            onchainData,
            offchainData,
        };
        return record;
    }

    static inject(onchainData: OnchainData, offchainData: JsonObject): JsonObject {
        const { encoding, digestAlg, digest } = onchainData;

        // re-compute the digest from offchainData and check it against the on-chain value
        const computedDigest = OffchainDataHandler.computeDigest(encoding, digestAlg, offchainData);
        if (computedDigest !== digest) {
            throw new Error(`digest of injected offchain data does not match onchain digest (offchain digest = ${computedDigest}, onchain digest = ${digest}), encoding = ${encoding}, digestAlg = ${digestAlg}`);
        }

        // build the object by removing __salt__
        const object = { ...offchainData };
        delete (object as Record<string, unknown>).__salt__;

        return object;
    }

    static computeDigest(encoding: string, digestAlg: string, data: object) {
        let encodedJson: Uint8Array;
        let rawDigest: Uint8Array;

        switch (encoding) {
            case "canonical": {
                encodedJson = JsonEncoder.encode(data, JsonCanonicalizationMethod.JSON_CANONICAL);
                break;
            }
            default: {
                throw new Error(`unsupported encoding method '${encoding}'`);
            }
        }
        switch (digestAlg) {
            case "sha256": {
                rawDigest = Crypto.Hashes.sha256AsBinary(encodedJson);
                break;
            }
            default: {
                throw new Error(`unsupported digest algorithm '${digestAlg}'`);
            }
        }
        const digest = Hash.from(rawDigest).encode();
        return digest;
    }
}
