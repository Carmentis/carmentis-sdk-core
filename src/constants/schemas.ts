import * as CHAIN from './chain';
import * as DATA from './data';

export interface SchemaItem {
    name: string;
    type: number;
    size?: number;
    schema?: Schema;
    definition?: SchemaItem[];
    optional?: boolean;
    unspecifiedSchema?: boolean;
}

export interface Schema {
    label: string;
    definition: SchemaItem[];
}

// ============================================================================================================================ //
//  Error                                                                                                                       //
// ============================================================================================================================ //
export const ERROR: Schema = {
    label: 'Error',
    definition: [
        { name: 'type', type: DATA.TYPE_UINT8 },
        { name: 'id',   type: DATA.TYPE_UINT8 },
        { name: 'arg',  type: DATA.TYPE_ARRAY_OF | DATA.TYPE_STRING }
    ]
};

// ============================================================================================================================ //
//  Contract                                                                                                                    //
// ============================================================================================================================ //
export const CONTRACT_PARAMETER_SCHEMA: Schema = {
    label: 'contractParameter',
    definition: [
        { name: 'name',         type: DATA.TYPE_STRING },
        { name: 'type',         type: DATA.TYPE_STRING },
        { name: 'defaultValue', type: DATA.TYPE_STRING },
        { name: 'modifiable',   type: DATA.TYPE_BOOLEAN }
    ]
};

export const CONTRACT_SCHEMA: Schema = {
    label: 'contract',
    definition: [
        { name: 'name',                 type: DATA.TYPE_STRING },
        { name: 'parametersDefinition', type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT, schema: CONTRACT_PARAMETER_SCHEMA }
    ]
};

// ============================================================================================================================ //
//  Record description                                                                                                          //
// ============================================================================================================================ //
const RECORD_ACTOR: Schema = {
    label: 'RecordActor',
    definition: [
        { name: 'name', type: DATA.TYPE_STRING }
    ]
};

const RECORD_CHANNEL: Schema = {
    label: 'RecordChannel',
    definition: [
        { name: 'name',   type: DATA.TYPE_STRING },
        { name: 'public', type: DATA.TYPE_BOOLEAN }
    ]
};

const RECORD_CHANNEL_ASSIGNATION: Schema = {
    label: 'RecordChannelAssignation',
    definition: [
        { name: 'fieldPath',   type: DATA.TYPE_STRING },
        { name: 'channelName', type: DATA.TYPE_STRING }
    ]
};

const RECORD_ACTOR_ASSIGNATION: Schema = {
    label: 'RecordActorAssignation',
    definition: [
        { name: 'actorName',   type: DATA.TYPE_STRING },
        { name: 'channelName', type: DATA.TYPE_STRING }
    ]
};

const RECORD_MASKED_PART: Schema = {
    label: 'RecordMaskedPart',
    definition: [
        { name: 'position',          type: DATA.TYPE_UINT32 },
        { name: 'length',            type: DATA.TYPE_UINT32 },
        { name: 'replacementString', type: DATA.TYPE_STRING }
    ]
};

const RECORD_MASKABLE_FIELD: Schema = {
    label: 'RecordMaskableField',
    definition: [
        { name: 'fieldPath',   type: DATA.TYPE_STRING },
        { name: 'maskedParts', type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT, schema: RECORD_MASKED_PART }
    ]
};

const RECORD_HASHABLE_FIELD: Schema = {
    label: 'RecordHashableField',
    definition: [
        { name: 'fieldPath', type: DATA.TYPE_STRING }
    ]
};

export const RECORD_DESCRIPTION: Schema = {
    label: 'RecordDescription',
    definition: [
        { name: 'applicationId',       type: DATA.TYPE_HASH_STR },
        { name: 'virtualBlockchainId', type: DATA.TYPE_HASH_STR, optional: true },
        { name: 'data',                type: DATA.TYPE_OBJECT, unspecifiedSchema: true },
        { name: 'actors',              type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT, optional: true, schema: RECORD_ACTOR },
        { name: 'channels',            type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT, optional: true, schema: RECORD_CHANNEL },
        { name: 'channelAssignations', type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT, optional: true, schema: RECORD_CHANNEL_ASSIGNATION },
        { name: 'actorAssignations',   type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT, optional: true, schema: RECORD_ACTOR_ASSIGNATION },
        { name: 'hashableFields',      type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT, optional: true, schema: RECORD_HASHABLE_FIELD },
        { name: 'maskableFields',      type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT, optional: true, schema: RECORD_MASKABLE_FIELD },
        { name: 'author',              type: DATA.TYPE_STRING },
        { name: 'endorser',            type: DATA.TYPE_STRING, optional: true },
        { name: 'approvalMessage',     type: DATA.TYPE_STRING, optional: true },
    ]
};

