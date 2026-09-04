import * as v from 'valibot';

export const CertificateTagSchema = v.object({
    x509Base64Der: v.string(),
})

export type CertificateTag = v.InferOutput<typeof CertificateTagSchema>
