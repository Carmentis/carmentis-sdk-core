import {PublicSignatureKey} from "../../PublicSignatureKey";
import {JsonEncoder} from "./JsonEncoder";
import {JsonCanonicalizationMethod} from "./JsonCanonicalizationMethod";
import {BinaryEncoder} from "../binary/BinaryEncoder";
import {BinaryEncoding} from "../binary/BinaryEndoding";
import * as v from "valibot";
import {
    JsonSignature
} from "./JsonSignature";
import {SignatureVerificationUtils} from "./SignatureVerificationUtils";
import {JwsSignature} from "./JwsSignature";
import {JsonCanonicalUtf8Signature} from "./JsonCanonicalUtf8Signature";
import {
    SignatureContext, SignatureContextSchema,
    SignatureType,
    SignatureVerification,
    SignatureVerificationContext
} from "../../../../type/JsonSignatureSchemas";
import {base64UrlToBytes, base64UrlToObject} from "./JsonSignatureUtils";

export class JsonSignatureVerifier {
    // useful when the payload is not included in the signature object
    private payload?: unknown;

    setPayload(payload: unknown) {
        this.payload = payload;
        return this;
    }

    async verify(
        pk: PublicSignatureKey,
        signature: JsonSignature,
        verificationContext: SignatureVerificationContext = {}
    ): Promise<SignatureVerification> {
        switch (signature.getSignatureType()) {
            case SignatureType.JSON_CANONICAL_UTF8:
                return this.verifyJsonCanonical(
                    pk,
                    signature as JsonCanonicalUtf8Signature,
                    verificationContext
                );
            case SignatureType.JWS:
                return this.verifyJws(pk, signature as JwsSignature, verificationContext);
            default:
                throw new Error(`Unsupported signature type: ${signature.getSignatureType()}`);
        }
    }

    private async verifyJsonCanonical(
        pk: PublicSignatureKey,
        signature: JsonCanonicalUtf8Signature,
        verificationContext: SignatureVerificationContext,
    ) {
        const signatureObject = signature.getSignatureObject();
        const context = signatureObject.context;
        // check context errors
        const contextErrors = this.checkContext(context, verificationContext)
        if (contextErrors) return contextErrors


        const payload = signatureObject.payload ?? this.payload;
        const rawMessage = JsonEncoder.encode(
            {
                context: signatureObject.context,
                payload,
            },
            JsonCanonicalizationMethod.JSON_CANONICAL
        );
        const rawSignature = BinaryEncoder.decode(
            signatureObject.signature,
            signatureObject.signatureEncoding ?? BinaryEncoding.BASE64
        );
        const verified = await pk.verify(rawMessage, rawSignature);
        if (!verified) return SignatureVerificationUtils.invalidSignature()
        return SignatureVerificationUtils.verified(
            signatureObject.context,
            payload
        );
    }

    private async verifyJws(
        pk: PublicSignatureKey,
        signature: JwsSignature,
        verificationContext: SignatureVerificationContext,
    ) {
        const jws = signature.getJws();
        const parts = jws.split('.');
        if (parts.length !== 3) {
            console.warn(`Malformed compact JWS: expected 3 parts, got ${parts.length}`);
            return SignatureVerificationUtils.malformed()
        }

        const [encodedHeader, encodedPayload, encodedSignature] = parts;
        const signingInput = `${encodedHeader}.${encodedPayload}`;
        const signingInputBytes = new TextEncoder().encode(signingInput);
        const rawSignature = base64UrlToBytes(encodedSignature);
        const verified = await pk.verify(signingInputBytes, rawSignature);
        if (!verified) return SignatureVerificationUtils.invalidSignature()

        const payload = signature.getPayload();
        const context = signature.getContext();

        // check context errors
        const contextErrors = this.checkContext(context, verificationContext)
        if (contextErrors) return contextErrors

        return SignatureVerificationUtils.verified(
            context,
            payload
        );
    }


    private checkContext(signatureContext: SignatureContext, verificationContext: SignatureVerificationContext): SignatureVerification | undefined {
        // time-related errors
        const now = verificationContext.verifiedAt ?? Date.now();
        if (signatureContext.notValidBefore && signatureContext.notValidBefore > now) {
            return SignatureVerificationUtils.notValidYet()
        }

        if (signatureContext.notValidAfter && signatureContext.notValidAfter < now) {
            return SignatureVerificationUtils.expired()
        }

        // context-related error
        if (typeof verificationContext.shouldBeValidOnChain === 'boolean') {
            if (verificationContext.shouldBeValidOnChain !== signatureContext.allowOnChain) {
                return SignatureVerificationUtils.allowedOnChainNotMatch()
            }
        }
    }
}