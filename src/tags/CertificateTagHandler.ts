import * as v from "valibot";
import {SignatureTag, SignatureTagSchema} from "../type/tags/SignatureTag";
import {CertificateTag, CertificateTagSchema} from "../type/tags/CertificateTag";

export class CertificateTagHandler  {
    static fromObject(obj: unknown): CertificateTagHandler {
        return new CertificateTagHandler(
            v.parse(CertificateTagSchema, obj)
        )
    }

    constructor(
        private readonly certificateTag: CertificateTag
    ) {}

    getX509Base64Der(): string {
        return this.certificateTag.x509Base64Der;
    }
}