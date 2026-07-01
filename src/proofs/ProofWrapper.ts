import * as v from "valibot";
import {
    ProofInfo,
    WrappedProof,
    ProofSignatureCommitment,
    SignedProofPayloadSchema,
} from "../type/valibot/proofs/CarmentisProof"
import { CBORCryptoBinaryEncoder } from "../crypto/encoder/CryptoEncoderFactory";
import { Crypto } from '../crypto/crypto';
import { Utils } from "../utils/utils";

export abstract class ProofWrapper<T extends WrappedProof = WrappedProof> {
    readonly wrapper: T;
    private encoder = new CBORCryptoBinaryEncoder();

    constructor(wrapper: T) {
        this.wrapper = wrapper;
    }

    static getDefaultInfo(version: number): ProofInfo {
        return {
            version,
            chainId: "",
            description: "This is a Carmentis proof file. Visit www.carmentis.io for more information.",
            author: "",
            date: (new Date()).toISOString(),
        }
    }

    getObject() {
        return this.wrapper;
    }

    setVersion(version: number) {
        this.wrapper.info.version = version;
    }

    getVersion() {
        return this.wrapper.info.version;
    }

    setChainId(chainId: string) {
        this.wrapper.info.chainId = chainId;
    }

    getChainId() {
        return this.wrapper.info.chainId;
    }

    setDescription(description: string) {
        this.wrapper.info.description = description;
    }

    getDescription() {
        return this.wrapper.info.description;
    }

    setAuthor(author: string) {
        this.wrapper.info.author = author;
    }

    getAuthor() {
        return this.wrapper.info.author;
    }

    setDate(date: Date) {
        this.wrapper.info.date = date.toISOString();
    }

    getDate() {
        return new Date(this.wrapper.info.date);
    }

    sign(issuedAt: Date = new Date) {
        const digest = this.computeDigest();
        const commitment: ProofSignatureCommitment = {
            issuedAt: issuedAt.toISOString(),
            digestAlg: 'sha256',
            digestTarget: 'cborProof',
            digest: Utils.binaryToHexa(digest),
        };
        const serializedCommitment = this.encoder.encode(commitment);
        const commitmentHash = Crypto.Hashes.sha256AsBinary(serializedCommitment);
        // TODO: implement actual signature
        const sig = '';
        this.wrapper.signature = {
            commitment,
            signer: '',
            pubkey: '',
            alg: 'ecdsaSecp256k1',
            sig,
        };
    }

    verifySignature() {
        const digest = this.computeDigest();
        // TODO: implement signature verification
    }

    computeDigest() {
        const { signature, ...rest } = this.wrapper;
        const signedContent = v.parse(SignedProofPayloadSchema, rest);
        const serializedSignedContent = this.encoder.encode(signedContent);
        return Crypto.Hashes.sha256AsBinary(serializedSignedContent);
    }
}
