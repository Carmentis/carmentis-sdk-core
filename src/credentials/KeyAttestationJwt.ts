import { base64url, decodeJwt, decodeProtectedHeader, importJWK, importX509, jwtVerify, JWK, JWTPayload, JWTHeaderParameters } from "jose";

/**
 * JWT signed by an external certified key (e.g. a hardware token) attesting a public key.
 *
 * The `sub` claim holds the attested public key. The key signing the JWT is looked up,
 * in order, in the `x5c` header member (leaf certificate), the `jwk` header member, and
 * the `did:jwk` identifier held by the `iss` claim (its `x5c` member if any, else the
 * key itself). Only the signature and the validity dates are checked here: the trust in
 * the certificate chain is left to the consumer.
 */
export class KeyAttestationJwt {
    constructor(private readonly jwt: string) {}

    /**
     * @return The decoded attestation.
     * @throws {Error} If the token is not a JWT, has no `x5c` header or no string `sub` claim.
     */
    async decode() {
        const header = decodeProtectedHeader(this.jwt);
        const claims = decodeJwt(this.jwt);

        if (typeof claims.sub !== "string") {
            throw new Error("the key attestation JWT has no 'sub' claim");
        }
        if (header.alg === undefined) {
            throw new Error("the key attestation JWT has no 'alg' header");
        }

        const source = KeyAttestationJwt.findVerificationKey(header, claims);
        const x5c = source.x5c;
        let signatureValid = false;
        let error: string | undefined;
        try {
            const key = x5c.length > 0
                ? await importX509(KeyAttestationJwt.toPem(x5c[0]), header.alg)
                : await importJWK(source.jwk!, header.alg);
            await jwtVerify(this.jwt, key);
            signatureValid = true;
        }
        catch (err) {
            error = (err as Error).message;
        }

        return {
            header,
            claims,
            subject: claims.sub,
            info: {
                issuedOn: KeyAttestationJwt.toDate(claims.iat),
                notBefore: KeyAttestationJwt.toDate(claims.nbf),
                expiresOn: KeyAttestationJwt.toDate(claims.exp),
            },
            x5c,
            signatureValid,
            error,
        };
    }

    private static findVerificationKey(header: JWTHeaderParameters, claims: JWTPayload): { x5c: string[]; jwk?: JWK } {
        if (Array.isArray(header.x5c) && header.x5c.length > 0 && header.x5c.every((c) => typeof c === "string")) {
            return { x5c: header.x5c as string[] };
        }
        if (header.jwk !== undefined) {
            return { x5c: [], jwk: header.jwk as JWK };
        }
        const DID_JWK = "did:jwk:";
        if (typeof claims.iss === "string" && claims.iss.startsWith(DID_JWK)) {
            let jwk: JWK;
            try {
                jwk = JSON.parse(new TextDecoder().decode(base64url.decode(claims.iss.slice(DID_JWK.length))));
            }
            catch {
                throw new Error("the 'iss' claim is not a valid did:jwk identifier");
            }
            const x5c = Array.isArray(jwk.x5c) && jwk.x5c.every((c) => typeof c === "string") ? jwk.x5c as string[] : [];
            return { x5c, jwk };
        }
        throw new Error("the key attestation JWT carries no verification key: expected an 'x5c' or 'jwk' header, or a did:jwk 'iss'");
    }

    private static toDate(ts: number | undefined) {
        return ts === undefined ? null : new Date(ts * 1000);
    }

    private static toPem(cert: string) {
        if (cert.includes("BEGIN CERTIFICATE")) {
            return cert;
        }
        const lines = cert.replace(/\s+/g, "").match(/.{1,64}/g) ?? [];
        return `-----BEGIN CERTIFICATE-----\n${lines.join("\n")}\n-----END CERTIFICATE-----`;
    }
}
