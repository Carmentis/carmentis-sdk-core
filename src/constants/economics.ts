// tokens
export const TOKEN_NAME    = "CMTS";
export const TOKEN         = 100000;
export const CENTITOKEN    = 1000;
export const MILLITOKEN    = 100;
export const INITIAL_OFFER = 1000000000 * TOKEN;

// gas
export const MINIMUM_GAS_PRICE = 1;
export const MAXIMUM_GAS_PRICE = 2 ** 29 - 1;
export const FIXED_GAS_FEE     = 1000;
export const GAS_PER_BYTE      = 1;
export const GAS_UNIT          = 1000;

// bookkeeping operations
export const BK_PLUS = 0x1;

export const BK_PAID_TX_FEES        = 0x00;
export const BK_PAID_BLOCK_FEES     = 0x02;
export const BK_SENT_ISSUANCE       = 0x04;
export const BK_SALE                = 0x06;
export const BK_SENT_PAYMENT        = 0x08;
export const BK_SENT_VESTING        = 0x0A;
export const BK_SENT_ESCROW         = 0x0C;
export const BK_SENT_ESCROW_REFUND  = 0x0E;
export const BK_SENT_EXPIRED_ESCROW = 0x10;
export const BK_SENT_SLASHED_TOKENS = 0x12;

export const BK_EARNED_TX_FEES          = BK_PLUS | BK_PAID_TX_FEES;
export const BK_EARNED_BLOCK_FEES       = BK_PLUS | BK_PAID_BLOCK_FEES;
export const BK_RECEIVED_ISSUANCE       = BK_PLUS | BK_SENT_ISSUANCE;
export const BK_PURCHASE                = BK_PLUS | BK_SALE;
export const BK_RECEIVED_PAYMENT        = BK_PLUS | BK_SENT_PAYMENT;
export const BK_RECEIVED_VESTING        = BK_PLUS | BK_SENT_VESTING;
export const BK_RECEIVED_ESCROW         = BK_PLUS | BK_SENT_ESCROW;
export const BK_RECEIVED_ESCROW_REFUND  = BK_PLUS | BK_SENT_ESCROW_REFUND;
export const BK_RECEIVED_EXPIRED_ESCROW = BK_PLUS | BK_SENT_EXPIRED_ESCROW;
export const BK_RECEIVED_SLASHED_TOKENS = BK_PLUS | BK_SENT_SLASHED_TOKENS;

export const BK_REF_BLOCK      = 0;
export const BK_REF_MICROBLOCK = 1;
export const BK_REF_SECTION    = 2;

export const BK_REFERENCES = [
  /* BK_PAID_TX_FEES            */ BK_REF_MICROBLOCK,
  /* BK_EARNED_TX_FEES          */ BK_REF_MICROBLOCK,
  /* BK_PAID_BLOCK_FEES         */ BK_REF_BLOCK,
  /* BK_EARNED_BLOCK_FEES       */ BK_REF_BLOCK,
  /* BK_SENT_ISSUANCE           */ BK_REF_SECTION,
  /* BK_RECEIVED_ISSUANCE       */ BK_REF_SECTION,
  /* BK_SALE                    */ BK_REF_SECTION,
  /* BK_PURCHASE                */ BK_REF_SECTION,
  /* BK_SENT_PAYMENT            */ BK_REF_SECTION,
  /* BK_RECEIVED_PAYMENT        */ BK_REF_SECTION,
  /* BK_SENT_VESTING            */ BK_REF_SECTION,
  /* BK_RECEIVED_VESTING        */ BK_REF_SECTION,
  /* BK_SENT_ESCROW             */ BK_REF_SECTION,
  /* BK_RECEIVED_ESCROW         */ BK_REF_SECTION,
  /* BK_SENT_ESCROW_REFUND      */ BK_REF_SECTION,
  /* BK_RECEIVED_ESCROW_REFUND  */ BK_REF_SECTION,
  /* BK_SENT_EXPIRED_ESCROW     */ BK_REF_BLOCK,
  /* BK_RECEIVED_EXPIRED_ESCROW */ BK_REF_BLOCK,
  /* BK_SENT_SLASHED_TOKENS     */ BK_REF_BLOCK,
  /* BK_RECEIVED_SLASHED_TOKENS */ BK_REF_BLOCK
];

export const BK_NAMES = [
  /* BK_PAID_TX_FEES            */ "Paid TX fees",
  /* BK_EARNED_TX_FEES          */ "Earned TX fees",
  /* BK_PAID_BLOCK_FEES         */ "Paid block fees",
  /* BK_EARNED_BLOCK_FEES       */ "Earned block fees",
  /* BK_SENT_ISSUANCE           */ "Sent initial token issuance",
  /* BK_RECEIVED_ISSUANCE       */ "Received initial token issuance",
  /* BK_SALE                    */ "Sale",
  /* BK_PURCHASE                */ "Purchase",
  /* BK_SENT_PAYMENT            */ "Sent payment",
  /* BK_RECEIVED_PAYMENT        */ "Received payment",
  /* BK_SENT_VESTING            */ "Sent vesting",
  /* BK_RECEIVED_VESTING        */ "Received vesting",
  /* BK_SENT_ESCROW             */ "Sent escrow",
  /* BK_RECEIVED_ESCROW         */ "Received escrow",
  /* BK_SENT_ESCROW_REFUND      */ "Sent escrow refund",
  /* BK_RECEIVED_ESCROW_REFUND  */ "Received escrow refund",
  /* BK_SENT_EXPIRED_ESCROW     */ "Sent expired escrow",
  /* BK_RECEIVED_EXPIRED_ESCROW */ "Received expired escrow",
  /* BK_SENT_SLASHED_TOKENS     */ "Sent slashed tokens",
  /* BK_RECEIVED_SLASHED_TOKENS */ "Received slashed tokens"
];

// account types
export const ACCOUNT_BURNT_TOKENS  = 0x00;
export const ACCOUNT_STANDARD      = 0x01;
export const ACCOUNT_BLOCK_FEES    = 0x02;

export const ACCOUNT_NAMES = [
  "Burnt tokens account",
  "Standard account",
  "Block fees account"
];

export const ACCOUNT_ALLOWED_TRANSFERS = [
  // ACCOUNT_BURNT_TOKENS
  (
    1 << BK_RECEIVED_PAYMENT |
    1 << BK_RECEIVED_SLASHED_TOKENS
  ),
  // ACCOUNT_STANDARD
  (
    1 << BK_RECEIVED_ISSUANCE |
    1 << BK_RECEIVED_PAYMENT |
    1 << BK_SENT_PAYMENT |
    1 << BK_RECEIVED_VESTING |
    1 << BK_SENT_VESTING |
    1 << BK_RECEIVED_ESCROW |
    1 << BK_SENT_ESCROW |
    1 << BK_RECEIVED_ESCROW_REFUND |
    1 << BK_SENT_ESCROW_REFUND |
    1 << BK_RECEIVED_EXPIRED_ESCROW |
    1 << BK_SENT_EXPIRED_ESCROW |
    1 << BK_SALE |
    1 << BK_PURCHASE |
    1 << BK_EARNED_BLOCK_FEES |
    1 << BK_PAID_TX_FEES |
    1 << BK_SENT_SLASHED_TOKENS
  ),

  // ACCOUNT_BLOCK_FEES
  (
    1 << BK_EARNED_TX_FEES |
    1 << BK_PAID_BLOCK_FEES
  )
];
