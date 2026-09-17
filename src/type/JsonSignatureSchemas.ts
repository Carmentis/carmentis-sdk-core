import * as v from "valibot";
import {BinaryEncoding} from "../crypto/signature/signer/binary/BinaryEndoding";

export const SignatureContextSchema = v.looseObject({
    // the date of signature (required)
    signedAt: v.number(),

    // signature goal (can be arbitrary text) but should define a scope like authentication
    // or application-specific usage.
    purpose: v.string(),

    // the target of the signature (for instance, application or id).
    target: v.optional(v.string()),

    // some time-related fields can be added
    requestedAt: v.optional(v.number()),
    notValidBefore: v.optional(v.number()),
    notValidAfter: v.optional(v.number()),

    // some blockchain-related fields can be used as well to prevent
    // abusing the usage of context
    allowOnChain: v.optional(v.boolean()),
    organizationId: v.optional(v.string()),
    applicationId: v.optional(v.string()),
    applicationLedgerId: v.optional(v.string()),
    applicationLedgerLatestMicroblockHash: v.optional(v.string()),
})
export type SignatureContext = v.InferOutput<typeof SignatureContextSchema>;

export enum SignatureType {
    JSON_CANONICAL_UTF8 = 'json-canonical+utf8',
    JWS = 'jws'
}

export const JsonCanonicalUtf8SignatureSchema = v.looseObject({
    signatureType: v.literal(SignatureType.JSON_CANONICAL_UTF8),
    signature: v.string(),
    signatureEncoding: v.optional(v.enum(BinaryEncoding)),
    publicKey: v.optional(v.string()),
    context: SignatureContextSchema,
    payload: v.optional(v.unknown()),
})
export type JsonCanonicalUtf8SignatureObject = v.InferOutput<typeof JsonCanonicalUtf8SignatureSchema>;
export const JwsSignatureSchema = v.looseObject({
    signatureType: v.literal(SignatureType.JWS),
    jws: v.string(),
    publicKey: v.optional(v.string()),
})
export type JwsSignatureObject = v.InferOutput<typeof JwsSignatureSchema>;
export const SignatureObjectSchema = v.variant('signatureType', [
    JsonCanonicalUtf8SignatureSchema,
    JwsSignatureSchema,
])
export type SignatureObject = v.InferOutput<typeof SignatureObjectSchema>;
export const SignatureVerificationContextSchema = v.looseObject({
    verifiedAt: v.optional(v.number()),
    shouldBeValidOnChain: v.nullish(v.boolean())
    // other fields might be added in the future
})
export type SignatureVerificationContext = v.InferOutput<typeof SignatureVerificationContextSchema>
export const SignatureVerificationSchema = v.variant('verified', [
    v.object({
        verified: v.literal(true),
        context: SignatureContextSchema,
        payload: v.unknown()
    }),
    v.object({
        verified: v.literal(false),
        errors: v.array(v.string())
    }),
])
export type SignatureVerification = v.InferOutput<typeof SignatureVerificationSchema>