// ============================================================================================================================ //
//  Account                                                                                                                     //
// ============================================================================================================================ //
export const ACCOUNT_STATE: Schema = {
    label: 'AccountState',
    definition: [
        { name: 'height',          type: DATA.TYPE_UINT48 },
        { name: 'balance',         type: DATA.TYPE_UINT48 },
        { name: 'lastHistoryHash', type: DATA.TYPE_BIN256 },
        {
            name: 'locks',
            type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT,
            definition: [
                { name: 'type',       type: DATA.TYPE_UINT8 },
                { name: 'amount',     type: DATA.TYPE_UINT48 },
                { name: 'parameters', type: DATA.TYPE_BINARY }
            ]
        }
    ]
};

export const ACCOUNT_HISTORY: Schema = {
    label: 'AccountHistory',
    definition: [
        { name: 'height',              type: DATA.TYPE_UINT48 },
        { name: 'previousHistoryHash', type: DATA.TYPE_BIN256 },
        { name: 'type',                type: DATA.TYPE_UINT8 },
        { name: 'timestamp',           type: DATA.TYPE_UINT48 },
        { name: 'linkedAccount',       type: DATA.TYPE_BIN256 },
        { name: 'amount',              type: DATA.TYPE_UINT48 },
        { name: 'chainReference',      type: DATA.TYPE_BINARY }
    ]
};

// ============================================================================================================================ //
//  Virtual blockchain state                                                                                                    //
// ============================================================================================================================ //
export const VIRTUAL_BLOCKCHAIN_STATE: Schema = {
    label: 'VirtualBlockchainState',
    definition: [
        { name: 'type',                    type: DATA.TYPE_UINT8 },
        { name: 'expirationDay',           type: DATA.TYPE_UINT32 },
        { name: 'height',                  type: DATA.TYPE_UINT48 },
        { name: 'lastMicroblockHash',      type: DATA.TYPE_BIN256 },
        { name: 'serializedInternalState', type: DATA.TYPE_BINARY }
    ]
};

// ============================================================================================================================ //
//  Protocol VB state                                                                                                           //
// ============================================================================================================================ //
export const PROTOCOL_VARIABLES: Schema = {
    label: 'PROTOCOL_VARIABLES',
    definition: [
        {name: 'protocolVersionName', type: DATA.TYPE_STRING},
        {name: 'protocolVersion', type: DATA.TYPE_UINT16},
        {name: 'feesCalculationVersion', type: DATA.TYPE_UINT16},
        {name: 'globalStateUpdaterVersion', type: DATA.TYPE_UINT16},
        {name: 'applicationLedgerInternalStateUpdaterVersion', type: DATA.TYPE_UINT16},
        {name: 'applicationInternalStateUpdaterVersion', type: DATA.TYPE_UINT16},
        {name: 'organizationInternalStateUpdaterVersion', type: DATA.TYPE_UINT16},
        {name: 'validatorNodeInternalStateUpdaterVersion', type: DATA.TYPE_UINT16},
        {name: 'accountInternalStateUpdaterVersion', type: DATA.TYPE_UINT16},
        {name: 'protocolInternalStateUpdaterVersion', type: DATA.TYPE_UINT16}
    ]
}

export const PROTOCOL_VB_STATE: Schema = {
    label: 'ProtocolVbState',
    definition: [
        { name: 'organizationId', type: DATA.TYPE_BIN256 },
        { name: 'currentProtocolVariables', type: DATA.TYPE_OBJECT, schema: PROTOCOL_VARIABLES },
        {
            name: 'protocolUpdates',
            type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT,
            schema: {
                label: 'PROTOCOL_UPDATE',
                definition: [
                    { name: 'protocolVersion', type: DATA.TYPE_UINT16 },
                    { name: 'changeLog', type: DATA.TYPE_STRING },
                    { name: 'protocolVariables', type: DATA.TYPE_OBJECT, schema: PROTOCOL_VARIABLES },
                    { name: 'protocolVersionName', type: DATA.TYPE_STRING }
                ]
            }
        }
    ]
};

// ============================================================================================================================ //
//  Account VB state                                                                                                            //
// ============================================================================================================================ //
const ACCOUNT_VB_STATE: Schema = {
    label: 'AccountVbState',
    definition: [
        { name: 'signatureSchemeId', type: DATA.TYPE_UINT8 },
        { name: 'publicKeyHeight',   type: DATA.TYPE_UINT48 }
    ]
};

