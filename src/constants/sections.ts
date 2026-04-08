import * as DATA from './data';
import {PROTOCOL_VARIABLES, Schema} from './schemas';
import {SectionType} from '../type/valibot/blockchain/section/SectionType';

// ============================================================================================================================ //
//  Constraints                                                                                                                 //
// ============================================================================================================================ //
/*
export const ZERO         = 0;
export const ONE          = 1;
export const AT_LEAST_ONE = 2;
export const AT_MOST_ONE  = 3;
export const ANY          = 4;

export const CONSTRAINT_NAMES = [
  'no sections',
  'exactly one section',
  'at least one section',
  'at most one section',
  'any number of sections'
];

 */

export const SIGNATURE     = SectionType.SIGNATURE;
export const SIGNATURE_SCHEMA = {
    label: 'SIGNATURE',
    definition: [
        { name: 'schemeId', type: DATA.TYPE_UINT8 },
        { name: 'signature', type: DATA.TYPE_BINARY }
    ]
};

// ============================================================================================================================ //
//  Protocol                                                                                                                    //
// ============================================================================================================================ //
export const PROTOCOL_CREATION      = SectionType.PROTOCOL_CREATION;
export const PROTOCOL_UPDATE = SectionType.PROTOCOL_UPDATE;
const PROTOCOL: Schema[] = [] as const;

PROTOCOL[PROTOCOL_CREATION] = {
  label: 'PROTOCOL_CREATION',
  definition: [
      { name: 'organizationId', type: DATA.TYPE_BIN256 },
  ]
};



PROTOCOL[PROTOCOL_UPDATE] = {
  label: 'PROTOCOL_VARIABLES_UPDATE',
  definition: [
      {name: 'protocolVersion', type: DATA.TYPE_UINT16},
      {name: 'protocolVersionName', type: DATA.TYPE_STRING},
      {name: 'changeLog', type: DATA.TYPE_STRING},
      {name: 'protocolVariables', type: DATA.TYPE_OBJECT, schema: PROTOCOL_VARIABLES }
  ]
};
// ============================================================================================================================ //
//  Account                                                                                                                     //
// ============================================================================================================================ //
//export const ACCOUNT_SIG_SCHEME        = SectionType.ACCOUNT_SIG_SCHEME;
export const ACCOUNT_PUBLIC_KEY        = SectionType.ACCOUNT_PUBLIC_KEY;
export const ACCOUNT_TOKEN_ISSUANCE    = SectionType.ACCOUNT_TOKEN_ISSUANCE;
export const ACCOUNT_CREATION          = SectionType.ACCOUNT_CREATION;
export const ACCOUNT_TRANSFER          = SectionType.ACCOUNT_TRANSFER;
export const ACCOUNT_VESTING_TRANSFER  = SectionType.ACCOUNT_VESTING_TRANSFER;
export const ACCOUNT_ESCROW_TRANSFER   = SectionType.ACCOUNT_ESCROW_TRANSFER;
export const ACCOUNT_ESCROW_SETTLEMENT = SectionType.ACCOUNT_ESCROW_SETTLEMENT;
export const ACCOUNT_STAKE             = SectionType.ACCOUNT_STAKE;

const ACCOUNT: Schema[] = [] as const;
/*
ACCOUNT[ACCOUNT_SIG_SCHEME] = {
  label: 'ACCOUNT_SIG_SCHEME',
  definition: [
    { name: 'schemeId', type: DATA.TYPE_UINT8 }
  ]
};
 */

ACCOUNT[ACCOUNT_PUBLIC_KEY] = {
  label: 'ACCOUNT_PUBLIC_KEY',
  definition: [
    { name: 'publicKey', type: DATA.TYPE_BINARY },
      { name: 'schemeId', type: DATA.TYPE_UINT8 }
  ]
};

ACCOUNT[ACCOUNT_TOKEN_ISSUANCE] = {
  label: 'ACCOUNT_TOKEN_ISSUANCE',
  definition: [
    { name: 'amount', type: DATA.TYPE_UINT48 }
  ]
};

ACCOUNT[ACCOUNT_CREATION] = {
  label: 'ACCOUNT_CREATION',
  definition: [
    { name: 'sellerAccount', type: DATA.TYPE_BIN256 },
    { name: 'amount',        type: DATA.TYPE_UINT48 }
  ]
};

