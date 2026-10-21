import * as v from "valibot";

export enum VcVpTagType {
	SDJWT_IETF = "SDJWT_IETF",
	JWT_W3C = 'JWT_W3C',
}

export const VcVpSchema = v.variant('type', [
	v.object({
		type: v.literal(VcVpTagType.SDJWT_IETF),
		sdjwt_ietf: v.string(),
	}),
	v.object({
		type: v.literal(VcVpTagType.JWT_W3C),
		jwt_w3c: v.string(),
	}),
]);