// ============================================================================================================================ //
//  Validator node VB state                                                                                                     //
// ============================================================================================================================ //
const VALIDATOR_NODE_VB_STATE: Schema = {
    label: 'ValidatorNodeVbState',
    definition: [
        { name: 'organizationId',           type: DATA.TYPE_BIN256 },
        { name: 'descriptionHeight',        type: DATA.TYPE_UINT48 },
        { name: 'rpcEndpointHeight',        type: DATA.TYPE_UINT48 },
        { name: 'networkIntegrationHeight', type: DATA.TYPE_UINT48 }
    ]
};

// ============================================================================================================================ //
//  Organization VB state                                                                                                       //
// ============================================================================================================================ //
const ORGANIZATION_VB_STATE: Schema = {
    label: 'OrganizationVbState',
    definition: [
        { name: 'accountId', type: DATA.TYPE_BIN256 },
        { name: 'descriptionHeight', type: DATA.TYPE_UINT48 }
    ]
};

// ============================================================================================================================ //
//  Application VB state                                                                                                        //
// ============================================================================================================================ //
const APPLICATION_VB_STATE: Schema = {
    label: 'ApplicationVbState',
    definition: [
        { name: 'organizationId',    type: DATA.TYPE_BIN256 },
        { name: 'descriptionHeight', type: DATA.TYPE_UINT48 }
    ]
};

// ============================================================================================================================ //
//  Application ledger VB state                                                                                                 //
// ============================================================================================================================ //
const APP_LEDGER_VB_STATE: Schema = {
    label: 'AppLedgerVbState',
    definition: [
        { name: 'allowedSignatureSchemeIds', type: DATA.TYPE_ARRAY_OF | DATA.TYPE_UINT8 },
        { name: 'allowedPkeSchemeIds',       type: DATA.TYPE_ARRAY_OF | DATA.TYPE_UINT8 },
        { name: 'applicationId',             type: DATA.TYPE_BIN256 },
        {
            name: 'channels',
            type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT,
            definition: [
                { name: 'name',      type: DATA.TYPE_STRING },
                { name: 'isPrivate', type: DATA.TYPE_BOOLEAN },
                { name: 'creatorId', type: DATA.TYPE_UINT8 }
            ]
        },
        {
            name: 'actors',
            type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT,
            definition: [
                { name: 'name',               type: DATA.TYPE_STRING },
                { name: 'subscribed',         type: DATA.TYPE_BOOLEAN },
                { name: 'signatureKeyHeight', type: DATA.TYPE_UINT48 },
                { name: 'pkeKeyHeight',       type: DATA.TYPE_UINT48 },
                {
                    name: 'sharedSecrets',
                    type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT,
                    definition: [
                        { name: 'peerActorId', type: DATA.TYPE_UINT8 },
                        { name: 'height',      type: DATA.TYPE_UINT48 }
                    ]
                },
                {
                    name: 'invitations',
                    type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT,
                    definition: [
                        { name: 'channelId', type: DATA.TYPE_UINT8 },
                        { name: 'height',    type: DATA.TYPE_UINT48 }
                    ]
                }
            ]
        }
    ]
};

// ============================================================================================================================ //
//  All VB state schemas                                                                                                        //
// ============================================================================================================================ //
export const VB_STATES: Schema[] = [
    PROTOCOL_VB_STATE,
    ACCOUNT_VB_STATE,
    VALIDATOR_NODE_VB_STATE,
    ORGANIZATION_VB_STATE,
    APPLICATION_VB_STATE,
    APP_LEDGER_VB_STATE
];

// ============================================================================================================================ //
//  Block                                                                                                                       //
// ============================================================================================================================ //
export const BLOCK_INFORMATION = {
    label: 'BlockInformation',
    definition: [
        { name: 'hash', type: DATA.TYPE_BIN256 },
        { name: 'timestamp', type: DATA.TYPE_UINT48 },
        { name: 'proposerAddress', type: DATA.TYPE_BINARY },
        { name: 'size', type: DATA.TYPE_UINT48 },
        { name: 'microblockCount', type: DATA.TYPE_UINT48 }
    ]
};

export const BLOCK_CONTENT = {
    label: 'BlockContent',
    definition: [
        {
            name: 'microblocks',
            type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT,
            definition: [
                { name: 'hash', type: DATA.TYPE_BIN256 },
                { name: 'vbIdentifier', type: DATA.TYPE_BIN256 },
                { name: 'vbType', type: DATA.TYPE_UINT8 },
                { name: 'height', type: DATA.TYPE_UINT48 },
                { name: 'size', type: DATA.TYPE_UINT48 },
                { name: 'sectionCount', type: DATA.TYPE_UINT48 },
            ],
        },
    ],
};

