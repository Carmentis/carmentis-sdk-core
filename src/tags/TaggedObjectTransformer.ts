import * as v from "valibot";
import { X509CertificateSchema } from "../type/X509CertificateSchema";
import { TAG } from '../type/tags/tags';
import { JsonObject } from '../type/valibot/json/Json';
import { X509 } from '../credentials/X509';

export class TaggedObjectTransformer {
    static isKnownTag(tag: string): boolean {
        return (
            tag === TAG.CERTIFICATE
        );
    }

    static async process(tag: string, object: any): Promise<JsonObject | null> {
        switch (tag) {
            case TAG.CERTIFICATE: {
                return await TaggedObjectTransformer.processCertificate(object);
            }
        }
        return null;
    }

    static async processCertificate(object: any): Promise<JsonObject | null> {
        const wrapper = v.parse(X509CertificateSchema, object);
        switch (wrapper.type) {
            case "PEM": {
                const cert = X509.fromString(wrapper.pem);
                const content = await TaggedObjectTransformer.transformCertificate(cert);
                return { x509: content };
            }
            case "X5C": {
                const certList = X509.fromX5c(wrapper.x5c);
                const content: JsonObject[] = [];
                for (const cert of certList) {
                    const entry = await TaggedObjectTransformer.transformCertificate(cert);
                    content.push(entry);
                }
                return { x509Chain: content };
            }
            case "KEY_ATTESTATION_JWT": {
                break;
            }
        }
        return null;
    }

    static async transformCertificate(cert: X509): Promise<JsonObject> {
        const info = await cert.getInformation();
        const output = {
            info,
            subject: cert.getSubjectDN(),
            issuer: cert.getIssuerDN(),
            extensions: cert.getExtensions(),
        }
        return output;
    }
}