ACCOUNT[ACCOUNT_TRANSFER] = {
  label: 'ACCOUNT_TRANSFER',
  definition: [
    { name: 'account',          type: DATA.TYPE_BIN256 },
    { name: 'amount',           type: DATA.TYPE_UINT48 },
    { name: 'publicReference',  type: DATA.TYPE_STRING },
    { name: 'privateReference', type: DATA.TYPE_STRING }
  ]
};

ACCOUNT[ACCOUNT_VESTING_TRANSFER] = {
  label: 'ACCOUNT_VESTING_TRANSFER',
  definition: [
    { name: 'account',             type: DATA.TYPE_BIN256 },
    { name: 'amount',              type: DATA.TYPE_UINT48 },
    { name: 'publicReference',     type: DATA.TYPE_STRING },
    { name: 'privateReference',    type: DATA.TYPE_STRING },
    { name: 'cliffDurationDays',   type: DATA.TYPE_UINT16 },
    { name: 'vestingDurationDays', type: DATA.TYPE_UINT16 }
  ]
};

ACCOUNT[ACCOUNT_ESCROW_TRANSFER] = {
  label: 'ACCOUNT_ESCROW_TRANSFER',
  definition: [
    { name: 'account',          type: DATA.TYPE_BIN256 },
    { name: 'amount',           type: DATA.TYPE_UINT48 },
    { name: 'publicReference',  type: DATA.TYPE_STRING },
    { name: 'privateReference', type: DATA.TYPE_STRING },
    { name: 'escrowIdentifier', type: DATA.TYPE_BIN256 },
    { name: 'agentAccount',     type: DATA.TYPE_BIN256 },
    { name: 'durationDays',     type: DATA.TYPE_UINT16 }
  ]
};

ACCOUNT[ACCOUNT_ESCROW_SETTLEMENT] = {
  label: 'ACCOUNT_ESCROW_SETTLEMENT',
  definition: [
    { name: 'confirmed',        type: DATA.TYPE_BOOLEAN },
    { name: 'escrowIdentifier', type: DATA.TYPE_BIN256 }
  ]
};

ACCOUNT[ACCOUNT_STAKE] = {
  label: 'ACCOUNT_STAKE',
  definition: [
    { name: 'amount',           type: DATA.TYPE_UINT48 },
    { name: 'objectType',       type: DATA.TYPE_UINT8 },
    { name: 'objectIdentifier', type: DATA.TYPE_BIN256 }
  ]
};

// ============================================================================================================================ //
//  Validator node                                                                                                              //
// ============================================================================================================================ //
export const VN_CREATION         = SectionType.VN_CREATION;
export const VN_COMETBFT_PUBLIC_KEY_DECLARATION         = SectionType.VN_COMETBFT_PUBLIC_KEY_DECLARATION;
export const VN_RPC_ENDPOINT        = SectionType.VN_RPC_ENDPOINT;
export const VN_APPROVAL = SectionType.VN_APPROVAL;
const VALIDATOR_NODE: Schema[] = [] as const;

VALIDATOR_NODE[VN_CREATION] = {
  label: 'VN_CREATION',
  definition: [
    { name: 'organizationId', type: DATA.TYPE_BIN256 }
  ]
};

VALIDATOR_NODE[VN_COMETBFT_PUBLIC_KEY_DECLARATION] = {
  label: 'VN_COMETBFT_PUBLIC_KEY_DECLARATION',
  definition: [
    { name: 'cometPublicKeyType', type: DATA.TYPE_STRING },
    { name: 'cometPublicKey',     type: DATA.TYPE_STRING }
  ]
};

VALIDATOR_NODE[VN_RPC_ENDPOINT] = {
  label: 'VN_RPC_ENDPOINT',
  definition: [
    { name: 'rpcEndpoint', type: DATA.TYPE_STRING }
  ]
};

VALIDATOR_NODE[VN_APPROVAL] = {
  label: 'VN_APPROVAL',
  definition: [
    { name: 'status', type: DATA.TYPE_BOOLEAN }
  ]
};

// ============================================================================================================================ //
//  Organization                                                                                                                //
// ============================================================================================================================ //
export const ORG_CREATION    = SectionType.ORG_CREATION;
export const ORG_DESCRIPTION   = SectionType.ORG_DESCRIPTION;