// ============================================================================================================================ //
//  Microblock                                                                                                                  //
// ============================================================================================================================ //
/**
 * TODO: DO NOT USE THIS VARIABLE!!! DECODE THEN EXTRACT INSTEAD OF JUST EXTRACTING
 * @deprecated With CBOR encoding, this value is meaningless
 */
export const MICROBLOCK_HEADER_PREVIOUS_HASH_OFFSET = 13;
/**
 * @deprecated With CBOR encoding, this value is meaningless
 */
export const MICROBLOCK_HEADER_BODY_HASH_OFFSET = 58;
/**
 * @deprecated With CBOR encoding, this value is meaningless
 */
export const MICROBLOCK_HEADER_SIZE = 122;

export const MICROBLOCK_HEADER: Schema = {
    label: 'MicroblockHeader',
    definition: [
        { name: 'magicString',     type: DATA.TYPE_STRING, size: 4 }, // +0
        { name: 'protocolVersion', type: DATA.TYPE_UINT16 },          // +4
        { name: 'microblockType',  type: DATA.TYPE_UINT8 },           // +6
        { name: 'height',          type: DATA.TYPE_UINT48 },          // +7
        { name: 'previousHash',    type: DATA.TYPE_BIN256 },          // +13
        { name: 'timestamp',       type: DATA.TYPE_UINT48 },          // +45
        { name: 'gas',             type: DATA.TYPE_UINT24 },          // +51
        { name: 'gasPrice',        type: DATA.TYPE_UINT32 },          // +54
        { name: 'bodyHash',        type: DATA.TYPE_BIN256 },          // + 58
        { name: 'feesPayerAccount', type: DATA.TYPE_BIN256 },         // + 90
    ]
};

export const MICROBLOCK_SECTION: Schema = {
    label: 'MicroblockSection',
    definition: [
        { name: 'type', type: DATA.TYPE_UINT8 },
        { name: 'data', type: DATA.TYPE_BINARY }
    ]
};

export const MICROBLOCK_BODY: Schema = {
    label: 'MicroblockBody',
    definition: [
        { name: 'body', type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT, schema: MICROBLOCK_SECTION }
    ]
};

export const MICROBLOCK_VB_INFORMATION: Schema = {
    label: 'MicroblockVbInformation',
    definition: [
        { name: 'virtualBlockchainType', type: DATA.TYPE_UINT8 },
        { name: 'virtualBlockchainId',   type: DATA.TYPE_BIN256 }
    ]
};

// ============================================================================================================================ //
//  Node messages                                                                                                               //
// ============================================================================================================================ //
export const MSG_ERROR                          = 0x00;
export const MSG_GET_CHAIN_INFORMATION          = 0x01;
export const MSG_CHAIN_INFORMATION              = 0x02;
export const MSG_GET_BLOCK_INFORMATION          = 0x03;
export const MSG_BLOCK_INFORMATION              = 0x04;
export const MSG_GET_BLOCK_CONTENT              = 0x05;
export const MSG_BLOCK_CONTENT                  = 0x06;
export const MSG_GET_VIRTUAL_BLOCKCHAIN_STATE   = 0x07;
export const MSG_VIRTUAL_BLOCKCHAIN_STATE       = 0x08;
export const MSG_GET_VIRTUAL_BLOCKCHAIN_UPDATE  = 0x09;
export const MSG_VIRTUAL_BLOCKCHAIN_UPDATE      = 0x0A;
export const MSG_GET_MICROBLOCK_INFORMATION     = 0x0B;
export const MSG_MICROBLOCK_INFORMATION         = 0x0C;
export const MSG_AWAIT_MICROBLOCK_ANCHORING     = 0x0D;
export const MSG_MICROBLOCK_ANCHORING           = 0x0E;
export const MSG_GET_MICROBLOCK_BODYS           = 0x0F;
export const MSG_MICROBLOCK_BODYS               = 0x10;
export const MSG_GET_ACCOUNT_STATE              = 0x11;
export const MSG_ACCOUNT_STATE                  = 0x12;
export const MSG_GET_ACCOUNT_HISTORY            = 0x13;
export const MSG_ACCOUNT_HISTORY                = 0x14;
export const MSG_GET_ACCOUNT_BY_PUBLIC_KEY_HASH = 0x15;
export const MSG_ACCOUNT_BY_PUBLIC_KEY_HASH     = 0x16;
export const MSG_GET_VALIDATOR_NODE_BY_ADDRESS  = 0x17;
export const MSG_VALIDATOR_NODE_BY_ADDRESS      = 0x18;
export const MSG_GET_OBJECT_LIST                = 0x19;
export const MSG_OBJECT_LIST                    = 0x1A;
export const MSG_GET_GENESIS_SNAPSHOT           = 0x1B;
export const MSG_GENESIS_SNAPSHOT               = 0x1C;

