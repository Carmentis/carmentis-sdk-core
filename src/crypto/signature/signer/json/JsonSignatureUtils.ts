import {SignatureJwk} from "../../jwk/JwkSignatureAlgorithm";
import {SignatureContext} from "../../../../type/JsonSignatureSchemas";

const BASE64_URL_ALPHABET =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export function base64UrlToObject(input: string) {
    const bytes = base64UrlToBytes(input);
    const utf8 = new TextDecoder().decode(bytes);
    return JSON.parse(utf8);
}

export function bytesToBase64Url(bytes: Uint8Array): string {
    let result = '';
    for (let i = 0; i < bytes.length; i += 3) {
        const b0 = bytes[i];
        const b1 = i + 1 < bytes.length ? bytes[i + 1] : undefined;
        const b2 = i + 2 < bytes.length ? bytes[i + 2] : undefined;

        result += BASE64_URL_ALPHABET[b0 >> 2];
        result += BASE64_URL_ALPHABET[((b0 & 0x03) << 4) | ((b1 ?? 0) >> 4)];
        if (b1 !== undefined) {
            result += BASE64_URL_ALPHABET[((b1 & 0x0f) << 2) | ((b2 ?? 0) >> 6)];
        }
        if (b2 !== undefined) {
            result += BASE64_URL_ALPHABET[b2 & 0x3f];
        }
    }
    return result;
}

export function utf8StringToBase64Url(input: string): string {
    return bytesToBase64Url(new TextEncoder().encode(input));
}

export function base64UrlToBytes(input: string): Uint8Array {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binaryString = atob(padded); // disponible en navigateur ET Node ≥ 16 (global)
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export function determineJwsAlgorithm(jwk: SignatureJwk): string {
    // Si le JWK porte déjà son alg (RFC 7517 §4.4), on lui fait confiance.
    if (jwk.alg) {
        return jwk.alg;
    }

    if (jwk.kty === 'OKP') {
        if (jwk.crv === 'Ed25519') return 'EdDSA';
        if (jwk.crv === 'X25519') {
            throw new Error('X25519 keys are for key agreement, not signing');
        }
    }

    if (jwk.kty === 'EC') {
        switch (jwk.crv) {
            case 'P-256':
                return 'ES256';
            case 'P-384':
                return 'ES384';
            case 'P-521':
                return 'ES512';
            case 'secp256k1':
                return 'ES256K';
            default:
                throw new Error(`Unsupported EC curve for JWS: ${jwk.crv}`);
        }
    }

    if (jwk.kty === 'RSA') {
        return 'RS256';
    }

    // RFC 9836 (AKP) : pour les algos post-quantiques (ML-DSA, SLH-DSA...),
    // l'alg JOSE correspond généralement directement au nom de la courbe/variante.
    if ((jwk.kty as string) === 'AKP') {
        if (jwk.crv) return jwk.crv;
        throw new Error('AKP key requires "alg" or "crv" to determine JWS algorithm');
    }

    throw new Error(`Cannot determine JWS algorithm from JWK (kty=${jwk.kty}, crv=${jwk.crv})`);
}

export function deriveJwtClaimsFromSignatureContext(
    context: SignatureContext
): Record<string, unknown> {
    const claims: Record<string, unknown> = {};

    if (context.signedAt !== undefined) claims.iat = context.signedAt;
    if (context.notValidBefore !== undefined) claims.nbf = context.notValidBefore;
    if (context.notValidAfter !== undefined) claims.exp = context.notValidAfter;
    if (context.target !== undefined) claims.aud = context.target;

    return claims;
}