const ORGANIZATION: Schema[] = [] as const;

ORGANIZATION[ORG_CREATION] = {
  label: 'ORG_CREATION',
  definition: [
      { name: 'accountId', type: DATA.TYPE_BIN256 },
  ]
};

ORGANIZATION[ORG_DESCRIPTION] = {
  label: 'ORG_DESCRIPTION',
  definition: [
    { name: 'name',        type: DATA.TYPE_STRING },
    { name: 'city',        type: DATA.TYPE_STRING },
    { name: 'countryCode', type: DATA.TYPE_STRING, size: 2 },
    { name: 'website',     type: DATA.TYPE_STRING }
  ]
};


// ============================================================================================================================ //
//  Application                                                                                                                 //
// ============================================================================================================================ //

export const APP_CREATION = SectionType.APP_CREATION;
export const APP_DESCRIPTION = SectionType.APP_DESCRIPTION;
const APPLICATION: Schema[] = [] as const;


APPLICATION[APP_CREATION] = {
  label: 'APP_CREATION',
  definition: [
    { name: 'organizationId', type: DATA.TYPE_BIN256 }
  ]
};

APPLICATION[APP_DESCRIPTION] = {
  label: 'APP_DESCRIPTION',
  definition: [
    { name: 'name',        type: DATA.TYPE_STRING },
    { name: 'logoUrl',     type: DATA.TYPE_STRING },
    { name: 'homepageUrl', type: DATA.TYPE_STRING },
    { name: 'description', type: DATA.TYPE_STRING }
  ]
};


// ============================================================================================================================ //
//  Application ledger                                                                                                          //
// ============================================================================================================================ //
export const APP_LEDGER_ALLOWED_SIG_SCHEMES  = SectionType.APP_LEDGER_ALLOWED_SIG_SCHEMES;
export const APP_LEDGER_ALLOWED_PKE_SCHEMES  = SectionType.APP_LEDGER_ALLOWED_PKE_SCHEMES;
export const APP_LEDGER_CREATION          = SectionType.APP_LEDGER_CREATION;
export const APP_LEDGER_ACTOR_CREATION       = SectionType.APP_LEDGER_ACTOR_CREATION;
export const APP_LEDGER_CHANNEL_CREATION     = SectionType.APP_LEDGER_CHANNEL_CREATION;
export const APP_LEDGER_SHARED_SECRET        = SectionType.APP_LEDGER_SHARED_SECRET;
export const APP_LEDGER_CHANNEL_INVITATION   = SectionType.APP_LEDGER_CHANNEL_INVITATION;
export const APP_LEDGER_ACTOR_SUBSCRIPTION   = SectionType.APP_LEDGER_ACTOR_SUBSCRIPTION;
export const APP_LEDGER_PUBLIC_CHANNEL_DATA  = SectionType.APP_LEDGER_PUBLIC_CHANNEL_DATA;
export const APP_LEDGER_PRIVATE_CHANNEL_DATA = SectionType.APP_LEDGER_PRIVATE_CHANNEL_DATA;
export const APP_LEDGER_AUTHOR               = SectionType.APP_LEDGER_AUTHOR;
export const APP_LEDGER_ENDORSEMENT_REQUEST  = SectionType.APP_LEDGER_ENDORSEMENT_REQUEST;

const APP_LEDGER: Schema[] = [] as const;

APP_LEDGER[APP_LEDGER_ALLOWED_SIG_SCHEMES] = {
  label: 'APP_LEDGER_ALLOWED_SIG_SCHEMES',
  definition: [
    { name: 'schemeIds', type: DATA.TYPE_ARRAY_OF | DATA.TYPE_UINT8 }
  ]
};

APP_LEDGER[APP_LEDGER_ALLOWED_PKE_SCHEMES] = {
  label: 'APP_LEDGER_ALLOWED_PKE_SCHEMES',
  definition: [
    { name: 'schemeIds', type: DATA.TYPE_ARRAY_OF | DATA.TYPE_UINT8 }
  ]
};

APP_LEDGER[APP_LEDGER_CREATION] = {
  label: 'APP_LEDGER_CREATION',
  definition: [
    { name: 'applicationId', type: DATA.TYPE_BIN256 }
  ]
};