export const NODE_MESSAGES: Schema[] = [] as const;

NODE_MESSAGES[MSG_ERROR] = {
    label: 'MessageError',
    definition: [
        { name: 'error', type: DATA.TYPE_STRING }
    ]
};

NODE_MESSAGES[MSG_GET_CHAIN_INFORMATION] = {
    label: 'MessageGetChainInformation',
    definition: []
};

NODE_MESSAGES[MSG_CHAIN_INFORMATION] = {
    label: 'MessageChainInformation',
    definition: [
        { name: 'height', type: DATA.TYPE_UINT48 },
        { name: 'lastBlockTimestamp', type: DATA.TYPE_UINT48 },
        { name: 'microblockCount', type: DATA.TYPE_UINT48 },
        { name: 'objectCounts', type: DATA.TYPE_ARRAY_OF | DATA.TYPE_UINT48, size: CHAIN.N_VIRTUAL_BLOCKCHAINS }
    ]
};

NODE_MESSAGES[MSG_GET_BLOCK_INFORMATION] = {
    label: 'MessageGetBlockInformation',
    definition: [
        { name: 'height', type: DATA.TYPE_UINT48 }
    ]
};

NODE_MESSAGES[MSG_BLOCK_INFORMATION] = {
    label: 'MessageBlockInformation',
    definition: BLOCK_INFORMATION.definition
};

NODE_MESSAGES[MSG_GET_BLOCK_CONTENT] = {
    label: 'MessageGetBlockContent',
    definition: [
        { name: 'height', type: DATA.TYPE_UINT48 }
    ]
};

NODE_MESSAGES[MSG_BLOCK_CONTENT] = {
    label: 'MessageBlockContent',
    definition: BLOCK_CONTENT.definition
};

NODE_MESSAGES[MSG_GET_VIRTUAL_BLOCKCHAIN_STATE] = {
    label: 'MessageGetVirtualBlockchainState',
    definition: [
        { name: 'virtualBlockchainId', type: DATA.TYPE_BIN256 }
    ]
};

NODE_MESSAGES[MSG_VIRTUAL_BLOCKCHAIN_STATE] = {
    label: 'MessageVirtualBlockchainState',
    definition: [
        { name: 'stateData', type: DATA.TYPE_BINARY }
    ]
};

NODE_MESSAGES[MSG_GET_VIRTUAL_BLOCKCHAIN_UPDATE] = {
    label: 'MessageGetVirtualBlockchainUpdate',
    definition: [
        { name: 'virtualBlockchainId', type: DATA.TYPE_BIN256 },
        { name: 'knownHeight',         type: DATA.TYPE_UINT48 }
    ]
};

NODE_MESSAGES[MSG_VIRTUAL_BLOCKCHAIN_UPDATE] = {
    label: 'MessageVirtualBlockchainUpdate',
    definition: [
        { name: 'exists',    type: DATA.TYPE_BOOLEAN },
        { name: 'changed',   type: DATA.TYPE_BOOLEAN },
        { name: 'stateData', type: DATA.TYPE_BINARY },
        { name: 'headers',   type: DATA.TYPE_ARRAY_OF | DATA.TYPE_BINARY }
    ]
};

NODE_MESSAGES[MSG_GET_MICROBLOCK_INFORMATION] = {
    label: 'MessageGetMicroblockInformation',
    definition: [
        { name: 'hash', type: DATA.TYPE_BIN256 }
    ]
};

NODE_MESSAGES[MSG_MICROBLOCK_INFORMATION] = {
    label: 'MessageMicroblockInformation',
    definition: [
        { name: 'virtualBlockchainType', type: DATA.TYPE_UINT8 },
        { name: 'virtualBlockchainId',   type: DATA.TYPE_BIN256 },
        { name: 'header',                type: DATA.TYPE_BINARY }
    ]
};

NODE_MESSAGES[MSG_AWAIT_MICROBLOCK_ANCHORING] = {
    label: 'MessageAwaitMicroblockAnchoring',
    definition: [
        { name: 'hash', type: DATA.TYPE_BIN256 }
    ]
};

NODE_MESSAGES[MSG_MICROBLOCK_ANCHORING] = {
    label: 'MessageMicroblockAnchoring',
    definition: MICROBLOCK_VB_INFORMATION.definition
};

