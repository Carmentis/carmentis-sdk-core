import * as v from 'valibot';
import {X509CertificateSchema} from "../X509CertificateSchema";

export type X509CertificateTag = v.InferOutput<typeof X509CertificateSchema>
