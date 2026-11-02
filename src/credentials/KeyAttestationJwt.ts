import { decodeJwt, decodeProtectedHeader, importX509, jwtVerify } from "jose";

/**
 * JWT signed by an external certified key (e.g. a hardware token) attesting a public key.
 *
 * The `sub` claim holds the attested public key. The key signing the JWT is the leaf
 * certificate of the `x5c` header member. Only the signature and the validity dates are
 * checked here: the trust in the certificate chain is left to the consumer.
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

        if (!Array.isArray(header.x5c) || header.x5c.length === 0 || !header.x5c.every((c) => typeof c === "string")) {
            throw new Error("the key attestation JWT has no 'x5c' header");
        }
        if (typeof claims.sub !== "string") {
            throw new Error("the key attestation JWT has no 'sub' claim");
        }
        if (header.alg === undefined) {
            throw new Error("the key attestation JWT has no 'alg' header");
        }

        const x5c = header.x5c as string[];
        let signatureValid = false;
        let error: string | undefined;
        try {
            const key = await importX509(KeyAttestationJwt.toPem(x5c[0]), header.alg);
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