NODE_MESSAGES[MSG_GET_MICROBLOCK_BODYS] = {
    label: 'MessageGetMicroblockBodys',
    definition: [
        { name: 'hashes', type: DATA.TYPE_ARRAY_OF | DATA.TYPE_BIN256 }
    ]
};

NODE_MESSAGES[MSG_MICROBLOCK_BODYS] = {
    label: 'MessageMicroblockBodys',
    definition: [
        {
            name: 'list',
            type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT,
            definition: [
                { name: 'hash', type: DATA.TYPE_BIN256 },
                { name: 'body', type: DATA.TYPE_BINARY }
            ]
        }
    ]
};

NODE_MESSAGES[MSG_GET_ACCOUNT_STATE] = {
    label: 'MessageGetAccountState',
    definition: [
        { name: 'accountHash', type: DATA.TYPE_BIN256 }
    ]
};

NODE_MESSAGES[MSG_ACCOUNT_STATE] = {
    label: 'MessageAccountState',
    definition: ACCOUNT_STATE.definition
};

NODE_MESSAGES[MSG_GET_ACCOUNT_HISTORY] = {
    label: 'MessageGetAccountHistory',
    definition: [
        { name: 'accountHash',     type: DATA.TYPE_BIN256 },
        { name: 'lastHistoryHash', type: DATA.TYPE_BIN256 },
        { name: 'maxRecords',      type: DATA.TYPE_UINT16 }
    ]
};

NODE_MESSAGES[MSG_ACCOUNT_HISTORY] = {
    label: 'MessageAccountHistory',
    definition: [
        {
            name: 'list',
            type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT,
            schema: ACCOUNT_HISTORY
        }
    ]
};

NODE_MESSAGES[MSG_GET_ACCOUNT_BY_PUBLIC_KEY_HASH] = {
    label: 'MessageGetAccountByPublicKeyHash',
    definition: [
        { name: 'publicKeyHash', type: DATA.TYPE_BIN256 }
    ]
};

NODE_MESSAGES[MSG_ACCOUNT_BY_PUBLIC_KEY_HASH] = {
    label: 'MessageAccountByPublicKeyHash',
    definition: [
        { name: 'accountHash', type: DATA.TYPE_BIN256 }
    ]
};

NODE_MESSAGES[MSG_GET_VALIDATOR_NODE_BY_ADDRESS] = {
    label: 'MessageGetValidatorNodeByAddress',
    definition: [
        { name: 'address', type: DATA.TYPE_BINARY }
    ]
};

NODE_MESSAGES[MSG_VALIDATOR_NODE_BY_ADDRESS] = {
    label: 'MessageValidatorNodeByAddress',
    definition: [
        { name: 'validatorNodeHash', type: DATA.TYPE_BIN256 }
    ]
};

NODE_MESSAGES[MSG_GET_OBJECT_LIST] = {
    label: 'MessageGetObjectList',
    definition: [
        { name: 'type', type: DATA.TYPE_UINT8 }
    ]
};

NODE_MESSAGES[MSG_OBJECT_LIST] = {
    label: 'MessageObjectList',
    definition: [
        { name: 'list', type: DATA.TYPE_ARRAY_OF | DATA.TYPE_BIN256 }
    ]
};

NODE_MESSAGES[MSG_GET_GENESIS_SNAPSHOT] = {
    label: 'MessageGetGenesisSnapshot',
    definition: []
};

NODE_MESSAGES[MSG_GENESIS_SNAPSHOT] = {
    label: 'MessageGenesisSnapshot',
    definition: [
        { name: 'base64EncodedChunks', type: DATA.TYPE_ARRAY_OF | DATA.TYPE_STRING },
    ]
};

// ============================================================================================================================ //
//  Wallet interface                                                                                                            //
// ============================================================================================================================ //
const WI_MAX_SERVER_URL_LENGTH = 100;

export const WI_QR_CODE: Schema = {
    label: 'WiQrCode',
    definition: [
        { name: 'qrId',      type: DATA.TYPE_BIN256 },
        { name: 'timestamp', type: DATA.TYPE_UINT48 },
        { name: 'serverUrl', type: DATA.TYPE_STRING, size: WI_MAX_SERVER_URL_LENGTH }
    ]
};

// client -> server
export const WIMSG_REQUEST             = 0x00;

// server -> client
export const WIMSG_UPDATE_QR           = 0x01;
export const WIMSG_CONNECTION_TOKEN    = 0x02;
export const WIMSG_FORWARDED_ANSWER    = 0x03;

// wallet -> server
export const WIMSG_GET_CONNECTION_INFO = 0x04;
export const WIMSG_ANSWER              = 0x05;

