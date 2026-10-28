import * as v from "valibot";
import { TAG } from '../type/tags/tags';
import { TagHandler } from "./TagHandler";
import { X509CertificatTagType, X509CertificateSchema } from "../type/X509CertificateSchema";
import { X509 } from '../credentials/X509';
import { JsonObject } from '../type/valibot/json/Json';
import { CertificateNode } from '../type/valibot/resolutionNodes/ResolutionNodes';
import { ResolverPath } from '../resolver/ResolverPath';

export class CertificateTagHandler extends TagHandler {
    getTags() {
        return [ { name: TAG.CERTIFICATE } ];
    }

    async handle(tag: string, object: any, path: ResolverPath) {
        const wrapper = v.parse(X509CertificateSchema, object);
        let output: JsonObject;
        let node: CertificateNode;

        switch (wrapper.type) {
            case X509CertificatTagType.PEM: {
                const cert = X509.fromString(wrapper.pem);
                const content = await this.processCertificate(cert);
                output = { x509: content };
                node = { type: "certificate", valid: true };
                break;
            }
            case X509CertificatTagType.X5C: {
                const certList = X509.fromX5c(wrapper.x5c);
                const content: JsonObject[] = [];
                for (const cert of certList) {
                    const entry = await this.processCertificate(cert);
                    content.push(entry);
                }
                output = { x509Chain: content };
                node = { type: "certificate", valid: true };
                break;
            }
            case X509CertificatTagType.KEY_ATTESTATION_JWT: {
                throw new Error("'key_attestation_jwt' is not yet supported");
            }
        }
        return {
            output,
            node,
            resolveOutput: false,
        }
    }

    private async processCertificate(cert: X509): Promise<JsonObject> {
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
