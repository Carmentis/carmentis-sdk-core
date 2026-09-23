import { JsonEncoder } from '../crypto/signature/signer/json/JsonEncoder';
import { JsonCanonicalizationMethod } from "../crypto/signature/signer/json/JsonCanonicalizationMethod";
import { Crypto } from "../crypto/crypto";
import { Hash } from "../entities/Hash";
import { JsonObject } from "../type/valibot/json/Json";
import { OnchainData } from '../resolver/ResolverTypes';

export class OffchainDataHandler {
    static extract(field: JsonObject, encoding = "canonical", digestAlg = "sha256") {
        const rawSalt = Crypto.Random.getBytes(16);
        const salt = Hash.from(rawSalt).encode();
        const offchainData = { __salt__: salt, ...field };
        const digest = OffchainDataHandler.computeDigest(encoding, digestAlg, offchainData);
        const onchainData: OnchainData = {
            digest,
            encoding,
            digestAlg,
        };
        return { onchainData, offchainData };
    }

    static inject(onchainData: OnchainData, offchainData: JsonObject) {
        const { encoding, digestAlg, digest } = onchainData;
        const computedDigest = OffchainDataHandler.computeDigest(encoding, digestAlg, offchainData);
        if (computedDigest !== digest) {
            throw new Error(`digest of injected offchain data does not match onchain digest (offchain digest = ${computedDigest}, onchain digest = ${digest}), encoding = ${encoding}, digestAlg = ${digestAlg}`);
        }
        const data = { ...offchainData };
        delete (data as Record<string, unknown>).__salt__;
        return data;
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
                throw new Error(`unsupported disget algorithm '${digestAlg}'`);
            }
        }
        const digest = Hash.from(rawDigest).encode();
        return digest;
    }
}
