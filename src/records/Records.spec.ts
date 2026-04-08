import * as fs from 'fs';
import {Utils} from '../utils/utils';
import {Record} from "./Record";
import {RecordByChannels} from "./RecordByChannels";
import {MerkleRecord} from "./MerkleRecord";
import {ProofRecord} from "./ProofRecord";
import {OnChainRecord} from "./OnChainRecord";
import {ProofDocument} from "./ProofDocument";
import {ProofDocumentVB} from "./ProofDocumentVB";
import { describe, it, expect } from 'vitest'

const initialJson = {
    "publicField": "This is public",
    "array0": [ { "thisIsARepeatedKey": 0 }, { "thisIsARepeatedKey": 1 }, { "thisIsARepeatedKey": 2 } ],
    "array1": [ "thisIsARepeatedValue", "thisIsARepeatedValue", "thisIsARepeatedValue" ],
    "firstname": "John",
    "lastname": "Doo",
    "email": "john.doe@gmail.com",
    "null": null,
    "object": {
        "foo": 123,
        "bar": [ 456, "hello" ]
    }
};

const finalJson = {
    "array0": [ {"thisIsARepeatedKey": 0 }, { "thisIsARepeatedKey": 1 }, { "thisIsARepeatedKey": 2 } ],
    "array1": [ "thisIsARepeatedValue", "thisIsARepeatedValue", "thisIsARepeatedValue" ],
    "email": "j***@g***",
    "null": null,
    "object":{
        "foo": 123,
        "bar": [ null, "CB835593E4FA3633CC971FCBD1EB080CA322258220548EB7087BEAF8EF6D7FF4" ]
    },
    "publicField": "This is public"
};

describe('Record', () => {
    it('Testing record classes', async () => {
        // build a Record from a primitive type
        const jsonObject0 = 12345;
        const record0 = Record.fromObject(jsonObject0);

        // build a Record with a hashable field and a maskable field
        const record1 = Record.fromObject(initialJson);
        record1.setChannel("this.*", 1);
        record1.setChannel("this.publicField", 2);
        record1.setChannelAsPublic(2);
        record1.setAsHashable("this.object.bar[1]");
        record1.setMaskByRegex("this.email", /^(.)(.*)(@.)(.*)$/, '$1***$3***');

        // build a RecordByChannels from this Record
        const recordByChannels1 = RecordByChannels.fromRecord(record1);

        // build a MerkleRecord from this RecordByChannels
        const merkleRecord = MerkleRecord.fromRecordByChannels(recordByChannels1);

        // build an OnChainRecord from this MerkleRecord
        const onChainRecord = OnChainRecord.fromMerkleRecord(merkleRecord);
        const onChainData = onChainRecord.getOnChainData(1);
        const onChainRootHashAsHex = Utils.binaryToHexa(onChainData.merkleRootHash);
        expect(onChainRootHashAsHex).not.toEqual("0".repeat(64));
        const onChainPublicData = onChainRecord.getOnChainData(2);
        const onChainPublicRootHashAsHex = Utils.binaryToHexa(onChainPublicData.merkleRootHash);
        expect(onChainPublicRootHashAsHex).toEqual("0".repeat(64));

        // rebuild a MerkleRecord from the on-chain data
        // and then a ProofRecord from this MerkleRecord
        const rebuiltOnChainRecord = new OnChainRecord;
        rebuiltOnChainRecord.addOnChainData(1, onChainData.isPublic, onChainData.merkleRootHash, onChainData.data);
        const rebuiltMerkleRecord = rebuiltOnChainRecord.toMerkleRecord();
        const rebuiltProofRecord = ProofRecord.fromMerkleRecord(rebuiltMerkleRecord);
        const rebuiltProofRootHashAsHex = rebuiltProofRecord.getRootHashAsHexString(1);
        expect(rebuiltProofRootHashAsHex).toEqual(onChainRootHashAsHex);

        // build a 1st proof from the Merkle record
        // remove 'firstname', set 'object.bar[1]' as hashed and 'email' as masked
        const proofRecord0 = ProofRecord.fromMerkleRecord(merkleRecord);
        proofRecord0.removeField([ "firstname" ]);
        proofRecord0.setFieldToHashed([ "object", "bar", 1 ]);
        proofRecord0.setFieldToMasked([ "email" ]);
        const proofRootHashAsHex0 = proofRecord0.getRootHashAsHexString(1);
        expect(proofRootHashAsHex0).toEqual(onChainRootHashAsHex);
        const proofChannels0 = proofRecord0.toProofChannels();

        // build a ProofDocument from proofChannels0 and export it to an object
        // then attempt to build a new ProofDocument with and without an expected error
        const proofDocumentVB = new ProofDocumentVB();
        proofDocumentVB.setIdentifier(Utils.binaryToHexa(Utils.getNullHash()));
        proofDocumentVB.addMicroblock(1, proofChannels0);
        const proofDocument = new ProofDocument();
        proofDocument.addVirtualBlockchain(proofDocumentVB);
        proofDocument.sign();
        const proofDocumentObject = proofDocument.getObject();
        console.log(JSON.stringify(proofDocumentObject, null, 2));
        expect(() => ProofDocument.fromObject(proofDocumentObject)).not.toThrow();
        delete (proofDocumentObject as any).info.author;
        expect(() => ProofDocument.fromObject(proofDocumentObject)).toThrow();

        // build a 2nd proof from the 1st proof
        const proofRecord1 = ProofRecord.fromProofChannels(proofChannels0);
        const proofRootHashAsHex1 = proofRecord1.getRootHashAsHexString(1);
        expect(proofRootHashAsHex1).toEqual(onChainRootHashAsHex);

        // remove 'lastname'
        proofRecord1.removeField([ "lastname" ]);
        const proofChannels1 = proofRecord1.toProofChannels();

        // build a 3rd proof from the 2nd proof
        const proofRecord2 = ProofRecord.fromProofChannels(proofChannels1);
        const proofRootHashAsHex2 = proofRecord2.getRootHashAsHexString(1);
        expect(proofRootHashAsHex2).toEqual(onChainRootHashAsHex);

        // build a 4th proof from the 2nd proof
        // remove 'object.bar[0]'
        const proofRecord3 = ProofRecord.fromProofChannels(proofChannels1);
        proofRecord3.removeField([ "object", "bar", 0 ]);
        const proofRootHashAsHex3 = proofRecord3.getRootHashAsHexString(1);
        expect(proofRootHashAsHex3).toEqual(onChainRootHashAsHex);
        const recoveredFinalJson = proofRecord3.toJson();
        expect(JSON.stringify(recoveredFinalJson)).toEqual(JSON.stringify(finalJson));
    });
})
