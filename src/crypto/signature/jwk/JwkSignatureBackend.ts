import {base64url} from "jose";
import {sha256, sha512} from "@noble/hashes/sha2";
import {
    getPublicKey as getEd25519PublicKey,
    hashes as ed25519Hashes,
    sign as signEd25519,
    utils as ed25519Utils,
    verify as verifyEd25519,
} from "@noble/ed25519";
import {
    etc as secp256k1Etc,
    getPublicKey as getSecp256k1PublicKey,
    sign as signSecp256k1,
    utils as secp256k1Utils,
    verify as verifySecp256k1,
} from "@noble/secp256k1";
import {hmac} from "@noble/hashes/hmac";
import {ml_dsa44, ml_dsa65, ml_dsa87} from "@noble/post-quantum/ml-dsa";
import {randomBytes} from "@noble/post-quantum/utils";
import {
    JwkSignatureAlgorithm,
    JwkSignatureAlgorithmName,
    requireJwkMember,
    resolveJwkSignatureAlgorithmByName,
    SignatureJwk,
} from "./JwkSignatureAlgorithm";
import {getSubtle} from "./webcrypto";

// The @noble packages ship without hash implementations and expect the host to provide them.
ed25519Hashes.sha512 = sha512;
secp256k1Etc.hmacSha256Sync = (key: Uint8Array, ...messages: Uint8Array[]): Uint8Array =>
    hmac(sha256, key, secp256k1Etc.concatBytes(...messages));

/** ML-DSA parameter sets, with the length of the expanded secret key they produce. */
const ML_DSA: Record<string, { readonly module: typeof ml_dsa65; readonly secretKeySize: number }> = {
    "ML-DSA-44": {module: ml_dsa44, secretKeySize: 2560},
    "ML-DSA-65": {module: ml_dsa65, secretKeySize: 4032},
    "ML-DSA-87": {module: ml_dsa87, secretKeySize: 4896},
};

/** Default RSA modulus size used when generating a key, in bits. */
const DEFAULT_RSA_MODULUS_LENGTH = 2048;

/** Signing half of a JWK key pair. */
export interface JwkSigner {
    /** Bare private key material; see {@link JwkPrivateSignatureKey.getRawPrivateKeyBytes}. */
    readonly privateKeyBytes: Uint8Array;

    /**
     * Produces a detached signature over `data`.
     *
     * @param {Uint8Array} data - The message to sign. It is signed as-is, following JOSE semantics.
     * @return {Promise<Uint8Array>} The detached signature.
     */
    sign(data: Uint8Array): Promise<Uint8Array>;
}

/** Verifying half of a JWK key pair. */
export interface JwkVerifier {
    /** Bare public key material; see {@link JwkPublicSignatureKey.getRawPublicKeyBytes}. */
    readonly publicKeyBytes: Uint8Array;

    /**
     * Checks a detached signature over `data`.
     *
     * @param {Uint8Array} data - The signed message.
     * @param {Uint8Array} signature - The detached signature.
     * @return {Promise<boolean>} Whether the signature is valid.
     */
    verify(data: Uint8Array, signature: Uint8Array): Promise<boolean>;
}

/** Options accepted when generating a fresh signature JWK. */
export interface JwkGenerationOptions {
    /** Modulus size in bits, for RSA keys only. Defaults to 2048. */
    modulusLength?: number;
}

/**
 * Builds the signer of a private JWK.
 *
 * @param {JwkSignatureAlgorithm} algorithm - The algorithm resolved from the JWK.
 * @param {SignatureJwk} privateJwk - The sanitised private JWK.
 * @return {Promise<JwkSigner>} The signer bound to that key.
 */
export async function createJwkSigner(
    algorithm: JwkSignatureAlgorithm,
    privateJwk: SignatureJwk,
): Promise<JwkSigner> {
    switch (algorithm.backend) {
        case "webcrypto":
            return createWebCryptoSigner(algorithm, privateJwk);
        case "ed25519":
            return createEd25519Signer(privateJwk);
        case "secp256k1":
            return createSecp256k1Signer(privateJwk);
        case "ml-dsa":
            return createMlDsaSigner(algorithm, privateJwk);
        default:
            throw new Error(`Unsupported signature backend '${algorithm.backend}'`);
    }
}

