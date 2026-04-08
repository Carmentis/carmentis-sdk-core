export const MAGIC_STRING = "CMTS";
export const PROTOCOL_VERSION = 1;

export const VB_PROTOCOL       = 0;
export const VB_ACCOUNT        = 1;
export const VB_VALIDATOR_NODE = 2;
export const VB_ORGANIZATION   = 3;
export const VB_APPLICATION    = 4;
export const VB_APP_LEDGER     = 5;

export const N_VIRTUAL_BLOCKCHAINS = 6;

export const VB_NAME = [
  "protocol",
  "account",
  "validator node",
  "organization",
  "application",
  "application ledger"
];

export const MAX_MICROBLOCK_PAST_DELAY = 300;
export const MAX_MICROBLOCK_FUTURE_DELAY = 120;

// The MB is invalid and cannot be made valid under any circumstances.
export const MB_STATUS_UNRECOVERABLE_ERROR = 1;

// The MB is invalid because of its timestamp but may become valid. (Under normal operation, this only applies
// to a MB "too far in the future". However, the timestamp error may also be caused by a faulty system clock on
// the node itself, in which case a MB wrongly declared as "too far in the past" may become valid once the node
// clock is correctly synchronized.)
export const MB_STATUS_TIMESTAMP_ERROR = 2;

// The MB is invalid because the previous hash declared its in header does not exist yet. It may become valid if
// this hash is created.
export const MB_STATUS_PREVIOUS_HASH_ERROR = 3;
