import {Crypto} from '../crypto/crypto';
import {Utils} from '../utils/utils';
import {SaltShaker} from './SaltShaker';
import {
    Path,
    Item,
    PrimitiveValue,
    TypedPrimitiveValue,
    MerkleLeafTypeEnum,
    MerkleLeafData,
    MerkleLeafMaskableParts,
    MerkleLeafCommitment,
    ProofFieldTypeEnum,
    ProofField,
} from './types';
import {CBORCryptoBinaryEncoder} from "../crypto/encoder/CryptoEncoderFactory";

export class MerkleLeaf {
    private internalData: MerkleLeafData | undefined = undefined;
    private encoder = new CBORCryptoBinaryEncoder();

    static fromProofFormat(field: ProofField) {
        const merkleLeaf = new MerkleLeaf();
        merkleLeaf.fromProofField(field);
        return merkleLeaf;
    }

    static fromItemWithPublicData(item: Item) {
        const merkleLeaf = new MerkleLeaf();
        merkleLeaf.setPublicDataFromValue(item.value);
        return merkleLeaf;
    }

    static fromItemWithPlainData(saltShaker: SaltShaker, item: Item) {
        const merkleLeaf = new MerkleLeaf();
        const salt = saltShaker.getSalt();
        merkleLeaf.setPlainDataFromValue(salt, item.value);
        return merkleLeaf;
    }

    static fromItemWithHashedData(saltShaker: SaltShaker, item: Item) {
        const merkleLeaf = new MerkleLeaf();
        const salt = saltShaker.getSalt();
        merkleLeaf.setHashedDataFromValue(salt, item.value);
        return merkleLeaf;
    }

    static fromItemWithMaskedData(saltShaker: SaltShaker, item: Item) {
        const merkleLeaf = new MerkleLeaf();
        const visibleSalt = saltShaker.getSalt();
        const hiddenSalt = saltShaker.getSalt();

        merkleLeaf.setMaskedDataFromAllParts(
            visibleSalt,
            item.transformation.visibleParts,
            hiddenSalt,
            item.transformation.hiddenParts,
        );
        return merkleLeaf;
    }

    private setPublicDataFromValue(value: PrimitiveValue) {
        this.internalData = {
            type: MerkleLeafTypeEnum.Public,
            value,
        };
    }

    private setPlainDataFromValue(salt: Uint8Array, value: PrimitiveValue) {
        this.internalData = {
            type: MerkleLeafTypeEnum.Plain,
            salt,
            value,
        };
    }

    private setHashedDataFromValue(salt: Uint8Array, value: PrimitiveValue) {
        this.internalData = {
            type: MerkleLeafTypeEnum.HashableFromValue,
            salt,
            value,
        };
    }

    private setHashedDataFromHash(salt: Uint8Array, hash: Uint8Array) {
        this.internalData = {
            type: MerkleLeafTypeEnum.Hashable,
            salt,
            hash,
        };
    }

    private setMaskedDataFromAllParts(visibleSalt: Uint8Array, visibleParts: string[], hiddenSalt: Uint8Array, hiddenParts: string[]) {
        const visible: MerkleLeafMaskableParts = {
            salt: visibleSalt,
            parts: visibleParts,
        };
        const hidden: MerkleLeafMaskableParts = {
            salt: hiddenSalt,
            parts: hiddenParts,
        };
        this.internalData = {
            type: MerkleLeafTypeEnum.MaskableFromAllParts,
            visible,
            hidden,
        }
    }

    private setMaskedDataFromVisibleParts(visibleSalt: Uint8Array, visibleParts: string[], hiddenHash: Uint8Array) {
        const visible: MerkleLeafMaskableParts = {
            salt: visibleSalt,
            parts: visibleParts,
        };
        this.internalData = {
            type: MerkleLeafTypeEnum.MaskableFromVisibleParts,
            visible,
            hiddenHash,
        }
    }

