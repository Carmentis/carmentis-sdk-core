import {Crypto} from '../crypto/crypto';
import {Utils} from '../utils/utils';
import {ProofDocumentVB} from './ProofDocumentVB';
import * as v from 'valibot';
import {
    ProofSignatureCommitment,
    ProofWrapper,
    ProofWrapperSchema,
} from './types';
import {CBORCryptoBinaryEncoder} from "../crypto/encoder/CryptoEncoderFactory";

const PROOF_VERSION = 1;

export class ProofDocument {
    private encoder = new CBORCryptoBinaryEncoder();
    private wrapper: ProofWrapper;

    constructor() {
        this.wrapper = {
            version: PROOF_VERSION,
            info: {
                title: "Carmentis proof",
                description: "This is a Carmentis proof file. Visit www.carmentis.io for more information.",
                author: "",
                date: (new Date()).toISOString(),
            },
            virtual_blockchains: [],
        };
    }

    static fromObject(proofWrapper: ProofWrapper) {
        v.parse(ProofWrapperSchema, proofWrapper);
        const doc = new ProofDocument();
        doc.wrapper = proofWrapper;
        return doc;
    }

    setTitle(title: string) {
        this.wrapper.info.title = title;
    }

    getTitle() {
        return this.wrapper.info.title;
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

    addVirtualBlockchain(proofDocumentVB: ProofDocumentVB) {
        this.wrapper.virtual_blockchains.push(proofDocumentVB.toObject());
    }

    getSingleVirtualBlockchainOrFail() {
        const virtualBlockchains = this.getVirtualBlockchains();
        if (virtualBlockchains.length == 0) {
            throw new Error(`no virtual blockchain is defined in this proof`);
        }
        if (virtualBlockchains.length > 1) {
            throw new Error(`proofs with multiple virtual blockchains are not supported at this time`);
        }
        return virtualBlockchains[0];
    }

    getVirtualBlockchain(id: string) {
        const virtualBlockchain = this.wrapper.virtual_blockchains.find((vb) => vb.id === id);
        if (!virtualBlockchain) {
            throw new Error(`no virtual blockchain found with ID ${id}`);
        }
        return virtualBlockchain;
    }

    getVirtualBlockchains() {
        return this.wrapper.virtual_blockchains.map((vb) =>
            ProofDocumentVB.fromObject(vb)
        );
    }

    sign(issuedAt: Date = new Date) {
        const digest = this.computeDigest();
        const commitment: ProofSignatureCommitment = {
            issued_at: issuedAt.toISOString(),
            digest_alg: 'sha256',
            digest_target: 'cbor_proof',
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
            alg: 'ecdsa-secp256k1',
            sig,
        };
    }

    verifySignature() {
        const digest = this.computeDigest();
        // TODO: implement signature verification
    }

    computeDigest() {
        const signedContent = {
            info: this.wrapper.info,
            virtual_blockchains: this.wrapper.virtual_blockchains,
        }
        const serializedSignedContent = this.encoder.encode(signedContent);
        const signedContentHash = Crypto.Hashes.sha256AsBinary(serializedSignedContent);
        return signedContentHash;
    }

    getObject(): ProofWrapper {
        return this.wrapper;
    }
}