/**
 * Builds the verifier of a public JWK.
 *
 * @param {JwkSignatureAlgorithm} algorithm - The algorithm resolved from the JWK.
 * @param {SignatureJwk} publicJwk - The sanitised public JWK.
 * @return {Promise<JwkVerifier>} The verifier bound to that key.
 */
export async function createJwkVerifier(
    algorithm: JwkSignatureAlgorithm,
    publicJwk: SignatureJwk,
): Promise<JwkVerifier> {
    switch (algorithm.backend) {
        case "webcrypto":
            return createWebCryptoVerifier(algorithm, publicJwk);
        case "ed25519":
            return createEd25519Verifier(publicJwk);
        case "secp256k1":
            return createSecp256k1Verifier(publicJwk);
        case "ml-dsa":
            return createMlDsaVerifier(algorithm, publicJwk);
        default:
            throw new Error(`Unsupported signature backend '${algorithm.backend}'`);
    }
}

/**
 * Generates a fresh private JWK for the given JOSE algorithm.
 *
 * @param {JwkSignatureAlgorithmName} alg - The JOSE algorithm identifier.
 * @param {JwkGenerationOptions} options - Algorithm-specific generation options.
 * @return {Promise<SignatureJwk>} The generated private JWK.
 */
export async function generateSignatureJwk(
    alg: JwkSignatureAlgorithmName,
    options: JwkGenerationOptions = {},
): Promise<SignatureJwk> {
    const algorithm = resolveJwkSignatureAlgorithmByName(alg);

    switch (algorithm.backend) {
        case "webcrypto": {
            const subtle = getSubtle();
            const keyPair = await subtle.generateKey(
                webCryptoGenerationParams(algorithm, options),
                true,
                ["sign", "verify"],
            ) as CryptoKeyPair;
            return await subtle.exportKey("jwk", keyPair.privateKey) as SignatureJwk;
        }
        case "ed25519": {
            const privateKey = ed25519Utils.randomSecretKey();
            return {
                kty: "OKP",
                crv: "Ed25519",
                d: base64url.encode(privateKey),
                x: base64url.encode(getEd25519PublicKey(privateKey)),
            };
        }
        case "secp256k1": {
            const privateKey = secp256k1Utils.randomPrivateKey();
            // Uncompressed point: 0x04 || X || Y, from which the JWK coordinates are read.
            const publicKey = getSecp256k1PublicKey(privateKey, false);
            return {
                kty: "EC",
                crv: "secp256k1",
                alg: "ES256K",
                d: base64url.encode(privateKey),
                x: base64url.encode(publicKey.slice(1, 33)),
                y: base64url.encode(publicKey.slice(33, 65)),
            };
        }
        case "ml-dsa": {
            const seed = randomBytes(32);
            return {
                kty: "AKP",
                alg: algorithm.alg,
                pub: base64url.encode(mlDsaParameterSet(algorithm).module.keygen(seed).publicKey),
                priv: base64url.encode(seed),
            };
        }
        default:
            throw new Error(`Unsupported signature backend '${algorithm.backend}'`);
    }
}

/**
 * Returns the Web Crypto parameters of an algorithm, failing when it has none.
 *
 * @param {JwkSignatureAlgorithm} algorithm - A Web Crypto backed algorithm.
 * @return {object} The import and sign parameters.
 */
function webCryptoParams(algorithm: JwkSignatureAlgorithm): {
    keyAlgorithm: EcKeyImportParams | RsaHashedImportParams | Algorithm;
    signAlgorithm: EcdsaParams | RsaPssParams | Algorithm;
} {
    const {keyAlgorithm, signAlgorithm} = algorithm;
    if (!keyAlgorithm || !signAlgorithm) {
        throw new Error(`Algorithm '${algorithm.alg}' does not carry Web Crypto parameters`);
    }
    return {keyAlgorithm, signAlgorithm};
}

/**
 * Builds the `SubtleCrypto.generateKey` parameters of a Web Crypto backed algorithm.
 *
 * @param {JwkSignatureAlgorithm} algorithm - The algorithm to generate a key for.
 * @param {JwkGenerationOptions} options - Algorithm-specific generation options.
 * @return {AlgorithmIdentifier | EcKeyGenParams | RsaHashedKeyGenParams} The generation parameters.
 */
