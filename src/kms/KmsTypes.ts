import {SignatureJwk} from "../crypto/signature/jwk/JwkSignatureAlgorithm";

/** A client public key that may log in to a userspace (Carmentis string encoding, `sig:<alg>:pk:<hex>`). */
export interface KmsAccessKey {
    id: string;
    userspaceId: string;
    publicKey: string;
    label?: string;
    createdAt: string;
}

/** A server-managed signing key. Only its public half is ever returned. */
export interface KmsSigningKey {
    id: string;
    userspaceId: string;
    pluginId: string;
    label?: string;
    publicJwk: SignatureJwk;
    certificates: string[] | null;
    createdAt: string;
}

export interface KmsUserspace {
    id: string;
    label?: string;
    metadata?: Record<string, unknown>;
    createdBy: string;
    createdAt: string;
    accessKeys?: KmsAccessKey[];
    signingKeys?: KmsSigningKey[];
}

/**
 * Methods a plugin or key may support. The server may report others, hence the open string type
 * on {@link KmsKeyCapability.method}.
 */
export type KmsKnownMethod =
    | "key/create" | "key/public" | "sign/raw" | "sign/json"
    | "cert/get" | "cert/create-self-signed" | "cert/csr";

/** A method supported by a plugin or a key. */
export interface KmsKeyCapability {
    method: KmsKnownMethod | (string & {});
    description?: string;
    /** JSON Schema (draft 2020-12) of the method parameters; absent when the method takes none. */
    params?: Record<string, unknown>;
}

/** An installed plugin, as returned by `GET /api/plugins`. */
export interface KmsPlugin {
    id: string;
    name: string;
    description?: string;
    version?: string;
    /** True for the plugin built into the server. */
    builtin: boolean;
    /** URL of the plugin icon. */
    icon?: string;
    capabilities: KmsKeyCapability[];
}

export type KmsSignatureType = "json-canonical+utf8" | "jws";

export interface KmsSignJsonParams {
    /** Any JSON value (an object for the "jws" signature type). */
    payload: unknown;
    /** `purpose` is required, `signedAt` (ms) defaults to now. */
    context: { purpose: string; signedAt?: number; [key: string]: unknown };
    signatureType?: KmsSignatureType;
}

export type KmsSignJsonResult =
    | {
        signatureType: "json-canonical+utf8";
        context: { purpose: string; signedAt: number; [key: string]: unknown };
        /** Base64 signature. */
        signature: string;
        payload: unknown;
        publicKey: string;
    }
    | { signatureType: "jws"; jws: string; publicKey: string };

export type KmsPublicKeyFormat = "jwk" | "carmentis";

export interface KmsCertificateParams {
    subject?: string;
    san?: string[];
    validityDays?: number;
    [key: string]: unknown;
}

export interface KmsSignedChallenge {
    challenge: string;
    publicKey: string;
    /** Base64 signature over the RFC 8785 canonical JSON of `payload`. */
    signature: string;
    payload: Record<string, unknown>;
}

export interface KmsLoginResult {
    token: string;
    /** Session lifetime in seconds. */
    expiresIn: number;
    publicKey: string;
}

export interface KmsKeyReference {
    userspaceId: string;
    keyId: string;
}

/** Supplies the JWT sent as bearer token. */
export interface KmsTokenProvider {
    getToken(): Promise<string>;
    /** Drops any cached token, so the next call to getToken() authenticates again. */
    invalidate(): void;
}