APP_LEDGER[APP_LEDGER_ACTOR_CREATION] = {
  label: 'APP_LEDGER_ACTOR_CREATION',
  definition: [
    { name: 'id',   type: DATA.TYPE_UINT8 },
    { name: 'type', type: DATA.TYPE_UINT8 },
    { name: 'name', type: DATA.TYPE_STRING }
  ]
};

APP_LEDGER[APP_LEDGER_CHANNEL_CREATION] = {
  label: 'APP_LEDGER_CHANNEL_CREATION',
  definition: [
    { name: 'id',        type: DATA.TYPE_UINT8 },
    { name: 'isPrivate', type: DATA.TYPE_BOOLEAN },
    { name: 'creatorId', type: DATA.TYPE_UINT8 },
    { name: 'name',      type: DATA.TYPE_STRING }
  ]
};

APP_LEDGER[APP_LEDGER_SHARED_SECRET] = {
  label: 'APP_LEDGER_SHARED_SECRET',
  definition: [
    { name: 'hostId',             type: DATA.TYPE_UINT8 },
    { name: 'guestId',            type: DATA.TYPE_UINT8 },
    { name: 'encryptedSharedKey', type: DATA.TYPE_BINARY }
  ]
};

APP_LEDGER[APP_LEDGER_CHANNEL_INVITATION] = {
  label: 'APP_LEDGER_CHANNEL_INVITATION',
  definition: [
    { name: 'channelId',  type: DATA.TYPE_UINT8 },
    { name: 'hostId',     type: DATA.TYPE_UINT8 },
    { name: 'guestId',    type: DATA.TYPE_UINT8 },
    { name: 'encryptedChannelKey', type: DATA.TYPE_BINARY }
  ]
};

APP_LEDGER[APP_LEDGER_ACTOR_SUBSCRIPTION] = {
  label: 'APP_LEDGER_ACTOR_SUBSCRIPTION',
  definition: [
    { name: 'actorId',            type: DATA.TYPE_UINT8 },
    { name: 'actorType',          type: DATA.TYPE_UINT8 },
    { name: 'organizationId',     type: DATA.TYPE_BIN256 },
    { name: 'signatureSchemeId',  type: DATA.TYPE_UINT8 },
    { name: 'signaturePublicKey', type: DATA.TYPE_BINARY },
    { name: 'pkeSchemeId',        type: DATA.TYPE_UINT8 },
    { name: 'pkePublicKey',       type: DATA.TYPE_BINARY }
  ]
};

APP_LEDGER[APP_LEDGER_PUBLIC_CHANNEL_DATA] = {
  label: 'APP_LEDGER_PUBLIC_CHANNEL_DATA',
  definition: [
    { name: 'channelId', type: DATA.TYPE_UINT8 },
    { name: 'data',      type: DATA.TYPE_BINARY }
  ]
};

APP_LEDGER[APP_LEDGER_PRIVATE_CHANNEL_DATA] = {
  label: 'APP_LEDGER_PRIVATE_CHANNEL_DATA',
  definition: [
    { name: 'channelId',      type: DATA.TYPE_UINT8 },
    { name: 'merkleRootHash', type: DATA.TYPE_BIN256 },
    { name: 'encryptedData',  type: DATA.TYPE_BINARY }
  ]
};

APP_LEDGER[APP_LEDGER_AUTHOR] = {
  label: 'APP_LEDGER_AUTHOR',
  definition: [
    { name: 'authorId', type: DATA.TYPE_UINT8 }
  ]
};

APP_LEDGER[APP_LEDGER_ENDORSEMENT_REQUEST] = {
  label: 'APP_LEDGER_ENDORSEMENT_REQUEST',
  definition: [
    { name: 'endorserId', type: DATA.TYPE_UINT8 },
    { name: 'message',  type: DATA.TYPE_STRING }
  ]
};

export const ALL_SECTIONS_SCHEMAS = {
  ...PROTOCOL,
  ...ACCOUNT,
  ...VALIDATOR_NODE,
  ...ORGANIZATION,
  ...APPLICATION,
  ...APP_LEDGER,
}

// ============================================================================================================================ //
//  All sections                                                                                                                //
// ============================================================================================================================ //
export const DEF: Schema[][] = [
  PROTOCOL,
  ACCOUNT,
  VALIDATOR_NODE,
  ORGANIZATION,
  APPLICATION,
  APP_LEDGER
];