function webCryptoGenerationParams(
    algorithm: JwkSignatureAlgorithm,
    options: JwkGenerationOptions,
): EcKeyGenParams | RsaHashedKeyGenParams | Algorithm {
    const {keyAlgorithm} = webCryptoParams(algorithm);
    if (algorithm.kty !== "RSA") return keyAlgorithm as EcKeyGenParams | Algorithm;

    return {
        ...(keyAlgorithm as RsaHashedImportParams),
        modulusLength: options.modulusLength ?? DEFAULT_RSA_MODULUS_LENGTH,
        // 65537, the exponent RFC 7518 recommends.
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
    };
}

/**
 * Builds a signer backed by the Web Crypto API (ECDSA on NIST curves, RSA, Ed448).
 *
 * @param {JwkSignatureAlgorithm} algorithm - The resolved algorithm.
 * @param {SignatureJwk} privateJwk - The sanitised private JWK.
 * @return {Promise<JwkSigner>} The signer.
 */
async function createWebCryptoSigner(
    algorithm: JwkSignatureAlgorithm,
    privateJwk: SignatureJwk,
): Promise<JwkSigner> {
    const subtle = getSubtle();
    const {keyAlgorithm, signAlgorithm} = webCryptoParams(algorithm);
    const privateKey = await subtle.importKey("jwk", privateJwk, keyAlgorithm, true, ["sign"]);

    // An RSA key is not a scalar, so its PKCS#8 encoding stands for the raw private key.
    const privateKeyBytes = algorithm.kty === "RSA"
        ? new Uint8Array(await subtle.exportKey("pkcs8", privateKey))
        : base64url.decode(requireJwkMember(privateJwk, "d"));

    return {
        privateKeyBytes,
        sign: async (data: Uint8Array): Promise<Uint8Array> =>
            new Uint8Array(await subtle.sign(signAlgorithm, privateKey, data as BufferSource)),
    };
}

/**
 * Builds a verifier backed by the Web Crypto API.
 *
 * @param {JwkSignatureAlgorithm} algorithm - The resolved algorithm.
 * @param {SignatureJwk} publicJwk - The sanitised public JWK.
 * @return {Promise<JwkVerifier>} The verifier.
 */
async function createWebCryptoVerifier(
    algorithm: JwkSignatureAlgorithm,
    publicJwk: SignatureJwk,
): Promise<JwkVerifier> {
    const subtle = getSubtle();
    const {keyAlgorithm, signAlgorithm} = webCryptoParams(algorithm);
    const publicKey = await subtle.importKey("jwk", publicJwk, keyAlgorithm, true, ["verify"]);

    // RSA public keys have no raw encoding; SPKI is their canonical byte form.
    const format = algorithm.kty === "RSA" ? "spki" : "raw";
    const publicKeyBytes = new Uint8Array(await subtle.exportKey(format, publicKey));

    return {
        publicKeyBytes,
        verify: (data: Uint8Array, signature: Uint8Array): Promise<boolean> =>
            subtle.verify(signAlgorithm, publicKey, signature as BufferSource, data as BufferSource),
    };
}

/**
 * Builds an Ed25519 signer (RFC 8037), backed by @noble/ed25519.
 *
 * @param {SignatureJwk} privateJwk - The sanitised private JWK.
 * @return {JwkSigner} The signer.
 */
function createEd25519Signer(privateJwk: SignatureJwk): JwkSigner {
    const privateKeyBytes = base64url.decode(requireJwkMember(privateJwk, "d"));
    return {
        privateKeyBytes,
        sign: async (data: Uint8Array): Promise<Uint8Array> => signEd25519(data, privateKeyBytes),
    };
}

/**
 * Builds an Ed25519 verifier (RFC 8037), backed by @noble/ed25519.
 *
 * @param {SignatureJwk} publicJwk - The sanitised public JWK.
 * @return {JwkVerifier} The verifier.
 */
function createEd25519Verifier(publicJwk: SignatureJwk): JwkVerifier {
    const publicKeyBytes = base64url.decode(requireJwkMember(publicJwk, "x"));
    return {
        publicKeyBytes,
        verify: async (data: Uint8Array, signature: Uint8Array): Promise<boolean> =>
            verifyEd25519(signature, data, publicKeyBytes),
    };
}

/**
 * Builds an ES256K signer (RFC 8812), backed by @noble/secp256k1.
 *
 * @param {SignatureJwk} privateJwk - The sanitised private JWK.
 * @return {JwkSigner} The signer.
 */
