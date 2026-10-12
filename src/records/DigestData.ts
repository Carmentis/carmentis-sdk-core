import { JsonEncoder } from '../crypto/signature/signer/json/JsonEncoder';
import { JsonCanonicalizationMethod } from "../crypto/signature/signer/json/JsonCanonicalizationMethod";
import { Crypto } from "../crypto/crypto";
import { Hash } from "../entities/Hash";
import { JsonObject } from "../type/valibot/json/Json";
import { OnchainData, DigestRecord } from '../resolver/ResolverTypes';

/**
 * A utility class for handling digest operations on JSON data, including creating and verifying digests.
 * This class supports adding salts, canonical encoding, and hashing with configurable algorithms.
 */
export class DigestDataHandler {
    static jsonToDigestData(object: JsonObject, addSalt: boolean, encoding = "canonical", digestAlg = "sha256"): DigestRecord {
        let digestData;

        if (addSalt) {
            const rawSalt = Crypto.Random.getBytes(16);
            const salt = Hash.from(rawSalt).encode();
            digestData = { __salt__: salt, ...object };
        }
        else {
            digestData = { ...object };
        }

        // compute the digest
        const digest = DigestDataHandler.computeDigest(encoding, digestAlg, digestData);

        const onchainData: OnchainData = {
            digest,
            type: "json",
            encoding,
            digestAlg,
        };

        const record: DigestRecord = {
            onchainData,
            digestData,
        };
        return record;
    }

    static jsonFromDigestData(onchainData: OnchainData, digestData: JsonObject): JsonObject {
        const { encoding, digestAlg, digest } = onchainData;

        // re-compute the digest from digestData and check it against the on-chain value
        const computedDigest = DigestDataHandler.computeDigest(encoding, digestAlg, digestData);
        if (computedDigest !== digest) {
            throw new Error(`digest of injected data does not match onchain digest (external data digest = ${computedDigest}, onchain digest = ${digest}), encoding = ${encoding}, digestAlg = ${digestAlg}`);
        }

        // build the object by removing __salt__
        const object = { ...digestData };
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
