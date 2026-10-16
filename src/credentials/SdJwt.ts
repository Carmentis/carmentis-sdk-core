import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import { digest } from '@sd-jwt/crypto-browser';
import { importJWK } from "jose";
import { Base64 } from "../data/base64";
const subtle = globalThis.crypto.subtle;

export class SdJwt {
    private jwt: string;
    private claims: { [key: string]: string } = {};
    private claimsExtracted = false;

    constructor(jwt: string) {
        this.jwt = jwt;
    }

    private async extractClaims() {
        if (!this.claimsExtracted) {
            const sdJwt = new SDJwtVcInstance({
                hasher: digest,
            });
            this.claims = await sdJwt.getClaims(this.jwt) as { [key: string]: string };
            this.claimsExtracted = true;
        }
    }

    async getIssuer() {
        await this.extractClaims();
        return this.claims.iss;
    }

    async getDates() {
        await this.extractClaims();
        let issuedOn: Date | null = null;
        let validFrom: Date | null = null;
        let validUntil: Date | null = null;

        if (this.claims.iat !== undefined) {
            issuedOn = new Date(Number(this.claims.iat) * 1000);
        }
        if (this.claims.nbf !== undefined) {
            validFrom = new Date(Number(this.claims.nbf) * 1000);
        }
        if (this.claims.exp !== undefined) {
            validUntil = new Date(Number(this.claims.exp) * 1000);
        }
        return { issuedOn, validFrom, validUntil };
    }

    async decode() {
        const sdJwt = new SDJwtVcInstance({
            hasher: digest,
        });
        const claims = await sdJwt.getClaims(this.jwt) as { [key: string]: string };
        let issuer = "-";
        let issuedOn: Date | null = null;
        let validFrom: Date | null = null;
        let validUntil: Date | null = null;
        let issuerJwk = null;
        let valid = false;

        if (claims.iss !== undefined) {
            issuer = claims.iss;
            valid = await this.verify(issuer);
            issuerJwk = this.extractJwk(issuer);
        }
        if (claims.iat !== undefined) {
            issuedOn = new Date(Number(claims.iat) * 1000);
        }
        if (claims.nbf !== undefined) {
            validFrom = new Date(Number(claims.nbf) * 1000);
        }
        if (claims.exp !== undefined) {
            validUntil = new Date(Number(claims.exp) * 1000);
        }
        return {
            info: {
                issuedOn, validFrom, validUntil,
            },
            claims,
            issuerJwk,
            valid,
        };
    }

    extractJwk(issuer: string) {
        const parts = issuer.split(":");
        const issuerJwt = parts[2];
        if (issuerJwt === undefined) {
            throw new Error("Invalid DID format");
        }
        const jwk = JSON.parse(
            Base64.decodeString(issuerJwt, Base64.URL)
        );
        return jwk;
    }

    async verify(issuer: string) {
        const jwk = this.extractJwk(issuer);
        const crv = jwk.crv;
        const key = (await importJWK(jwk, crv, {
            extractable: true,
        })) as CryptoKey;

        const sdjwtVerifier = new SDJwtVcInstance({
            hasher: digest,
            statusListFetcher: async (uri: string) => {
                const response = await fetch(uri);
                if (!response.ok) {
                    throw new Error(`Failed to fetch statusList (${response.status}) from ${uri}`);
                }
                return response.text();
            },
            statusVerifier: async (data, signature) => {
                const binData = (new TextEncoder()).encode(data);
                const binSig = Base64.decodeBinary(signature, Base64.URL);
                const verified = await subtle.verify(
                    { name: crv },
                    key,
                    binSig,
                    binData,
                );
                return verified;
            },
            verifier: async (data, signature) => {
                const binData = (new TextEncoder()).encode(data);
                const binSig = Base64.decodeBinary(signature, Base64.URL);
                const verified = await subtle.verify(
                    { name: crv },
                    key,
                    binSig,
                    binData,
                );
                return verified;
            }
        });
        let verified: boolean;
        try {
            const result = await sdjwtVerifier.safeVerify(this.jwt)
            console.log("safeVerify()", result);
            verified = result.success;
        }
        catch (error) {
            console.error("sig verification failed", error);
            verified = false;
        }
        return verified;
    }

    static timestampToDate(ts: number) {
        return new Date(ts * 1000).toISOString().slice(0, -5);
    }
}