    setToHashed() {
        const data = this.getInternalData();
        if (data.type == MerkleLeafTypeEnum.Hashable) {
            // the field is already hashed -> ignore
            return;
        }
        if (data.type != MerkleLeafTypeEnum.HashableFromValue) {
            throw new Error('this field is not hashable');
        }
        const serializedValue = this.encoder.encode(data.value);
        const hash = Crypto.Hashes.sha256AsBinary(serializedValue);
        this.setHashedDataFromHash(data.salt, hash);
    }

    setToMasked() {
        const data = this.getInternalData();
        if (data.type == MerkleLeafTypeEnum.MaskableFromVisibleParts) {
            // the field is already masked -> ignore
            return;
        }
        if (data.type != MerkleLeafTypeEnum.MaskableFromAllParts) {
            throw new Error('this field is not maskable');
        }
        const serializedHidden = this.encoder.encode(data.hidden);
        const hiddenHash = Crypto.Hashes.sha256AsBinary(serializedHidden);
        this.setMaskedDataFromVisibleParts(data.visible.salt, data.visible.parts, hiddenHash);
    }

    private getInternalData(): MerkleLeafData {
        if (this.internalData === undefined) {
            throw new Error(`internal leaf data has not been set`);
        }
        return this.internalData;
    }

    private fromProofField(field: ProofField) {
        switch (field.type) {
            case ProofFieldTypeEnum.Public: {
                this.setPublicDataFromValue(
                    field.value
                );
                break;
            }
            case ProofFieldTypeEnum.Plain: {
                this.setPlainDataFromValue(
                    Utils.binaryFromHexa(field.salt),
                    field.value
                );
                break;
            }
            case ProofFieldTypeEnum.HashableAsPlain: {
                this.setHashedDataFromValue(
                    Utils.binaryFromHexa(field.salt),
                    field.value
                );
                break;
            }
            case ProofFieldTypeEnum.HashableAsHash: {
                this.setHashedDataFromHash(
                    Utils.binaryFromHexa(field.salt),
                    Utils.binaryFromHexa(field.hash)
                );
                break;
            }
            case ProofFieldTypeEnum.MaskableAsAllParts: {
                this.setMaskedDataFromAllParts(
                    Utils.binaryFromHexa(field.v_salt),
                    field.v_parts,
                    Utils.binaryFromHexa(field.h_salt),
                    field.h_parts
                );
                break;
            }
            case ProofFieldTypeEnum.MaskableAsVisibleParts: {
                this.setMaskedDataFromVisibleParts(
                    Utils.binaryFromHexa(field.v_salt),
                    field.v_parts,
                    Utils.binaryFromHexa(field.h_hash)
                );
                break;
            }
        }
    }

    toProofFormat(path: Path, index: number): ProofField {
        const data = this.getInternalData();

        switch (data.type) {
            case MerkleLeafTypeEnum.Public: {
                return {
                    path,
                    type: ProofFieldTypeEnum.Public,
                    value: data.value,
                }
            }
            case MerkleLeafTypeEnum.Plain: {
                return {
                    path,
                    index,
                    type: ProofFieldTypeEnum.Plain,
                    salt: Utils.binaryToHexa(data.salt),
                    value: data.value,
                }
            }
            case MerkleLeafTypeEnum.HashableFromValue: {
                return {
                    path,
                    index,
                    type: ProofFieldTypeEnum.HashableAsPlain,
                    salt: Utils.binaryToHexa(data.salt),
                    value: data.value,
                };
            }
            case MerkleLeafTypeEnum.Hashable: {
                return {
                    path,
                    index,
                    type: ProofFieldTypeEnum.HashableAsHash,
                    salt: Utils.binaryToHexa(data.salt),
                    hash: Utils.binaryToHexa(data.hash),
                };
            }
            case MerkleLeafTypeEnum.MaskableFromAllParts: {
                return {
                    path,
                    index,
                    type: ProofFieldTypeEnum.MaskableAsAllParts,
                    v_salt: Utils.binaryToHexa(data.visible.salt),
                    v_parts: data.visible.parts,
                    h_salt: Utils.binaryToHexa(data.hidden.salt),
                    h_parts: data.hidden.parts,
                };
            }
            case MerkleLeafTypeEnum.MaskableFromVisibleParts: {
                return {
                    path,
                    index,
                    type: ProofFieldTypeEnum.MaskableAsVisibleParts,
                    v_salt: Utils.binaryToHexa(data.visible.salt),
                    v_parts: data.visible.parts,
                    h_hash: Utils.binaryToHexa(data.hiddenHash),
                };
            }
            default: {
                throw new Error(`invalid internal data type ${data.type}`);
            }
        }
    }