// server -> wallet
export const WIMSG_CONNECTION_INFO     = 0x06;
export const WIMSG_CONNECTION_ACCEPTED = 0x07;
export const WIMSG_FORWARDED_REQUEST   = 0x08;

export const WI_MESSAGES: Schema[] = [] as const;

WI_MESSAGES[WIMSG_REQUEST] = {
    label: 'WiMsgRequest',
    definition: [
        { name: 'requestType', type: DATA.TYPE_UINT8 },
        { name: 'request',     type: DATA.TYPE_BINARY },
        { name: 'deviceId',    type: DATA.TYPE_BIN256 },
        { name: 'withToken',   type: DATA.TYPE_UINT8 },
        //{ name: 'token',       type: DATA.TYPE_BIN256 }
    ]
};

WI_MESSAGES[WIMSG_UPDATE_QR] = {
    label: 'WiMsgUpdateQr',
    definition: [
        { name: 'qrId',      type: DATA.TYPE_BIN256 },
        { name: 'timestamp', type: DATA.TYPE_UINT48 }
    ]
};

WI_MESSAGES[WIMSG_CONNECTION_TOKEN] = {
    label: 'WiMsgConnectionToken',
    definition: [
        { name: 'token', type: DATA.TYPE_BIN256 }
    ]
};

WI_MESSAGES[WIMSG_FORWARDED_ANSWER] = {
    label: 'WiMsgForwardedAnswer',
    definition: [
        { name: 'answerType', type: DATA.TYPE_UINT8 },
        { name: 'answer',     type: DATA.TYPE_BINARY }
    ]
};

WI_MESSAGES[WIMSG_GET_CONNECTION_INFO] = {
    label: 'WiMsgGetConnectionInfo',
    definition: [
        { name: 'qrId', type: DATA.TYPE_BIN256 }
    ]
};

WI_MESSAGES[WIMSG_ANSWER] = {
    label: 'WiMsgAnswer',
    definition: [
        { name: 'answerType', type: DATA.TYPE_UINT8 },
        { name: 'answer',     type: DATA.TYPE_BINARY }
    ]
};

WI_MESSAGES[WIMSG_CONNECTION_INFO] = {
    label: 'WiMsgConnectionInfo',
    definition: []
};

WI_MESSAGES[WIMSG_CONNECTION_ACCEPTED] = {
    label: 'WiMsgConnectionAccepted',
    definition: [
        { name: 'qrId', type: DATA.TYPE_BIN256 }
    ]
};

WI_MESSAGES[WIMSG_FORWARDED_REQUEST] = {
    label: 'WiMsgForwardedRequest',
    definition: [
        { name: 'requestType', type: DATA.TYPE_UINT8 },
        { name: 'request',     type: DATA.TYPE_BINARY }
    ]
};
/*
export const WIRQ_AUTH_BY_PUBLIC_KEY = 0x00;
export const WIRQ_DATA_APPROVAL      = 0x01;
export const WIRQ_GET_EMAIL          = 0x02;
export const WIRQ_GET_USER_DATA      = 0x03;

export const WI_REQUESTS: Schema[] = [] as const;

WI_REQUESTS[WIRQ_AUTH_BY_PUBLIC_KEY] = {
  label: 'WiRqAuthByPublicKey',
  definition: [
    { name: 'challenge', type: DATA.TYPE_BIN256 }
  ]
};

WI_REQUESTS[WIRQ_GET_EMAIL] = {
  label: 'WiRqGetEmail',
  definition: []
};

WI_REQUESTS[WIRQ_GET_USER_DATA] = {
  label: 'WiRqGetUserData',
  definition: [
    { name: 'requiredData', type: DATA.TYPE_ARRAY_OF | DATA.TYPE_STRING }
  ]
};

WI_REQUESTS[WIRQ_DATA_APPROVAL] = {
  label: 'WiRqDataApproval',
  definition: [
    { name: 'anchorRequestId', type: DATA.TYPE_BINARY },
    { name: 'serverUrl', type: DATA.TYPE_STRING }
  ]
};

export const WI_ANSWERS: Schema[] = [] as const;

WI_ANSWERS[WIRQ_AUTH_BY_PUBLIC_KEY] = {
  label: 'WiRqAuthByPublicKey',
  definition: [
    { name: 'publicKey', type: DATA.TYPE_STRING },
    { name: 'signature', type: DATA.TYPE_STRING }
  ]
};

WI_ANSWERS[WIRQ_GET_EMAIL] = {
  label: 'WiRqGetEmail',
  definition: [
    { name: 'email', type: DATA.TYPE_STRING }
  ]
};

WI_ANSWERS[WIRQ_DATA_APPROVAL] = {
  label: 'WiRqDataApproval',
  definition: [
    { name: 'vbHash', type: DATA.TYPE_BINARY },
    { name: 'mbHash', type: DATA.TYPE_BINARY },
    { name: 'height', type: DATA.TYPE_UINT48 }
  ]
};

WI_ANSWERS[WIRQ_GET_USER_DATA] = {
  label: 'WiRqGetUserData',
  definition: [
    { name: 'userData', type: DATA.TYPE_ARRAY_OF | DATA.TYPE_STRING }
  ]
};

 */

