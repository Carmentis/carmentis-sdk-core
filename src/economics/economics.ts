import {ECO} from "../constants/constants";

export const Economics = {
  getAccountTypeFromIdentifier,
  getSpecialAccountTypeIdentifier,
  isAllowedTransfer
};

function getAccountTypeFromIdentifier(accountIdentifier: Uint8Array): number {
  if(accountIdentifier.length != 32) {
    throw new Error(`invalid account identifier`);
  }
  if(accountIdentifier.slice(0, -1).every((v: number) => v == 0x00)) {
    const type = accountIdentifier[31];

    if(type == ECO.ACCOUNT_STANDARD || !ECO.ACCOUNT_NAMES[type]) {
      throw new Error(`special account format detected, but with an invalid type (${type})`);
    }
    return type;
  }
  return ECO.ACCOUNT_STANDARD;
}

function getSpecialAccountTypeIdentifier(type: number): Uint8Array {
  if(type == ECO.ACCOUNT_STANDARD || !ECO.ACCOUNT_NAMES[type]) {
    throw new Error(`${type} is not a valid special account type`);
  }
  const identifier = new Uint8Array(32);
  identifier[31] = type;
  return identifier;
}

function isAllowedTransfer(accountType: number, transferType: number) {
  return ECO.ACCOUNT_ALLOWED_TRANSFERS[accountType] >> transferType & 1;
}