    private getCommitmentData(): MerkleLeafCommitment {
        const data = this.getInternalData();

        switch (data.type) {
            case MerkleLeafTypeEnum.Public:
            case MerkleLeafTypeEnum.Plain:
            case MerkleLeafTypeEnum.Hashable: {
                return data;
            }
            case MerkleLeafTypeEnum.HashableFromValue: {
                const serializedValue = this.encoder.encode(data.value);
                const hash = Crypto.Hashes.sha256AsBinary(serializedValue);

                return {
                    type: MerkleLeafTypeEnum.Hashable,
                    salt: data.salt,
                    hash,
                };
            }
            case MerkleLeafTypeEnum.MaskableFromAllParts: {
                const serializedVisible =this.encoder.encode(data.visible);
                const visibleHash = Crypto.Hashes.sha256AsBinary(serializedVisible);
                const serializedHidden =this.encoder.encode(data.hidden);
                const hiddenHash = Crypto.Hashes.sha256AsBinary(serializedHidden);

                return {
                    type: MerkleLeafTypeEnum.Maskable,
                    visibleHash,
                    hiddenHash,
                };
            }
            case MerkleLeafTypeEnum.MaskableFromVisibleParts: {
                const serializedVisible =this.encoder.encode(data.visible);
                const visibleHash = Crypto.Hashes.sha256AsBinary(serializedVisible);

                return {
                    type: MerkleLeafTypeEnum.Maskable,
                    visibleHash,
                    hiddenHash: data.hiddenHash,
                };
            }
            default: {
                throw new Error(`invalid internal data type ${data.type}`);
            }
        }
    }

    getHash() {
        const commitmentData = this.getCommitmentData();
        const encodedCommitmentData = this.encoder.encode(commitmentData);
        const hash = Crypto.Hashes.sha256AsBinary(encodedCommitmentData);
        return hash;
    }

    getRawValue(): PrimitiveValue {
        const data = this.getInternalData();

        switch (data.type) {
            case MerkleLeafTypeEnum.Public:
            case MerkleLeafTypeEnum.Plain:
            case MerkleLeafTypeEnum.HashableFromValue: {
                return data.value;
            }
            case MerkleLeafTypeEnum.Hashable: {
                return Utils.binaryToHexa(data.hash);
            }
            case MerkleLeafTypeEnum.MaskableFromAllParts: {
                return data.visible.parts.map((s, i) =>
                    i & 1 ? data.hidden.parts[i >> 1] : s
                ).join('');
            }
            case MerkleLeafTypeEnum.MaskableFromVisibleParts: {
                return data.visible.parts.join('');
            }
            default: {
                throw new Error(`invalid internal data type ${data.type}`);
            }
        }
    }

    getTypedValue(): TypedPrimitiveValue {
        const data = this.getInternalData();
        const value = this.getRawValue();

        switch (data.type) {
            case MerkleLeafTypeEnum.Public:
            case MerkleLeafTypeEnum.Plain:
            case MerkleLeafTypeEnum.HashableFromValue:
            case MerkleLeafTypeEnum.MaskableFromAllParts: {
                return { disclosure: 'plain', value };
            }
            case MerkleLeafTypeEnum.Hashable: {
                return { disclosure: 'hashed', value };
            }
            case MerkleLeafTypeEnum.MaskableFromVisibleParts: {
                return { disclosure: 'masked', value };
            }
            default: {
                throw new Error(`invalid internal data type ${data.type}`);
            }
        }
    }
}
