import * as v from "valibot";

export enum X509CertificatTagType {
	PEM = "PEM",
	X5C = 'X5C',
	KEY_ATTESTATION_JWT = "KEY_ATTESTATION_JWT"
}

export const X509CertificateSchema = v.variant('type', [
	v.object({
		type: v.literal(X509CertificatTagType.PEM),
		pem: v.string(),
	}),
	v.object({
		type: v.literal(X509CertificatTagType.X5C),
		x5c: v.array(v.string()),
	}),
	v.object({
		type: v.literal(X509CertificatTagType.KEY_ATTESTATION_JWT),
		jwt: v.unknown(),
	})
]);