// ============================================================================================================================ //
//  Wallet <-> operator network messages                                                                                        //
// ============================================================================================================================ //
/*
export const MSG_ANS_ERROR              = 0x00;
export const MSG_APPROVAL_HANDSHAKE     = 0x01;
export const MSG_ACTOR_KEY              = 0x02;
export const MSG_APPROVAL_SIGNATURE     = 0x03;
export const MSG_ANS_ACTOR_KEY_REQUIRED = 0x04;
export const MSG_ANS_APPROVAL_DATA      = 0x05;
export const MSG_ANS_APPROVAL_SIGNATURE = 0x06;

export const WALLET_OP_MESSAGES: Schema[] = [] as const;

WALLET_OP_MESSAGES[MSG_ANS_ERROR] = {
  label: 'MessageAnswerError',
  definition: [
    { name: 'error', type: DATA.TYPE_OBJECT, schema: ERROR }
  ]
};

WALLET_OP_MESSAGES[MSG_APPROVAL_HANDSHAKE] = {
  label: 'MessageApprovalHandshake',
  definition: [
    { name: 'anchorRequestId', type: DATA.TYPE_BINARY }
  ]
};

WALLET_OP_MESSAGES[MSG_ACTOR_KEY] = {
  label: 'MessageActorKey',
  definition: [
    { name: 'anchorRequestId',   type: DATA.TYPE_BINARY },
    { name: 'actorSignaturePublicKey', type: DATA.TYPE_STRING },
    { name: 'actorPkePublicKey', type: DATA.TYPE_STRING },
  ]
};

WALLET_OP_MESSAGES[MSG_APPROVAL_SIGNATURE] = {
  label: 'MessageApprovalSignature',
  definition: [
    { name: 'anchorRequestId',    type: DATA.TYPE_BINARY },
    { name: 'signature', type: DATA.TYPE_BINARY }
  ]
};

WALLET_OP_MESSAGES[MSG_ANS_ACTOR_KEY_REQUIRED] = {
  label: 'MessageAnswerActorKeyRequired',
  definition: [
    { name: 'genesisSeed', type: DATA.TYPE_BINARY }
  ]
};

WALLET_OP_MESSAGES[MSG_ANS_APPROVAL_DATA] = {
  label: 'MessageAnswerApprovalData',
  definition: [
    { name: 'data', type: DATA.TYPE_BINARY }
  ]
};

WALLET_OP_MESSAGES[MSG_ANS_APPROVAL_SIGNATURE] = {
  label: 'MessageAnswerApprovalSignature',
  definition: [
    { name: 'vbHash', type: DATA.TYPE_BINARY },
    { name: 'mbHash', type: DATA.TYPE_BINARY },
    { name: 'height', type: DATA.TYPE_NUMBER }
  ]
};

 */

// ============================================================================================================================ //
//  All schemas are summarized here for automated translation to interfaces                                                     //
// ============================================================================================================================ //
export const ALL_SCHEMAS = {
    singles: [
        RECORD_ACTOR,
        RECORD_CHANNEL,
        RECORD_CHANNEL_ASSIGNATION,
        RECORD_ACTOR_ASSIGNATION,
        RECORD_MASKED_PART,
        RECORD_MASKABLE_FIELD,
        RECORD_HASHABLE_FIELD,
        RECORD_DESCRIPTION,

        MICROBLOCK_HEADER,
        MICROBLOCK_SECTION,
        MICROBLOCK_BODY,
        MICROBLOCK_VB_INFORMATION,

        WI_QR_CODE
    ],
    collections: [
        { label: 'VbState', list: VB_STATES },
        { label: 'NodeMessage', list: NODE_MESSAGES },
        { label: 'WiMessage', list: WI_MESSAGES },
        //{ label: 'WiRequest', list: WI_REQUESTS },
        //{ label: 'WiAnswer', list: WI_ANSWERS },
        //{ label: 'WalletOpMessage', list: WALLET_OP_MESSAGES }
    ]
};
