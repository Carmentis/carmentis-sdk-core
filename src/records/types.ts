import * as v from 'valibot';
import {uint8array} from "../type/valibot/primitives";

export type JsonData =
    | string
    | number
    | boolean
    | null
    | JsonData[]
    | { [key: string]: JsonData };

export const JsonSchema: v.GenericSchema<JsonData> = v.lazy(() =>
    v.union([
        v.string(),
        v.number(),
        v.boolean(),
        v.null(),
        v.array(JsonSchema),
        v.record(v.string(), JsonSchema),
    ])
);

export type Json = v.InferOutput<typeof JsonSchema>;

const PathSchema = v.array(v.union([ v.string(), v.number() ]));

export type Path = v.InferOutput<typeof PathSchema>;

const MaskPartSchema = v.object({
    start: v.number(),
    end: v.number(),
    replacement: v.string(),
})

export type MaskPart = v.InferOutput<typeof MaskPartSchema>;

export enum TransformationTypeEnum {
    None = 0,
    Hashable = 1,
    Maskable = 2,
}

const TransformationNoneSchema = v.object({
    type: v.literal(TransformationTypeEnum.None),
});

const TransformationHashableSchema = v.object({
    type: v.literal(TransformationTypeEnum.Hashable),
});

const TransformationMaskableSchema = v.object({
    type: v.literal(TransformationTypeEnum.Maskable),
    visibleParts: v.array(v.string()),
    hiddenParts: v.array(v.string()),
});

const TransformationSchema = v.variant(
    'type',
    [
        TransformationNoneSchema,
        TransformationHashableSchema,
        TransformationMaskableSchema,
    ]
);

export enum TypeEnum {
    String = 0,
    Number = 1,
    Boolean = 2,
    Null = 3,
    Array = 4,
    Object = 5,
}

let ItemSchema: v.GenericSchema<any>;

const PrimitiveItemCommonProperties = {
    channelId: v.number(),
};

const StringItemSchema = v.object({
    ...PrimitiveItemCommonProperties,
    type: v.literal(TypeEnum.String),
    value: v.string(),
    transformation: TransformationSchema,
});

export type StringItem = v.InferOutput<typeof StringItemSchema>;

const NumberItemSchema = v.object({
    ...PrimitiveItemCommonProperties,
    type: v.literal(TypeEnum.Number),
    value: v.number(),
});

export type NumberItem = v.InferOutput<typeof NumberItemSchema>;

const BooleanItemSchema = v.object({
    ...PrimitiveItemCommonProperties,
    type: v.literal(TypeEnum.Boolean),
    value: v.boolean(),
});

export type BooleanItem = v.InferOutput<typeof BooleanItemSchema>;

const NullItemSchema = v.object({
    ...PrimitiveItemCommonProperties,
    type: v.literal(TypeEnum.Null),
    value: v.null(),
});

export type NullItem = v.InferOutput<typeof NullItemSchema>;

const ArrayItemSchema = v.object({
    type: v.literal(TypeEnum.Array),
    value: v.array(v.lazy(() => ItemSchema)),
});

const ObjectItemSchema = v.object({
    type: v.literal(TypeEnum.Object),
    value: v.array(
        v.object({
            key: v.string(),
            value: v.lazy(() => ItemSchema)
        })
    ),
});

ItemSchema = v.variant(
    'type',
    [
        StringItemSchema,
        NumberItemSchema,
        BooleanItemSchema,
        NullItemSchema,
        ArrayItemSchema,
        ObjectItemSchema,
    ]
);

export type Item = v.InferOutput<typeof ItemSchema>;

const PrimitiveValueSchema = v.union([
    v.string(),
    v.number(),
    v.boolean(),
    v.null(),
]);

export type PrimitiveValue = v.InferOutput<typeof PrimitiveValueSchema>;

export type FlatItem = {
    path: Path,
    item: Item
};

export const OnChainChannelSchema = v.object({
    pepper: uint8array(),
    data: uint8array(),
});