function createSecp256k1Signer(privateJwk: SignatureJwk): JwkSigner {
    const privateKeyBytes = base64url.decode(requireJwkMember(privateJwk, "d"));
    return {
        privateKeyBytes,
        // ES256K signs SHA-256(message) and encodes the result as the raw R||S pair.
        sign: async (data: Uint8Array): Promise<Uint8Array> =>
            signSecp256k1(sha256(data), privateKeyBytes).toCompactRawBytes(),
    };
}

/**
 * Builds an ES256K verifier (RFC 8812), backed by @noble/secp256k1.
 *
 * @param {SignatureJwk} publicJwk - The sanitised public JWK.
 * @return {JwkVerifier} The verifier.
 */
function createSecp256k1Verifier(publicJwk: SignatureJwk): JwkVerifier {
    const x = base64url.decode(requireJwkMember(publicJwk, "x"));
    const y = base64url.decode(requireJwkMember(publicJwk, "y"));
    const publicKeyBytes = new Uint8Array(1 + x.length + y.length);
    publicKeyBytes[0] = 0x04;
    publicKeyBytes.set(x, 1);
    publicKeyBytes.set(y, 1 + x.length);

    return {
        publicKeyBytes,
        verify: async (data: Uint8Array, signature: Uint8Array): Promise<boolean> =>
            verifySecp256k1(signature, sha256(data), publicKeyBytes),
    };
}

/**
 * Builds an ML-DSA signer (RFC 9836 / FIPS 204), backed by @noble/post-quantum.
 *
 * @param {JwkSignatureAlgorithm} algorithm - The resolved algorithm.
 * @param {SignatureJwk} privateJwk - The sanitised private JWK.
 * @return {JwkSigner} The signer.
 */
function createMlDsaSigner(algorithm: JwkSignatureAlgorithm, privateJwk: SignatureJwk): JwkSigner {
    const {module, secretKeySize} = mlDsaParameterSet(algorithm);
    const privateKeyBytes = base64url.decode(requireJwkMember(privateJwk, "priv"));

    // RFC 9836 stores the 32-byte seed in `priv`; the expanded secret key is accepted as well.
    let secretKey: Uint8Array;
    if (privateKeyBytes.length === 32) {
        secretKey = module.keygen(privateKeyBytes).secretKey;
    } else if (privateKeyBytes.length === secretKeySize) {
        secretKey = privateKeyBytes;
    } else {
        throw new Error(
            `Cannot import AKP JWK: 'priv' is ${privateKeyBytes.length} bytes, ` +
            `expected a 32-byte seed or a ${secretKeySize}-byte ${algorithm.alg} secret key`,
        );
    }

    return {
        privateKeyBytes,
        sign: async (data: Uint8Array): Promise<Uint8Array> => module.sign(secretKey, data),
    };
}

/**
 * Builds an ML-DSA verifier (RFC 9836 / FIPS 204), backed by @noble/post-quantum.
 *
 * @param {JwkSignatureAlgorithm} algorithm - The resolved algorithm.
 * @param {SignatureJwk} publicJwk - The sanitised public JWK.
 * @return {JwkVerifier} The verifier.
 */
function createMlDsaVerifier(algorithm: JwkSignatureAlgorithm, publicJwk: SignatureJwk): JwkVerifier {
    const {module} = mlDsaParameterSet(algorithm);
    const publicKeyBytes = base64url.decode(requireJwkMember(publicJwk, "pub"));

    return {
        publicKeyBytes,
        verify: async (data: Uint8Array, signature: Uint8Array): Promise<boolean> =>
            module.verify(publicKeyBytes, data, signature),
    };
}

/**
 * Returns the ML-DSA parameter set denoted by an algorithm.
 *
 * @param {JwkSignatureAlgorithm} algorithm - An ML-DSA algorithm.
 * @return {object} The @noble module and expanded secret key size of that parameter set.
 */
function mlDsaParameterSet(algorithm: JwkSignatureAlgorithm): { module: typeof ml_dsa65; secretKeySize: number } {
    const parameterSet = ML_DSA[algorithm.alg];
    if (!parameterSet) throw new Error(`Unsupported ML-DSA parameter set '${algorithm.alg}'`);
    return parameterSet;
}
