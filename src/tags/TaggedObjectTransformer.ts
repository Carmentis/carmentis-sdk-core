import * as v from "valibot";
import { TAG } from '../type/tags/tags';
import { JsonObject } from '../type/valibot/json/Json';
import { VcVpTagType, VcVpSchema } from "../type/VcVpSchema";
import { X509CertificatTagType, X509CertificateSchema } from "../type/X509CertificateSchema";
import { X509 } from '../credentials/X509';
import { SdJwt } from "../credentials/SdJwt";
import { SignatureObjectSchema, SignatureVerificationContextSchema } from '../type/JsonSignatureSchemas';
import { DckfSignatureDecoder } from "../crypto/encoder/signature/dckf/DckfSignatureDecoder";
import { JsonSignatureParser } from "../crypto/signature/signer/json/JsonSignatureParser";
import { JsonSignatureVerifier } from "../crypto/signature/signer/json/JsonSignatureVerifier";
import { Unresolved } from '../resolver/ResolverTypes';

const types = {
    [TAG.CERTIFICATE]: "certificate",
    [TAG.SIGNATURE]: "signature",
    [TAG.VC]: "verifiable credential",
    [TAG.VP]: "verifiable presentation",
};

export class TaggedObjectTransformer {
    static isKnownTag(tag: string): boolean {
        return types[tag] !== undefined;
    }

    static async process(tag: string, object: any, path: string, unresolved: Unresolved[]): Promise<JsonObject | null> {
        try {
            switch (tag) {
                case TAG.CERTIFICATE: {
                    return await TaggedObjectTransformer.processCertificate(object);
                }
                case TAG.SIGNATURE: {
                    return await TaggedObjectTransformer.processSignedJson(object);
                }
                case TAG.VC: {
                    return await TaggedObjectTransformer.processVerifiableCredential(object);
                }
                case TAG.VP: {
                    return await TaggedObjectTransformer.processVerifiableCredential(object);
                }
                default: {
                    return null;
                }
            }
        }
        catch (err) {
            unresolved.push({
                path,
                type: types[tag] ?? "unknown",
                cause: String(err),
            });
            return null;
        }
    }

    private static async processCertificate(object: any): Promise<JsonObject> {
        const wrapper = v.parse(X509CertificateSchema, object);
        switch (wrapper.type) {
            case X509CertificatTagType.PEM: {
                const cert = X509.fromString(wrapper.pem);
                const content = await TaggedObjectTransformer.transformCertificate(cert);
                return { x509: content };
            }
            case X509CertificatTagType.X5C: {
                const certList = X509.fromX5c(wrapper.x5c);
                const content: JsonObject[] = [];
                for (const cert of certList) {
                    const entry = await TaggedObjectTransformer.transformCertificate(cert);
                    content.push(entry);
                }
                return { x509Chain: content };
            }
            case X509CertificatTagType.KEY_ATTESTATION_JWT: {
                throw new Error("'key_attestation_jwt' is not yet supported");
            }
        }
    }

    private static async transformCertificate(cert: X509): Promise<JsonObject> {
        const info = await cert.getInformation();
        const output = {
            info,
            subject: cert.getSubjectDN(),
            issuer: cert.getIssuerDN(),
            extensions: cert.getExtensions(),
        }
        return output;
    }

    private static async processSignedJson(object: any): Promise<JsonObject> {
        const wrapper = v.parse(SignatureObjectSchema, object);
        const keyDecoder = new DckfSignatureDecoder();
        if (wrapper.publicKey === undefined) {
            throw new Error('no public key provided');
        }
        const pk = await keyDecoder.decodePublicKey(wrapper.publicKey);
        const parsedContext = v.safeParse(SignatureVerificationContextSchema, wrapper.context ?? {});
        if (!parsedContext.success) {
            throw new Error(
                `Invalid verification context: ${parsedContext.issues.map(issue => issue.message).join('; ')}`,
            );
        }

        let parsedSignature;
        try {
            parsedSignature = JsonSignatureParser.parse(object);
        }
        catch(err) {
            console.error(err);
            throw new Error("malformed signature");
        }
        const verifier = new JsonSignatureVerifier();
        if (wrapper.payload !== undefined) {
            verifier.setPayload(wrapper.payload);
        }
        const result = await verifier.verify(pk, parsedSignature, parsedContext.output);
        if (!result.verified) {
            throw new Error("the signature verification failed");
        }
        return result.payload as JsonObject;
    }

    private static async processVerifiableCredential(object: any): Promise<JsonObject> {
        const wrapper = v.parse(VcVpSchema, object);
        switch (wrapper.type) {
            case VcVpTagType.SDJWT_IETF: {
                return await TaggedObjectTransformer.processSdJwt(wrapper.sdjwt_ietf);
            }
            case VcVpTagType.JWT_W3C: {
                return await TaggedObjectTransformer.processJwtW3c(wrapper.jwt_w3c);
            }
        }
    }

    private static async processSdJwt(str: string): Promise<JsonObject> {
        const sdJwt = new SdJwt(str);
        const object = await sdJwt.decode();
        if (!object.valid) {
            throw new Error("the verification of the claims failed");
        }
        return object.claims;
    }

    private static async processJwtW3c(str: any): Promise<JsonObject> {
        throw new Error(`'jwt_w3c' is not yet supported`);
    }
}
