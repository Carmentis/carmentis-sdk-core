import * as v from "valibot";
import { TAG } from '../type/tags/tags';
import { TagHandler, TagHandlerContext } from "./TagHandler";
import { X509CertificatTagType, X509CertificateSchema } from "../type/X509CertificateSchema";
import { X509 } from '../credentials/X509';
import { JsonObject } from '../type/valibot/json/Json';
import { CertificateNode } from '../type/valibot/resolutionNodes/ResolutionNodes';
import { ResolverPath } from '../resolver/ResolverPath';
import { KeyAttestationJwt } from '../credentials/KeyAttestationJwt';
import { DckfSignatureDecoder } from '../crypto/encoder/signature/dckf/DckfSignatureDecoder';
import { EncoderFactory } from '../utils/encoder';

export class CertificateTagHandler extends TagHandler {
    getTags() {
        return [ { name: TAG.CERTIFICATE } ];
    }

    async handle(tag: string, object: any, path: ResolverPath, context?: TagHandlerContext) {
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
                const attestation = await new KeyAttestationJwt(wrapper.jwt).decode();
                const x509Chain: JsonObject[] = [];
                for (const cert of X509.fromX5c(attestation.x5c)) {
                    x509Chain.push(await this.processCertificate(cert));
                }
                const boundToSigner = await this.isSubjectSigner(attestation.subject, context?.getEnclosingNode(path));
                output = {
                    keyAttestation: {
                        subject: attestation.subject,
                        issuedOn: attestation.info.issuedOn?.toISOString() ?? null,
                        notBefore: attestation.info.notBefore?.toISOString() ?? null,
                        expiresOn: attestation.info.expiresOn?.toISOString() ?? null,
                        x509Chain,
                        signatureValid: attestation.signatureValid,
                        boundToSigner,
                    },
                };
                node = { type: "certificate", valid: attestation.signatureValid && boundToSigner };
                break;
            }
        }
        return {
            output,
            node,
            resolveOutput: false,
        }
    }

    /**
     * Tells whether the attested key is the one that signed the enclosing microblock.
     * The subject is either the DCKF encoding of the key (`sig:secp256k1:pk:...`) or its hex bytes.
     */
    private async isSubjectSigner(subject: string, enclosing: { publicKey: string } | undefined) {
        if (enclosing === undefined) {
            return false;
        }
        if (subject === enclosing.publicKey) {
            return true;
        }
        const signerKey = await new DckfSignatureDecoder().decodePublicKey(enclosing.publicKey);
        const encoded = EncoderFactory.defaultBytesToStringEncoder().encode(await signerKey.getPublicKeyAsBytes());
        return encoded.toLowerCase() === subject.toLowerCase();
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