export type OnChainChannel = v.InferOutput<typeof OnChainChannelSchema>;

export const OnChainItemSchema = v.object({
    path: PathSchema,
    value: PrimitiveValueSchema,
    transformation: v.optional(TransformationSchema),
});

export type OnChainItem = v.InferOutput<typeof OnChainItemSchema>;

export const OnChainItemListSchema = v.array(OnChainItemSchema);

export enum MerkleLeafTypeEnum {
    Public = 0,
    Plain = 1,
    HashableFromValue = 2,
    Hashable = 3,
    MaskableFromAllParts = 4,
    MaskableFromVisibleParts = 5,
    Maskable = 6,
}

const MerkleLeafPublicSchema = v.object({
    type: v.literal(MerkleLeafTypeEnum.Public),
    value: PrimitiveValueSchema,
});

export type MerkleLeafPublic = v.InferOutput<typeof MerkleLeafPublicSchema>;

const MerkleLeafPlainSchema = v.object({
    type: v.literal(MerkleLeafTypeEnum.Plain),
    salt: uint8array(),
    value: PrimitiveValueSchema,
});

export type MerkleLeafPlain = v.InferOutput<typeof MerkleLeafPlainSchema>;

const MerkleLeafHashableFromValueSchema = v.object({
    type: v.literal(MerkleLeafTypeEnum.HashableFromValue),
    salt: uint8array(),
    value: PrimitiveValueSchema,
});

const MerkleLeafHashableSchema = v.object({
    type: v.literal(MerkleLeafTypeEnum.Hashable),
    salt: uint8array(),
    hash: uint8array(),
});

export type MerkleLeafHashable = v.InferOutput<typeof MerkleLeafHashableSchema>;

const MerkleLeafMaskablePartsSchema = v.object({
    salt: uint8array(),
    parts: v.array(v.string()),
});

export type MerkleLeafMaskableParts = v.InferOutput<typeof MerkleLeafMaskablePartsSchema>;

const MerkleLeafMaskableFromAllPartsSchema = v.object({
    type: v.literal(MerkleLeafTypeEnum.MaskableFromAllParts),
    visible: MerkleLeafMaskablePartsSchema,
    hidden: MerkleLeafMaskablePartsSchema,
});

const MerkleLeafMaskableFromVisiblePartsSchema = v.object({
    type: v.literal(MerkleLeafTypeEnum.MaskableFromVisibleParts),
    visible: MerkleLeafMaskablePartsSchema,
    hiddenHash: uint8array(),
});

const MerkleLeafMaskableSchema = v.object({
    type: v.literal(MerkleLeafTypeEnum.Maskable),
    visibleHash: uint8array(),
    hiddenHash: uint8array(),
});

export type MerkleLeafMaskable = v.InferOutput<typeof MerkleLeafMaskableSchema>;

const MerkleLeafDataSchema = v.variant(
    'type',
    [
        MerkleLeafPublicSchema,
        MerkleLeafPlainSchema,
        MerkleLeafHashableFromValueSchema,
        MerkleLeafHashableSchema,
        MerkleLeafMaskableFromAllPartsSchema,
        MerkleLeafMaskableFromVisiblePartsSchema,
        MerkleLeafMaskableSchema,
    ]
);

export type MerkleLeafData = v.InferOutput<typeof MerkleLeafDataSchema>;

export type MerkleLeafCommitment =
    MerkleLeafPublic |
    MerkleLeafPlain |
    MerkleLeafHashable |
    MerkleLeafMaskable;

export enum ProofFieldTypeEnum {
    Public = 0,
    Plain = 1,
    HashableAsPlain = 2,
    HashableAsHash = 3,
    MaskableAsAllParts = 4,
    MaskableAsVisibleParts = 5,
}

const ProofFieldPublicSchema = v.object({
    path: PathSchema,
    type: v.literal(ProofFieldTypeEnum.Public),
    value: PrimitiveValueSchema,
});

const ProofPrivateFieldCommonProperties = {
    path: PathSchema,
    index: v.number(),
};

const ProofFieldPlainSchema = v.object({
    ...ProofPrivateFieldCommonProperties,
    type: v.literal(ProofFieldTypeEnum.Plain),
    salt: v.string(),
    value: PrimitiveValueSchema,
});

const ProofFieldHashableAsPlainSchema = v.object({
    ...ProofPrivateFieldCommonProperties,
    type: v.literal(ProofFieldTypeEnum.HashableAsPlain),
    salt: v.string(),
    value: PrimitiveValueSchema,
});

const ProofFieldHashableAsHashSchema = v.object({
    ...ProofPrivateFieldCommonProperties,
    type: v.literal(ProofFieldTypeEnum.HashableAsHash),
    salt: v.string(),
    hash: v.string(),
});

const ProofFieldMaskableAsAllPartsSchema = v.object({
    ...ProofPrivateFieldCommonProperties,
    type: v.literal(ProofFieldTypeEnum.MaskableAsAllParts),
    v_salt: v.string(),
    v_parts: v.array(v.string()),
    h_salt: v.string(),
    h_parts: v.array(v.string()),
});

const ProofFieldMaskableAsVisiblePartsSchema = v.object({
    ...ProofPrivateFieldCommonProperties,
    type: v.literal(ProofFieldTypeEnum.MaskableAsVisibleParts),
    v_salt: v.string(),
    v_parts: v.array(v.string()),
    h_hash: v.string(),
});

const ProofFieldSchema = v.variant(
    'type',
    [
        ProofFieldPublicSchema,
        ProofFieldPlainSchema,
        ProofFieldHashableAsPlainSchema,
        ProofFieldHashableAsHashSchema,
        ProofFieldMaskableAsAllPartsSchema,
        ProofFieldMaskableAsVisiblePartsSchema,
    ]
);

export type ProofField = v.InferOutput<typeof ProofFieldSchema>;

const ProofInfoSchema = v.object({
    title: v.string(),
    date: v.string(),
    description: v.string(),
    author: v.string(),
});

const ProofChannelSchema = v.object({
    id: v.number(),
    is_public: v.boolean(),
    n_leaves: v.number(),
    fields: v.array(ProofFieldSchema),
    witnesses: v.array(v.string()),
});

export type ProofChannel = v.InferOutput<typeof ProofChannelSchema>;

const ProofMicroblockSchema = v.object({
    height: v.number(),
    channels: v.array(ProofChannelSchema),
});

export type ProofMicroblock = v.InferOutput<typeof ProofMicroblockSchema>;

const ProofVirtualBlockchainSchema = v.object({
    id: v.string(),
    microblocks: v.array(ProofMicroblockSchema),
});

export type ProofVirtualBlockchain = v.InferOutput<typeof ProofVirtualBlockchainSchema>;

const ProofSignatureCommitmentSchema = v.object({
    issued_at: v.optional(v.string()),
    digest_alg: v.optional(v.picklist(['sha256'])),
    digest_target: v.optional(v.picklist(['cbor_proof'])),
    digest: v.optional(v.string()),
});

export type ProofSignatureCommitment = v.InferOutput<typeof ProofSignatureCommitmentSchema>;

const ProofSignatureSchema = v.object({
    commitment: ProofSignatureCommitmentSchema,
    signer: v.string(),
    pubkey: v.string(),
    alg: v.picklist(['ecdsa-secp256k1','ml-dsa-65']),
    sig: v.string(),
});

export const ProofWrapperSchema = v.object({
    version: v.number(),
    info: ProofInfoSchema,
    virtual_blockchains: v.array(ProofVirtualBlockchainSchema),
    signature: v.optional(ProofSignatureSchema),
});

export type ProofWrapper = v.InferOutput<typeof ProofWrapperSchema>;

const TypedPrimitiveValueSchema = v.object({
    disclosure: v.picklist(['plain', 'hashed', 'masked']),
    value: PrimitiveValueSchema
});

export type TypedPrimitiveValue = v.InferOutput<typeof TypedPrimitiveValueSchema>;
