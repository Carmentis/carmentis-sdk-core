import {describe, expect, it} from "vitest";
import * as jose from "jose";
import {base64url} from "jose";
import {JwkPrivateSignatureKey} from "../../src/crypto/signature/jwk/JwkPrivateSignatureKey";
import {JwkPublicSignatureKey} from "../../src/crypto/signature/jwk/JwkPublicSignatureKey";
import {
    JwkSignatureAlgorithmName,
    SignatureJwk,
} from "../../src/crypto/signature/jwk/JwkSignatureAlgorithm";
import {SignatureSchemeId} from "../../src/crypto/signature/SignatureSchemeId";
import {MLDSA65PrivateSignatureKey, MLDSA65PublicSignatureKey} from "../../src/crypto/signature/ml-dsa-65";
import {CryptoEncoderFactory} from "../../src/crypto/encoder/CryptoEncoderFactory";
import {decode as cborDecode} from "cbor-x";
import {encodeSignatureJwk} from "../../src/crypto/signature/jwk/JwkBinaryEncoder";
import {getSubtle} from "../../src/crypto/signature/jwk/webcrypto";


const MESSAGE = new TextEncoder().encode("The quick brown fox jumps over the lazy dog");
const OTHER_MESSAGE = new TextEncoder().encode("The quick brown fox jumps over the lazy dof");

/** RSA-2048 key pair, used to check that a JWK produced by an external tool imports as-is. */
const RSA_PRIVATE_JWK: SignatureJwk = {
    "p": "-uYxjeuWv_7Refr_YPdmuMSIl6gYdJrDBM75ODPq5UFPwo8BV0_j_je0RTgP9HmUEzSgRtOanjYyvWfBQ43aL-mjkeuTk_1Z-2zON-6guCSj-AsBBWf3iQ6zf_sjpvxhhZm_tY_KbuV4byAOOy8D1FASYFT2Ct4So88IAfC6F_U",
    "kty": "RSA",
    "q": "vVur7bT6rZsIc1LoWwmoJUDtPzoRyM1bQDlA_ls6AB8RDoJ0GwMBQC7RHHBW0CIrEAUY5qMWdAhGhNG62fktdd09fLipX3wpIu08Ygc55qbd-Fyy45OlGPXNJQAG0e5oiy9uVjucXMsFIl3Ca_phcU1Y5i8-qglveAANhj2zfwM",
    "d": "IL1JtkLcNPapEtnF7esn7F3W-lYUJeTkSlfnmyTctvgbF6qRMTmzrpG28cZ9PS5robCK20eYieEl5-as7ALOvGomjMh4Op_dFOJhhx75M_4Vf3Q-f__rl4BXPDE1wtR6vMFmm62U_taxoLZIa19mquyk-ITIl6spHqzNyqYjxjEhIlQ4TUJgzURSH-Skix867ZDEafDOfbEZVFASMW_yc5hdrXLR4e36hFcMjtL14X0jQRrn-BWm3vnPnwCNdugDDeAeOS2UVc_fLXPEZPxqkkSGEEwFGeiaTT-EC_ebQf2xMnOYBh9jaoYDXye2B0THF9WPTSzGJwvKvR22zq9-HQ",
    "e": "AQAB",
    "use": "sig",
    "qi": "J3py8ViA5rO4l5WoHo5rD4A-oTScbdZpiBa6HLqKcGlrcTuE5A2zpMoCuMsOZBvsIICrR9uyItdrz0x3s0aUidLMbg8XBmiT4kzP6cYogIXbx6g8GisLIpqlh34Xuj4OLwTdomptf_6uy0OkwIM7U4MPtOW9JLSDkb1sjPqARBg",
    "dp": "6ykqtSxlRVsfF8eL6WS5YODEbfDdyxzrQOyFZooy1eHbUi4bQazdsv6e9mnPeoMhqMagmwHmX_fIowJGgHzKTjIcX75_uiuyVRfsSTxeY3nkPa6CrIB_4HRpBcFr7y2KcmBi8VfukvZ9ZRqUfCBa5HqQXr4DRrhSnDqF9NuecKk",
    "alg": "RS512",
    "dq": "eRSPIVZiHHRPuP5AmUXZgMi9a3qEOLQnLy_tATfwJHe4_mAoQcVwHUxSZi7nM_tFMd8whvmtt9A6118MbajJit5HHOMvWmEYJL8xpzUbrwLwWIld0ets3EMARDJ6Ke6aZrWThgxj9WnUBJ-TXFwjxsFAoR-AoFWcM01FWJtHlWU",
    "n": "uZXK6h_2QN_cbasOge8OuajEL6EyXMcb6nAEfvmnLtD1sAk68x8vgzxtVAHLOiv4hK5zSrUkti5iOZr7cVoxEpYJV7e_2vrYai7t0jLHorhecxGRq2cp6fd90Gz78BAQ2wlGUKtPF1H4ewWBXBNPIh4LhIc598eZNgl3FMHM1g5CdWBZBKJB-8pCP10Q3CFppapRCXNaTXXxdBeX8R3UgT6fqg2u7BLsJfdV2mNwqkttL8jx1XP32mH6YRRSZEQEofXculqiIcb8JhgPhTBhGVzQQudjmFoLSmQhqjdraZNu59IFf_L90WdYls39JsdLJFYfEFM0Pdn8vbOERV_S3w",
};

/** Public half of {@link RSA_PRIVATE_JWK}, as an external party would publish it. */
const RSA_PUBLIC_JWK: SignatureJwk = {
    "kty": "RSA",
    "e": "AQAB",
    "use": "sig",
    "alg": "RS512",
    "n": RSA_PRIVATE_JWK.n,
};

/**
 * Every supported algorithm, with the expected signature size and, when the raw public
 * key has a fixed length, that length. RSA public keys are SPKI-encoded, whose size
 * depends on the DER framing, so they are left out.
 */
const ALGORITHMS: Array<{
    alg: JwkSignatureAlgorithmName;
    signatureSize: number;
    publicKeySize?: number;
}> = [
    {alg: "ES256", signatureSize: 64, publicKeySize: 65},
    {alg: "ES384", signatureSize: 96, publicKeySize: 97},
    {alg: "ES512", signatureSize: 132, publicKeySize: 133},
    {alg: "ES256K", signatureSize: 64, publicKeySize: 65},
    {alg: "Ed25519", signatureSize: 64, publicKeySize: 32},
    {alg: "Ed448", signatureSize: 114, publicKeySize: 57},
    {alg: "RS256", signatureSize: 256},
    {alg: "RS384", signatureSize: 256},
    {alg: "RS512", signatureSize: 256},
    {alg: "PS256", signatureSize: 256},
    {alg: "PS384", signatureSize: 256},
    {alg: "PS512", signatureSize: 256},
    {alg: "ML-DSA-44", signatureSize: 2420, publicKeySize: 1312},
    {alg: "ML-DSA-65", signatureSize: 3309, publicKeySize: 1952},
    {alg: "ML-DSA-87", signatureSize: 4627, publicKeySize: 2592},
];

describe("JWK signature keys", () => {



    describe("Support web-generated JWK keys", () => {
      it("Should accept EC JWK keys", async () => {
        const sk = await JwkPrivateSignatureKey.fromJwk({
            "kty": "EC",
            "d": "ATxhx4PQ6n-f-wzTWRwgHYa3QQzGIrL-whT8xcoDBhgwqFjWtWAKKtqc7Dq1vpGJYI_7N-cAgOWBg7UtYeNPrYfw",
            "use": "sig",
            "crv": "P-521",
            "x": "Ad0MUlztobzLe0__vGJ7Rqt7aXl0U5mPqbaZuC0cz8eYE8dzU9w0CjSJ5Pm_IdKL64tJORGJ0rs-MyMsC_PrQWim",
            "y": "AF6kceN1OR5MXWNpZkxTMtOKX2BJAXdZYfLTbW6xMvk-Eu5SIIhKqVRlDu2vXdlwi-8V6RHqFa5ERsm8MSBIYUku",
            "alg": "ES512"
        });
        expect(sk.getSignatureSchemeId()).toBe(SignatureSchemeId.JWK);
      })

        it("Should accept EC JWK keys with x5c", async () => {
            const certifiedSk = await JwkPrivateSignatureKey.fromJwk({
                "kty": "EC",
                "crv": "P-256",
                "x": "MnBrYzxoY7MU-GEsl-fwNtyT_pcT6QEAstPgz5lQBBU",
                "y": "26e3Z93SjoBOCBB2-31se6nbQsVYcQU99s9fDF-IIPQ",
                "d": "VSLIJ8eyS8x8d0psavJ7aPUjv488-aOugOkNEk26rSE",
                "x5c": [
                    "MIIBgjCCASegAwIBAgIUeA61msRw8lV9JiUxM/HCMYYXPwowCgYIKoZIzj0EAwIwFjEUMBIGA1UEAwwLZXhhbXBsZS5jb20wHhcNMjYwODI3MDkyMzAzWhcNMzYwODI0MDkyMzAzWjAWMRQwEgYDVQQDDAtleGFtcGxlLmNvbTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABDJwa2M8aGOzFPhhLJfn8Dbck/6XE+kBALLT4M+ZUAQV26e3Z93SjoBOCBB2+31se6nbQsVYcQU99s9fDF+IIPSjUzBRMB0GA1UdDgQWBBQBrKvAQY8iysLTCQC3L46wnQmIBzAfBgNVHSMEGDAWgBQBrKvAQY8iysLTCQC3L46wnQmIBzAPBgNVHRMBAf8EBTADAQH/MAoGCCqGSM49BAMCA0kAMEYCIQDXT5lRdVF1dInSQKfMDGE+pjG+xV/g4NYBr9fZq6f2uAIhAJqtpQY6trm4UHHTJ/yANS6HdfeGQPIYJ/eZtmcWmPLh"
                ],
                "x5t": "NirF7ZlcruuaXANpzNH5nqbDcnA",
                "x5t#S256": "dEFLst7nHDmX7E81TkJL8ACnMOT-5JeuB1XXX7cIL7E",
                "kid": "dEFLst7nHDmX7E81TkJL8ACnMOT-5JeuB1XXX7cIL7E",
                "use": "sig",
                "alg": "ES256"
            })
        })
    })

    const SomeDidsFoundOnline = [
        "did:jwk:eyJraWQiOiJ1cm46aWV0ZjpwYXJhbXM6b2F1dGg6andrLXRodW1icHJpbnQ6c2hhLTI1NjpGZk1iek9qTW1RNGVmVDZrdndUSUpqZWxUcWpsMHhqRUlXUTJxb2JzUk1NIiwia3R5IjoiT0tQIiwiY3J2IjoiRWQyNTUxOSIsImFsZyI6IkVkRFNBIiwieCI6IkFOUmpIX3p4Y0tCeHNqUlBVdHpSYnA3RlNWTEtKWFE5QVBYOU1QMWo3azQifQ",
        "did:jwk:eyJraWQiOiJ1cm46aWV0ZjpwYXJhbXM6b2F1dGg6andrLXRodW1icHJpbnQ6c2hhLTI1Njpnc0w0VTRxX1J6VFhRckpwQUNnZGkwb1lCdUV1QjNZNWZFanhDd1NPUFlBIiwia3R5IjoiRUMiLCJjcnYiOiJQLTM4NCIsImFsZyI6IkVTMzg0IiwieCI6ImEtRWV5T2hlRUNWcDJqRkdVRTNqR0RCNlAzVV80S0lyZHRzTU9RQXFQN0NBMlVvV3NERG1nOWdJUVhiOEthd0ciLCJ5Ijoib3cxWDJ6VFVRaG12elY4NnpHdGhKc0xLeDE2MmhmSmxmN1p0OTFYUnZBTzRScE4zR2RGaVl3Tmc0NXJWUmlUcSJ9",
    ]
    const CarmentisDid = [
        'did:jwk:eyJhbGciOiJSUzI1NiIsImUiOiJBUUFCIiwiZXh0Ijp0cnVlLCJrZXlfb3BzIjpbInZlcmlmeSJdLCJrdHkiOiJSU0EiLCJuIjoidWs0WmZvNFNvel81eFFYd1lqY3hBMlQ5NXVpcDAxbG84U0h0UVNLTmZpTWZjc2RKVVlIck9ITGhTam1kdzJ6OXg2ZUlFSVFCSHNWS2hON1pMdzhRZTdfWmpoYVpCSUFPdmc2X015RlczSVp0WGtGNmNWbUV1TWNpNmd3eVdrNXNseXZYcWl5MzljUjZCSXJEczN3cVB0dWgyY3pJX0hrZ0MzSnAwS0ZIUzEtbFFPaDJDUXFaYTJwcW1lY29BSlVkcWRXVTNKNVNxOEV3V1Vyb0lhVlZqdzdaQzJqbDFCTlIxVkVSTWQ1RzhNSDU0TXlJMXEwN0IxbWdjODJlTkRHTmplVjFnenBTUF9uemNUaURjQVJfRU1mMV95TlYwSGNkUmhmZHhoR3hGLXF6QUtSQmRIYl9oUkFZM29PcEdhc2dHTTdnVXpxaG56S1pCcUV3bXhHWkxlS2piSnl2WTV4bmhadWpPamNwRnBxdTh0blNXMW96QVBtQ1JyWTdNZzRjSGZ0d2ZSY3UwTVkxRl9MWGkwZTVySFhJbW85QkZnZk54dUllQkhYb3p4THEzWllzbnRRREt0NUlxOElOdDJDOTVoaGtUTlZxX2lWUElJc0cyTmlnbTFrMDUzYzJlbFNnNnNUUlI5T1p1ci1oQnJ3Z1BXUHFkRVlsTjFGRDJadHk0YlR3TmRLMWhZNlZUUWpGOHRCcXJQLUpUZXhTLXZzc0RMbDZMbkNQMWFKakhxQlZyNXNZcUM3bWdXMkp6SHNkanVTN2ZvNUNnVGhqVUhkcjQzQ1M1U3o5d1JYbXZ6Q1o2Vncxem1OSGFMZWxtM3VmN2MzTWF3ZGU5bHJHSHpHb0RBUDFoOE9Qd3g0dV9xLVdEcURxdDNIc2JBbHdhWUFYbngyTm9FMVdJdE0iLCJ4NWMiOlsiTUlJSHlqQ0NCYktnQXdJQkFnSVVMYnlraUhWTVhhOVV6Q24wb09seGNwU1dvRFF3RFFZSktvWklodmNOQVFFTEJRQXdlakVMTUFrR0ExVUVCaE1DUmxJeEVUQVBCZ05WQkFvTUNFUkJWRUZUVlZKRk1SMHdHd1lEVlFSaERCUk9WRkpHVWkwNU1EUTJOall5TURNd01EQXhOakVjTUJvR0ExVUVDd3dUTURBd01pQTVNRFEyTmpZeU1ETXdNREF4TmpFYk1Ca0dBMVVFQXd3U1JFRlVRVk5WVWtVZ1IyeHZZbUZzSUVOQk1CNFhEVEkyTURnd016QTNNRGswTlZvWERUSTNNRGd3TXpBM01EazBOVm93YXpFTE1Ba0dBMVVFQmhNQ1JsSXhFakFRQmdOVkJBb01DVU5oY20xbGJuUnBjekVZTUJZR0ExVUVZUXdQVGxSU1JsSXRPVEV6TnpJM01qSTRNUzR3TEFZRFZRUUREQ1ZEWVhKdFpXNTBhWE1nTFNCUmRXRnNhV1pwWldRZ1JXeGxZM1J5YjI1cFl5QlRaV0ZzTUlJQ0lqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FnOEFNSUlDQ2dLQ0FnRUF1azRaZm80U296LzV4UVh3WWpjeEEyVDk1dWlwMDFsbzhTSHRRU0tOZmlNZmNzZEpVWUhyT0hMaFNqbWR3Mno5eDZlSUVJUUJIc1ZLaE43Wkx3OFFlNy9aamhhWkJJQU92ZzYvTXlGVzNJWnRYa0Y2Y1ZtRXVNY2k2Z3d5V2s1c2x5dlhxaXkzOWNSNkJJckRzM3dxUHR1aDJjekkvSGtnQzNKcDBLRkhTMStsUU9oMkNRcVphMnBxbWVjb0FKVWRxZFdVM0o1U3E4RXdXVXJvSWFWVmp3N1pDMmpsMUJOUjFWRVJNZDVHOE1INTRNeUkxcTA3QjFtZ2M4MmVOREdOamVWMWd6cFNQL256Y1RpRGNBUi9FTWYxL3lOVjBIY2RSaGZkeGhHeEYrcXpBS1JCZEhiL2hSQVkzb09wR2FzZ0dNN2dVenFobnpLWkJxRXdteEdaTGVLamJKeXZZNXhuaFp1ak9qY3BGcHF1OHRuU1cxb3pBUG1DUnJZN01nNGNIZnR3ZlJjdTBNWTFGL0xYaTBlNXJIWEltbzlCRmdmTnh1SWVCSFhvenhMcTNaWXNudFFES3Q1SXE4SU50MkM5NWhoa1ROVnEvaVZQSUlzRzJOaWdtMWswNTNjMmVsU2c2c1RSUjlPWnVyK2hCcndnUFdQcWRFWWxOMUZEMlp0eTRiVHdOZEsxaFk2VlRRakY4dEJxclArSlRleFMrdnNzRExsNkxuQ1AxYUpqSHFCVnI1c1lxQzdtZ1cySnpIc2RqdVM3Zm81Q2dUaGpVSGRyNDNDUzVTejl3UlhtdnpDWjZWdzF6bU5IYUxlbG0zdWY3YzNNYXdkZTlsckdIekdvREFQMWg4T1B3eDR1L3ErV0RxRHF0M0hzYkFsd2FZQVhueDJOb0UxV0l0TUNBd0VBQWFPQ0FsVXdnZ0pSTUIwR0ExVWREZ1FXQkJRYVl6dUZmRXNNeUFKY0JMajdRVXRrRFpKUU5EQWZCZ05WSFNNRUdEQVdnQlFrS3RoN3RYd3o2czFWYVpTTEE2cm1MQzlIU1RBT0JnTlZIUThCQWY4RUJBTUNCc0F3RXdZRFZSMGxCQXd3Q2dZSUt3WUJCUVVIQXdRd2V3WUlLd1lCQlFVSEFRTUViekJ0TUFnR0JnUUFqa1lCQVRCQ0JnWUVBSTVHQVFVd09EQTJGakJvZEhSd2N6b3ZMM2QzZHk1a1lYUmhjM1Z5WlM1dVpYUXZaRzkzYm14dllXUXZjR1J6TFdkc2IySmhiQzV3WkdZVEFtVnVNQWdHQmdRQWprWUJCREFUQmdZRUFJNUdBUVl3Q1FZSEJBQ09SZ0VHQWpCT0JnTlZIUjhFUnpCRk1FT2dRYUEvaGoxb2RIUndPaTh2Y0d0cExYQXVaR0YwWVhOMWNtVXVibVYwTDJSaGRHRnpkWEpsTDJOeWJDOUVRVlJCVTFWU1JWOUhiRzlpWVd4ZlEwRXVZM0pzTUNRR0ExVWRFUVFkTUJ1QkdXcDFiR2xsYmk1aWNtRjFia0JqWVhKdFpXNTBhWE11YVc4d1d3WURWUjBnQkZRd1VqQlFCZzhyQmdFRUFZUExBUUlCQVFFQkFnRXdQVEE3QmdnckJnRUZCUWNDQVJZdmFIUjBjSE02THk5M2QzY3VaR0YwWVhOMWNtVXVibVYwTDJSdmQyNXNiMkZrTDNCakxXZHNiMkpoYkM1d1pHWXdnWmtHQ0NzR0FRVUZCd0VCQklHTU1JR0pNRGtHQ0NzR0FRVUZCekFCaGkxb2RIUndPaTh2YjJOemNDMXdMbVJoZEdGemRYSmxMbTVsZEM5RVFWUkJVMVZTUlY5SGJHOWlZV3hmUTBFd1RBWUlLd1lCQlFVSE1BS0dRR2gwZEhBNkx5OXdhMmt0Y0M1a1lYUmhjM1Z5WlM1dVpYUXZaR0YwWVhOMWNtVXZZMkZqWlhKMEwwUkJWRUZUVlZKRlgwZHNiMkpoYkY5RFFTNWpaWEl3RFFZSktvWklodmNOQVFFTEJRQURnZ0lCQUhYOXFkZmxXTDJtMjExTU83MlhSQkxaQWhSTlh5RUJWdlp0LzBLdDA2Y01HT3lYenBhYWZqTDRXSzFkUG1Ia3RXWHVkSk1NT3NVUGVySjk4dHJBS1V0YW1NNUpiN0ZXTEVBTlZLYjZocTRqVDBGUHZUSmdKUVl1Z3FMeml3aC8wOU12MWhJU2t3b1kzeE9GOG1EYjhDQUIyRkd5LzBaaFd3K1BwSFBNWGc0elFhazVxcE14ampQc1pnOGVqdTN3V0NZSGhZTTRXNHlMUWhVL2lyUXliSHozcWRFSzc4V2NHRFBHZ3lUeE5PSnNrSEtBWUNiTEpPN2dkcm1YOGV5RVlzK1BhTHBFcjgxNTBUeWJlcENSK3hXeEN4Nnd4ZkQ5SUduUEZ3emRYMHZ1RldtejRlWEYzKzJ4azV5K1RMbk9wLzZTYUJFSytzZjk5YmVqWkh3R2Z5RHZKWXNqalFRUWFjQjY3MzRaZ0dyZ0cyakRXZVkyd1JjU2NxZkU1YXlSMTFVNTdPM2JKVkFRWDVyaVNPNUM1YkprdU15OVc5dVRnck9VZGZTbElSK2VTcUpEcnNWOFhGcDVpVVEwaFY4dXhKa1JkTWtiZU5PSjEyNHpMNnhJb015a1VpdnhCWFpNRlpSMlhaV0dPWHdPWm1NOG0zSHVuMEJpWVhTaDZWeTBMRm1NRHAwcWg4MnRTbkM2Q24yS3dxUklZdk5XSGJXZkppWlVkZmtHQTkxaHIwWmZ4U1FvTm1WR1dzVTlYWkRCOWhMT1dtaCtqQUp1bjU2YTJ5dk9nZ3Y0cW1mL0VGR0JBaTZSKytPV1hXTHIrY0V0bC8wcm9pSUx1SGcvcW1GUXBQQjNjeUFyVllITFdIWXgvVlExSllXOTdUNTJ4L3hLZE51MTFmNUZIci84IiwiTUlJRzRqQ0NCTXFnQXdJQkFnSVNFU0I0SStPUXpnSmxOWTFIbVBxTTVaMDVNQTBHQ1NxR1NJYjNEUUVCQ3dVQU1IZ3hDekFKQmdOVkJBWVRBa1pTTVJFd0R3WURWUVFLREFoRVFWUkJVMVZTUlRFZE1Cc0dBMVVFWVF3VVRsUlNSbEl0T1RBME5qWTJNakF6TURBd01UWXhIREFhQmdOVkJBc01FekF3TURJZ09UQTBOalkyTWpBek1EQXdNVFl4R1RBWEJnTlZCQU1NRUVSQlZFRlRWVkpGSUZKdmIzUWdRMEV3SGhjTk1qUXdPVEEwTURBd01EQXdXaGNOTXpRd09UQTBNREF3TURBd1dqQjZNUXN3Q1FZRFZRUUdFd0pHVWpFUk1BOEdBMVVFQ2d3SVJFRlVRVk5WVWtVeEhUQWJCZ05WQkdFTUZFNVVVa1pTTFRrd05EWTJOakl3TXpBd01ERTJNUnd3R2dZRFZRUUxEQk13TURBeUlEa3dORFkyTmpJd016QXdNREUyTVJzd0dRWURWUVFEREJKRVFWUkJVMVZTUlNCSGJHOWlZV3dnUTBFd2dnSWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUNEd0F3Z2dJS0FvSUNBUUN6aHYrZ2FvNEt5M3AzS3k1cDV2Nk1kcldXNjVwSnJlWHBrTmNBQnUrL1FQaWdJM3NrSFhPd3JuU0d0U3BmbTlmWXJRWGZiMkVhMjgxYXFjTUE0TVRBV2E5OTRZYnFKbVM2dkVrRm5UR0hWUUsyRDR0cDRibzhBWU4wNElHWWJGN3gySFgzVStiYkg2dGozTWJWNDZSKzRGQm1IN241NVorV3pXOGhoL1B3TWRTbEN4YmJlZlRPcm15NjBlOHIzV1Zxa2JpS1dGRjJhVHpjWmoydnZHQWt6VDZ6SytXbnJJbHpNOCtSTnBqY3MvQ0k2bUhNYkh5UG5SL1Z3T2VLQWl2VENQSEF3QUlpTWFoYm1lOUxIYVFINHRtbDM1YXpNcW1rMlhSNHhRaFBBOWpzOGFSd3N1VCtycFBiTVBJS0hERGREaTlGM1UzOFl3ZEhKaHU5emM4UGFiQUhSbmZCdGliRDN3MFlDTkdWcUkzRUFWbEFCVnNIcVc2NERzUk4rc1lndTBOTzEvVzY5VEpVQVR5blRscSthY0kyaXhRcnF1TWZmY0NvSm9TUXcwdG5CV2FyTlZKZnFySk1FUjg4VG1qVjZMSUc4ZTM5cE9VRWlHUC9LMVVONzBrdzZhM0lCa3RlUWw1bmhBMmdwUldDQTBWbmEweWYrenJHSVBhcitVOGhEb3lZS2RJNzdXNm12dG5wVVBZSmN3MktlMU9VdnZueGZMM3ZLVTJkVFRxU1hZNUdrSTd3b3Jiem1ZSzVNVjM4VlpYV2JlS0Z4dDY3TkorRG1YbGFNMkRBMTdqamljT00yYzJmZEN6MU41OFFLTEdzKytxV2cxQ2dNb0dnaFBrSHBDbnJBdjJpZGpTNmZBUlE4UXk1TzluOTl4cnA2RTU2RFoxbWdwcUc3d0lEQVFBQm80SUJZakNDQVY0d0RnWURWUjBQQVFIL0JBUURBZ0VHTUU0R0ExVWRJQVJITUVVd1F3WUVWUjBnQURBN01Ea0dDQ3NHQVFVRkJ3SUJGaTFvZEhSd2N6b3ZMM2QzZHk1a1lYUmhjM1Z5WlM1dVpYUXZaRzkzYm14dllXUXZjR010Y205dmRDNXdaR1l3RWdZRFZSMFRBUUgvQkFnd0JnRUIvd0lCQURCTUJnTlZIUjhFUlRCRE1FR2dQNkE5aGp0b2RIUndPaTh2Y0d0cExYQXVaR0YwWVhOMWNtVXVibVYwTDJSaGRHRnpkWEpsTDJGeWJDOUVRVlJCVTFWU1JWOVNiMjkwWDBOQkxtTnliREJhQmdnckJnRUZCUWNCQVFST01Fd3dTZ1lJS3dZQkJRVUhNQUtHUG1oMGRIQTZMeTl3YTJrdGNDNWtZWFJoYzNWeVpTNXVaWFF2WkdGMFlYTjFjbVV2WTJGalpYSjBMMFJCVkVGVFZWSkZYMUp2YjNSZlEwRXVZMlZ5TUIwR0ExVWREZ1FXQkJRa0t0aDd0WHd6NnMxVmFaU0xBNnJtTEM5SFNUQWZCZ05WSFNNRUdEQVdnQlNDZHBhbFVzUWJFMDFmdFB2QWlzcmExTzNTUnpBTkJna3Foa2lHOXcwQkFRc0ZBQU9DQWdFQTBMclQrbmdUWHRrMEduUk5tUmZyNWRaWVpGUGFrTmd6VkRRWFJZVWVwWU5pVTdtc0w3QTlGYUE5YnNlc1pXY2FKTFhnaW9DdWdOZkMrUHh3N0ROQU1yankzTGYyR3dqRzdwbUs3ZDFCYTUyMjl2cVNBcVc0cWxtTCttQ1BHMXZJcWZSZWVPL01pWFRGL0VOMTc1WHpHTXAvekVWQ1c1ZWFuZ2ZVVmdYRUsyUGhTL1JVTEdXelNtclJJdGdUQUV1SVkwOFBLTS9YMzJaYUZ5K3BtZk5PaWRwUXFvdEY2SE5HWjA3WnBSeTFzV0U5dXY1czk5NU5RamlsNG1wcEN3d05yQm5SZ25qYXZrMGFCR2hXL2NiV1BjbnJ5bkFmakxmdVJYRUxhTFFJMGhpckdJZFp3NkROQzBndFN4b3Z2RzF4UWlBcW11akozc1FncmM2VWF4NkNkQTI0Sytmbm1PK0JGem1JMmgxMzRCbWk1L00yQ250Mk92VVAzSDhxbDNBQ2J2WEFFS25VWjdTTnpLdUJQK0xMekZYU3gzTlV5YitGSmVvUEtxSTZmTmJrS2NlUXZ1S0ZhOW1qNG1EN2NDQy9GakFsaTh3MEVZMmRkWXMwZTR1WU1NSmIvbm1OeWd3Snd1VmVTbmFKY2FaYWhaVnhhTnArRTJhWlBLeU9qTnQ4NmJDUGJlZUN0c1hQK21HRHhqNlhuVFJqZy91alJUUlN1QWxDMjd1Wm1iM0JRc2N3cCt5c3RQZ1VmRHBtOVBLdHNEU3huWXZlTmhIRG1zSlJTVEVqb1JqWlIwTldzOHE2VnVwUnNPSFh3YXFlcEo0VmVRSkFFSlYrb0FYdHdhcCtZMnRxbWZzblZJakh3RHNGS1UxVXpPeCtKaTF6YUhScnJtL3ZSbk9kclhRPSIsIk1JSUdNVENDQkJtZ0F3SUJBZ0lTRVNERGIydnk5bHJiS3M5eVNtM1cydFpYTUEwR0NTcUdTSWIzRFFFQkN3VUFNSGd4Q3pBSkJnTlZCQVlUQWtaU01SRXdEd1lEVlFRS0RBaEVRVlJCVTFWU1JURWRNQnNHQTFVRVlRd1VUbFJTUmxJdE9UQTBOalkyTWpBek1EQXdNVFl4SERBYUJnTlZCQXNNRXpBd01ESWdPVEEwTmpZMk1qQXpNREF3TVRZeEdUQVhCZ05WQkFNTUVFUkJWRUZUVlZKRklGSnZiM1FnUTBFd0hoY05NalF3T1RBME1EQXdNREF3V2hjTk5Ea3dPVEEwTURBd01EQXdXakI0TVFzd0NRWURWUVFHRXdKR1VqRVJNQThHQTFVRUNnd0lSRUZVUVZOVlVrVXhIVEFiQmdOVkJHRU1GRTVVVWtaU0xUa3dORFkyTmpJd016QXdNREUyTVJ3d0dnWURWUVFMREJNd01EQXlJRGt3TkRZMk5qSXdNekF3TURFMk1Sa3dGd1lEVlFRRERCQkVRVlJCVTFWU1JTQlNiMjkwSUVOQk1JSUNJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBZzhBTUlJQ0NnS0NBZ0VBOGNIU1BLUURrTU9yQTkzcGx1WmpJbGRidGxZSFpnSlQ5YzBWNXVzM05rQlBiV2VkWDlNSklhRStRZVIzbHltMlBhTmtkczBiSmpUNUREUVJyWmNZNk9nR2Z4ZTZQK2s1MGhKRU0yWFBJMHk3U0tXVWhOOHY4MFJyRFgwaHZWelc2SVBQcWxPT28veWl5ajhJcHhnTWovT1ZYTFBZdVBJV0VtcnVTZ3JFZzlGUDYwTitBMU9wTXAza0pkQXUrTW9kZldoaHp1SlJDdko1Vkl6R3NvNzNRNWVLd3o5YTNSMiszTkZWaW9GNUN4aTViNjFwaSszT3dFSTlnd1Z0QlgvanZienBLRWx3a09vK1RiWFpkVmYvTW1DOE93dE1rV1pKaUlsTjdEVVpoSFdFMWwyOTY2YUhUWHc4Y3VrS1ZZWWJxRURkUkVmZGRoY0xSYllONnZEUlh3Y3g4U3lCa1BWWFhOTDZlZmlIb2FJOVpBeUhsN2Y0TEE2WThaM2J3Yk9NQnVqdkhGOWVSRFM5Rk9OQ2s4Z1lPN0dadU5GOFg2YVJ5UGIvQmtlekltTnVIaGVDYzlsMFlBMDZBZ0E2Qmg5ZUYxWEoxUVVtZHlRcnR1NjlWN0dtQkQ3dStoUjBLSi9nd3ZZSndOMFV5OFVQekFrUjFrSXlTeTQxRzk3bHlVRE9sRSszRUZhdXVsZXZYc2xoWVF5Z05MaW0rc2ZHQ0taNThaRkFwU0tZSmREV0pjODlxREhzSGViTUJ6T1JoVVlJRUZiNjNtdkxYN0orRHFnYW52RktKNkJrejVPRzR5Wjl1VGYxKzBWazJnQmFmbi9nTUJsdWh1MHZZMUx4VXMyWisycEdZRHZFRy9qZFljMk5pU0pDVDlaWDNrSnVEQTRwUTFvaFNGUkhESzBDQXdFQUFhT0J0RENCc1RBT0JnTlZIUThCQWY4RUJBTUNBUVl3VGdZRFZSMGdCRWN3UlRCREJnUlZIU0FBTURzd09RWUlLd1lCQlFVSEFnRVdMV2gwZEhCek9pOHZkM2QzTG1SaGRHRnpkWEpsTG01bGRDOWtiM2R1Ykc5aFpDOXdZeTF5YjI5MExuQmtaakFQQmdOVkhSTUJBZjhFQlRBREFRSC9NQjBHQTFVZERnUVdCQlNDZHBhbFVzUWJFMDFmdFB2QWlzcmExTzNTUnpBZkJnTlZIU01FR0RBV2dCU0NkcGFsVXNRYkUwMWZ0UHZBaXNyYTFPM1NSekFOQmdrcWhraUc5dzBCQVFzRkFBT0NBZ0VBcXZhVzZkOFB5dVBJaXFRaGRQbEpVV0tzdzJIUnA5eVo3QmJaa3FDelFoTmpKV2l4ajdtQjBBNDlWa0F6SHlBZThtS3BLWTFySHpueDE0RkkrTTdLbWlWRWpQNE9YTUc3K09LL0F4ZzJUSU5LTW83RDV2WmZ2RVFOWStSOXMxUjRzd2NEZlNoZmUxR3RTQmYrQytFbVRkZmJJbG5lVGF2YzNWTGtNSW4vQzM5U3F0OWdTREkrSzg4ZDJOKy9xQzdpR2V3SjRSV0RkZVR6WGFqOEtxZVQ2VlZROTBOMnc2WVZCYzdFd0xPd0NPalJzL2tsdElmUjd2SDFxU1ZGdlh1eEdEaHVKWFJNeTZoc2Z6Z2NHb2M4bEZFemV3U2pYSmRjZXcyYWdXNGhYTFZEazhuY2lJVFdsNzJMdnpRSlFuSUlrRi9hN1lmS21YZVN2SUNBWUN2MDBPbGVDak05dzRmaVV5TjE0aWVwWFJNVDRkcDU2WHZ2UGE0aERCSDBVREhKNkNyMVM0Z2ZtMDBQbStoUFNoaWRFMFl1LzRuVG9XT0JITTNzcUMrOFY0ejV0NDR6bVlPcUZFNkEybHRRUkhBT09ZVWxLSUhabklMQm02TVFYNnExUkJkK0RNRk1jN010S09FSkhjNkpzWEtuK1lURmp1WHdWSXkxYkpaamwzampPL1NCSm8vdnJYVXJERVlOSjM2MlFpV091YXkvNStUNEU5N0NmYVBCd0oxU1JtUjBUOTJKaGtJcCtJZ3FDK2hHZ2gwa1AvYTJYd2toTkpxU2FIT1lKbzc2MURjMU1uU2ZENDBvNm1halNkM3ZoY1FLWGNNQkkxdWlHamlUcTd2ZmNJZWg1aXlMRWZtVXowejZiazNnQ0VXYUNxOXZDOHVhbElIaXUzaFN2cjA9Il19'
    ]

    describe("Support for did encoding", async () => {
        it.each(ALGORITHMS)("encode $alg to did and decode", async ({alg}) => {
            const privateKey = await JwkPrivateSignatureKey.gen(alg);
            const publicKey = await privateKey.getPublicKey();
            const encoder = CryptoEncoderFactory.defaultStringSignatureEncoder();
            const encoded = await encoder.encodePublicKey(publicKey);
            expect(encoded.startsWith('did:jwk')).toBeTruthy();
            const decoded = await encoder.decodePublicKey(encoded);
            expect(await encoder.encodePublicKey(decoded)).toEqual(encoded);
        })

        it
            .each([
                ...SomeDidsFoundOnline,
                ...CarmentisDid
            ])("decode $did and re-encode it canonically", async (did) => {
                const encoder = CryptoEncoderFactory.defaultStringSignatureEncoder();
                const decoded = await encoder.decodePublicKey(did);
                const canonical = await encoder.encodePublicKey(decoded);

                // The re-encoded DID is not the input one: these DIDs all carry members
                // beyond the key itself — `kid`, `key_ops`, `ext`, `x5c` — which the
                // import drops. It is stable from the first re-encoding onwards.
                expect(canonical.startsWith("did:jwk:")).toBeTruthy();
                expect(await encoder.encodePublicKey(await encoder.decodePublicKey(canonical)))
                    .toEqual(canonical);

                const jwk = (decoded as JwkPublicSignatureKey).getPublicJwk();
                for (const member of ["kid", "use", "key_ops", "ext", "x5c", "x5t", "x5u", "x5t#S256"]) {
                    expect(jwk, `canonical JWK must not expose '${member}'`).not.toHaveProperty(member);
                }
            })
    })

    describe("JWK uniformisation", () => {
        it('should lead to the same public key', async () => {
            const jwk1 = {
                "kty": "EC",
                "alg": "ES384",
                "use": "sig",
                "crv": "P-384",
                "x": "a-EeyOheECVp2jFGUE3jGDB6P3U_4KIrdtsMOQAqP7CA2UoWsDDmg9gIQXb8KawG",
                "y": "ow1X2zTUQhmvzV86zGthJsLKx162hfJlf7Zt91XRvAO4RpN3GdFiYwNg45rVRiTq",
            }

            const jwk2 = {
                "kid": "urn:ietf:params:oauth:jwk-thumbprint:sha-256:gsL4U4q_RzTXQrJpACgdi0oYBuEuB3Y5fEjxCwSOPYA",
                "kty": "EC",
                "crv": "P-384",
                "alg": "ES384",
                "x": "a-EeyOheECVp2jFGUE3jGDB6P3U_4KIrdtsMOQAqP7CA2UoWsDDmg9gIQXb8KawG",
                "y": "ow1X2zTUQhmvzV86zGthJsLKx162hfJlf7Zt91XRvAO4RpN3GdFiYwNg45rVRiTq"
            }

            const encoder = CryptoEncoderFactory.defaultStringSignatureEncoder();
            const pk1 = await JwkPublicSignatureKey.fromJwk(jwk1);
            const pk2 = await JwkPublicSignatureKey.fromJwk(jwk2);
            expect(await pk1.getPublicKeyAsBytes()).toEqual(await pk2.getPublicKeyAsBytes());
            expect(await encoder.encodePublicKey(pk1)).toEqual(await encoder.encodePublicKey(pk2));
        });
    })

    /** Members the canonical form keeps for each key type, in the order it keeps them in. */
    const CANONICAL_MEMBERS: Record<string, { publicMembers: string[]; privateMembers: string[] }> = {
        EC: {publicMembers: ["crv", "kty", "x", "y"], privateMembers: ["crv", "d", "kty", "x", "y"]},
        OKP: {publicMembers: ["crv", "kty", "x"], privateMembers: ["crv", "d", "kty", "x"]},
        // `alg` stays on RSA and AKP keys, whose primitive the key material does not imply.
        RSA: {
            publicMembers: ["alg", "e", "kty", "n"],
            privateMembers: ["alg", "d", "dp", "dq", "e", "kty", "n", "p", "q", "qi"],
        },
        AKP: {publicMembers: ["alg", "kty", "pub"], privateMembers: ["alg", "kty", "priv", "pub"]},
    };

    /** Members a JWK may carry beyond the key, all of which the import has to drop. */
    const DESCRIPTIVE_MEMBERS = {
        use: "sig",
        key_ops: ["sign", "verify"],
        ext: true,
        kid: "urn:ietf:params:oauth:jwk-thumbprint:sha-256:gsL4U4q_RzTXQrJpACgdi0oYBuEuB3Y5fEjxCwSOPYA",
        x5u: "https://example.com/certificates",
        x5c: ["MIIBgjCCASegAwIBAgIUeA61msRw8lV9JiUxM"],
        x5t: "NirF7ZlcruuaXANpzNH5nqbDcnA",
        "x5t#S256": "dEFLst7nHDmX7E81TkJL8ACnMOT-5JeuB1XXX7cIL7E",
        unrecognised_member: "dropped as well",
    };

    describe("canonical form", () => {
        it.each(ALGORITHMS)("keeps only the members that model a $alg key", async ({alg}) => {
            const privateKey = await JwkPrivateSignatureKey.gen(alg);
            const publicKey = await privateKey.getPublicKey();
            const expected = CANONICAL_MEMBERS[privateKey.getPrivateJwk().kty as string];

            expect(Object.keys(privateKey.getPrivateJwk())).toEqual(expected.privateMembers);
            expect(Object.keys(privateKey.getPublicJwk())).toEqual(expected.publicMembers);
            expect(Object.keys(publicKey.getPublicJwk())).toEqual(expected.publicMembers);
        });

        it.each(ALGORITHMS)("drops every descriptive member of a $alg JWK", async ({alg}) => {
            const generated = await JwkPrivateSignatureKey.gen(alg);
            const decorated = {...generated.getPrivateJwk(), ...DESCRIPTIVE_MEMBERS};

            const privateKey = await JwkPrivateSignatureKey.fromJwk(decorated);
            expect(privateKey.getPrivateJwk()).toEqual(generated.getPrivateJwk());
            expect(privateKey.getPrivateKeyAsBytes()).toEqual(generated.getPrivateKeyAsBytes());

            const publicKey = await JwkPublicSignatureKey.fromJwk(decorated);
            expect(publicKey.getPublicJwk()).toEqual(generated.getPublicJwk());
            expect(await publicKey.getPublicKeyAsBytes())
                .toEqual(await (await generated.getPublicKey()).getPublicKeyAsBytes());
        });

        it("orders the members lexicographically, whatever order they arrived in", async () => {
            const generated = await JwkPrivateSignatureKey.gen("ES256");
            const shuffled = Object.fromEntries(
                Object.entries({...generated.getPrivateJwk(), ...DESCRIPTIVE_MEMBERS}).reverse(),
            ) as SignatureJwk;

            const privateKey = await JwkPrivateSignatureKey.fromJwk(shuffled);
            expect(Object.keys(privateKey.getPrivateJwk())).toEqual(["crv", "d", "kty", "x", "y"]);
            expect(privateKey.getPrivateKeyAsBytes()).toEqual(generated.getPrivateKeyAsBytes());
        });

        it("normalises the 'EdDSA' spelling RFC 8037 gave the OKP curves", async () => {
            const generated = await JwkPrivateSignatureKey.gen("Ed25519");
            const privateKey = await JwkPrivateSignatureKey.fromJwk({
                ...generated.getPrivateJwk(),
                alg: "EdDSA",
            });

            expect(privateKey.getAlgorithm()).toBe("Ed25519");
            expect(privateKey.getPrivateKeyAsBytes()).toEqual(generated.getPrivateKeyAsBytes());
        });
    });

    describe("binary encoding", () => {
        it.each(ALGORITHMS)("round-trips a $alg private key through its binary form", async ({alg}) => {
            const privateKey = await JwkPrivateSignatureKey.gen(alg);
            const restored = await JwkPrivateSignatureKey.fromBytes(privateKey.getPrivateKeyAsBytes());

            expect(restored.getAlgorithm()).toBe(alg);
            expect(restored.getPrivateJwk()).toEqual(privateKey.getPrivateJwk());
            expect(restored.getPrivateKeyAsBytes()).toEqual(privateKey.getPrivateKeyAsBytes());

            // Signatures cross-verify both ways, so the restored key is the same key.
            await expect((await privateKey.getPublicKey()).verify(MESSAGE, await restored.sign(MESSAGE)))
                .resolves.toBe(true);
            await expect((await restored.getPublicKey()).verify(MESSAGE, await privateKey.sign(MESSAGE)))
                .resolves.toBe(true);
        });

        it.each(ALGORITHMS)("round-trips a $alg public key through its binary form", async ({alg}) => {
            const privateKey = await JwkPrivateSignatureKey.gen(alg);
            const publicKey = await privateKey.getPublicKey();
            const restored = await JwkPublicSignatureKey.fromBytes(await publicKey.getPublicKeyAsBytes());

            expect(restored.getAlgorithm()).toBe(alg);
            expect(restored.getPublicJwk()).toEqual(publicKey.getPublicJwk());
            expect(await restored.getPublicKeyAsBytes()).toEqual(await publicKey.getPublicKeyAsBytes());
            await expect(restored.verify(MESSAGE, await privateKey.sign(MESSAGE))).resolves.toBe(true);
        });

        it.each(ALGORITHMS)("encodes a $alg key as sorted CBOR any decoder reads", async ({alg}) => {
            const privateKey = await JwkPrivateSignatureKey.gen(alg);
            const publicKey = await privateKey.getPublicKey();

            // Read back with the stock cbor-x decoder rather than the SDK one: the payload
            // has to be plain CBOR maps, not the cbor-x record dialect.
            for (const [jwk, bytes] of [
                [privateKey.getPrivateJwk(), privateKey.getPrivateKeyAsBytes()],
                [publicKey.getPublicJwk(), await publicKey.getPublicKeyAsBytes()],
            ] as Array<[SignatureJwk, Uint8Array]>) {
                const decoded = cborDecode(bytes) as Record<string, unknown>;
                expect(decoded).toEqual(jwk);
                expect(Object.keys(decoded)).toEqual([...Object.keys(decoded)].sort());
            }
        });

        it("keeps the private members out of the public binary form", async () => {
            const privateKey = await JwkPrivateSignatureKey.fromJwk(RSA_PRIVATE_JWK);
            const publicKey = await privateKey.getPublicKey();
            const decoded = cborDecode(await publicKey.getPublicKeyAsBytes()) as Record<string, unknown>;

            expect(Object.keys(decoded)).toEqual(["alg", "e", "kty", "n"]);
        });

        it("rejects a payload that is not CBOR, or does not hold a map", async () => {
            await expect(JwkPublicSignatureKey.fromBytes(new Uint8Array([0x01, 0x02, 0x03])))
                .rejects.toThrow(/not valid CBOR/);
            await expect(JwkPrivateSignatureKey.fromBytes(new Uint8Array()))
                .rejects.toThrow(/not valid CBOR/);
            // 0x82 0x01 0x02: the CBOR array [1, 2].
            await expect(JwkPublicSignatureKey.fromBytes(new Uint8Array([0x82, 0x01, 0x02])))
                .rejects.toThrow(/does not hold a map/);
        });

        it("reports a payload holding a malformed JWK the way the JWK import would", async () => {
            const jwk = cborDecode(
                (await JwkPrivateSignatureKey.gen("ES256")).getPrivateKeyAsBytes(),
            ) as Record<string, unknown>;
            delete jwk.y;

            await expect(JwkPublicSignatureKey.fromBytes(encodeSignatureJwk(jwk as SignatureJwk)))
                .rejects.toThrow(/missing public member 'y'/);
        });

        it.each(ALGORITHMS)("round-trips a $alg private key through the string encoder", async ({alg}) => {
            const encoder = CryptoEncoderFactory.defaultStringSignatureEncoder();
            const privateKey = await JwkPrivateSignatureKey.gen(alg);
            const encoded = await encoder.encodePrivateKey(privateKey);

            expect(encoded.startsWith("sig:jwk:sk:")).toBeTruthy();
            const decoded = await encoder.decodePrivateKey(encoded);
            expect(await encoder.encodePrivateKey(decoded)).toEqual(encoded);
            await expect((await privateKey.getPublicKey()).verify(MESSAGE, await decoded.sign(MESSAGE)))
                .resolves.toBe(true);
        });
    });

    describe("generation, import and sign/verify", () => {
        it.each(ALGORITHMS)("round-trips a generated $alg key", async ({alg, signatureSize}) => {
            const privateKey = await JwkPrivateSignatureKey.gen(alg);
            const publicKey = await privateKey.getPublicKey();

            expect(privateKey.getAlgorithm()).toBe(alg);
            expect(publicKey.getAlgorithm()).toBe(alg);

            const signature = await privateKey.sign(MESSAGE);
            expect(signature.length).toBe(signatureSize);
            expect(privateKey.getSignatureSize()).toBe(signatureSize);
            expect(publicKey.getSignatureSize()).toBe(signatureSize);

            await expect(publicKey.verify(MESSAGE, signature)).resolves.toBe(true);
        });

        it.each(ALGORITHMS)("re-imports an exported $alg key and cross-verifies", async ({alg}) => {
            const original = await JwkPrivateSignatureKey.gen(alg);
            const originalPublicKey = await original.getPublicKey();
            const encoder = CryptoEncoderFactory.defaultStringSignatureEncoder();

            // Re-importing the exported JWK must yield a key that produces interchangeable signatures.
            const reimported = await JwkPrivateSignatureKey.fromJwk(original.getPrivateJwk());
            const publicKey = await JwkPublicSignatureKey.fromJwk(original.getPublicJwk());

            await expect(publicKey.verify(MESSAGE, await reimported.sign(MESSAGE))).resolves.toBe(true);
            await expect(
                (await reimported.getPublicKey()).verify(MESSAGE, await original.sign(MESSAGE)),
            ).resolves.toBe(true);

            expect(await encoder.encodePublicKey(publicKey)).toEqual(await encoder.encodePublicKey(originalPublicKey));
        });

        it.each(ALGORITHMS)("accepts a legitimate message and signature for $alg", async ({alg}) => {
            const privateKey = await JwkPrivateSignatureKey.gen(alg);
            const publicKey = await privateKey.getPublicKey();
            const signature = await privateKey.sign(MESSAGE);

            await expect(publicKey.verify(MESSAGE, signature)).resolves.toBe(true);
        });

        it.each(ALGORITHMS)("rejects a tampered $alg message or signature", async ({alg}) => {
            const privateKey = await JwkPrivateSignatureKey.gen(alg);
            const publicKey = await privateKey.getPublicKey();
            const signature = await privateKey.sign(MESSAGE);

            await expect(publicKey.verify(MESSAGE, signature)).resolves.toBe(true);

            await expect(publicKey.verify(OTHER_MESSAGE, signature)).resolves.toBe(false);

            const tampered = Uint8Array.from(signature);
            tampered[0] ^= 0x01;
            await expect(publicKey.verify(MESSAGE, tampered)).resolves.toBe(false);

            // A truncated signature must be reported as invalid rather than throw.
            await expect(publicKey.verify(MESSAGE, signature.slice(0, signature.length - 1))).resolves.toBe(false);
        });

        it.each(ALGORITHMS)("rejects a signature from another $alg key", async ({alg}) => {
            const [signer, other] = await Promise.all([
                JwkPrivateSignatureKey.gen(alg),
                JwkPrivateSignatureKey.gen(alg),
            ]);

            const signature = await signer.sign(MESSAGE);
            await expect((await other.getPublicKey()).verify(MESSAGE, signature)).resolves.toBe(false);
        });
    });

    describe("RSA keys", () => {
        it("imports an externally produced RS512 key pair and verifies its signatures", async () => {
            const privateKey = await JwkPrivateSignatureKey.fromJwk(RSA_PRIVATE_JWK);
            const publicKey = await JwkPublicSignatureKey.fromJwk(RSA_PUBLIC_JWK);

            expect(privateKey.getAlgorithm()).toBe("RS512");
            expect(publicKey.getAlgorithm()).toBe("RS512");

            const signature = await privateKey.sign(MESSAGE);
            expect(signature.length).toBe(256);
            await expect(publicKey.verify(MESSAGE, signature)).resolves.toBe(true);
            await expect(publicKey.verify(OTHER_MESSAGE, signature)).resolves.toBe(false);
        });

        it("defaults to RS256 when the JWK declares no algorithm", async () => {
            const {alg, ...withoutAlg} = RSA_PRIVATE_JWK;
            void alg;

            const privateKey = await JwkPrivateSignatureKey.fromJwk(withoutAlg);
            expect(privateKey.getAlgorithm()).toBe("RS256");
            await expect(
                (await privateKey.getPublicKey()).verify(MESSAGE, await privateKey.sign(MESSAGE)),
            ).resolves.toBe(true);
        });

        it("does not cross-verify RS512 signatures with a PS512 key of the same modulus", async () => {
            const pkcs1Key = await JwkPrivateSignatureKey.fromJwk(RSA_PRIVATE_JWK);
            const pssKey = await JwkPublicSignatureKey.fromJwk({...RSA_PUBLIC_JWK, alg: "PS512"});

            await expect(pssKey.verify(MESSAGE, await pkcs1Key.sign(MESSAGE))).resolves.toBe(false);
        });

        it("keeps the private primes out of the public JWK", async () => {
            const privateKey = await JwkPrivateSignatureKey.fromJwk(RSA_PRIVATE_JWK);
            const publicJwk = privateKey.getPublicJwk();

            for (const member of ["d", "p", "q", "dp", "dq", "qi", "oth"]) {
                expect(publicJwk, `public JWK must not expose '${member}'`).not.toHaveProperty(member);
            }
            expect(Object.keys(publicJwk)).toEqual(["alg", "e", "kty", "n"]);
        });

        it("honours the requested modulus length", async () => {
            const privateKey = await JwkPrivateSignatureKey.gen("RS256", {modulusLength: 3072});

            expect(privateKey.getSignatureSize()).toBe(384);
            expect((await privateKey.sign(MESSAGE)).length).toBe(384);
        });
    });

    describe("raw key material", () => {
        it("exposes 'd' as the raw private key of EC and OKP keys", async () => {
            for (const alg of ["ES256", "ES384", "ES512", "ES256K", "Ed25519", "Ed448"] as const) {
                const privateKey = await JwkPrivateSignatureKey.gen(alg);
                const expected = base64url.decode(privateKey.getPrivateJwk().d as string);
                expect(privateKey.getRawPrivateKeyBytes(), alg).toEqual(expected);
            }
        });

        it.each(['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87'])("exposes the seed as the raw private key of $0 keys",
            async (alg) => {
                const privateKey = await JwkPrivateSignatureKey.gen(alg as any);

                expect(privateKey.getRawPrivateKeyBytes().length).toBe(32);
                expect(privateKey.getRawPrivateKeyBytes())
                    .toEqual(base64url.decode(privateKey.getPrivateJwk().priv as string));
            });

        it.each(ALGORITHMS.filter((entry) => entry.publicKeySize !== undefined))(
            "exposes the raw $alg public key at its expected size",
            async ({alg, publicKeySize}) => {
                const publicKey = await (await JwkPrivateSignatureKey.gen(alg)).getPublicKey();
                expect(publicKey.getRawPublicKeyBytes().length).toBe(publicKeySize);
            },
        );
    });

    it("produces a signature the Web Crypto API verifies", async () => {
        const privateKey = await JwkPrivateSignatureKey.gen("ES256");
        const signature = await privateKey.sign(MESSAGE);

        // The canonical public JWK is handed to Web Crypto as-is: it carries no `alg`,
        // `use` or `key_ops` member that could contradict the import requested here.
        const publicJwk = (await privateKey.getPublicKey()).getPublicJwk();
        const webCryptoKey = await getSubtle().importKey(
            "jwk", publicJwk, {name: "ECDSA", namedCurve: "P-256"}, false, ["verify"],
        );

        await expect(getSubtle().verify(
            {name: "ECDSA", hash: "SHA-256"},
            webCryptoKey,
            signature as BufferSource,
            MESSAGE as BufferSource,
        )).resolves.toBe(true);
    });

    describe("interoperability with jose", () => {
        // ES256K is left out: jose relies on Web Crypto for it, which has no secp256k1 curve.
        const JOSE_ALGORITHMS: JwkSignatureAlgorithmName[] =
            ["ES256", "ES384", "ES512", "Ed25519", "RS256", "RS512", "PS256", "PS512", "ML-DSA-65"];

        it.each(JOSE_ALGORITHMS)("verifies a %s signature produced by jose", async (alg) => {
            const privateKey = await JwkPrivateSignatureKey.gen(alg);
            const joseKey = await jose.importJWK(privateKey.getPrivateJwk() as jose.JWK, alg);

            const jws = await new jose.FlattenedSign(MESSAGE)
                .setProtectedHeader({alg})
                .sign(joseKey);

            // The JWS signing input is `protected.payload`, both base64url-encoded.
            const signingInput = new TextEncoder().encode(`${jws.protected}.${jws.payload}`);
            const publicKey = await privateKey.getPublicKey();

            await expect(publicKey.verify(signingInput, base64url.decode(jws.signature!))).resolves.toBe(true);
        });

        it.each(JOSE_ALGORITHMS)("produces a %s signature jose accepts", async (alg) => {
            const privateKey = await JwkPrivateSignatureKey.gen(alg);
            const joseKey = await jose.importJWK(privateKey.getPrivateJwk() as jose.JWK, alg);

            // Sign with jose first to obtain a well-formed JWS, then swap in our own signature.
            const jws = await new jose.FlattenedSign(MESSAGE).setProtectedHeader({alg}).sign(joseKey);
            const signingInput = new TextEncoder().encode(`${jws.protected}.${jws.payload}`);
            const ours = {...jws, signature: base64url.encode(await privateKey.sign(signingInput))};

            const joseVerificationKey = await jose.importJWK(privateKey.getPublicJwk() as jose.JWK, alg);
            const verified = await jose.flattenedVerify(ours, joseVerificationKey);
            expect(verified.payload).toEqual(MESSAGE);
        });

        it("signs a JWT that jose verifies", async () => {
            const privateKey = await JwkPrivateSignatureKey.gen("ES256");
            const payload = {sub: "carmentis", iat: 1_700_000_000};

            const header = base64url.encode(JSON.stringify({alg: "ES256", typ: "JWT"}));
            const body = base64url.encode(JSON.stringify(payload));
            const signature = await privateKey.sign(new TextEncoder().encode(`${header}.${body}`));
            const jwt = `${header}.${body}.${base64url.encode(signature)}`;

            const publicKey = await jose.importJWK(privateKey.getPublicJwk() as jose.JWK, "ES256");
            const verified = await jose.jwtVerify(jwt, publicKey);
            expect(verified.payload).toMatchObject(payload);
        });
    });

    describe("signature scheme", () => {
        it("reports ML-DSA-65 as the Carmentis ML_DSA_65 scheme", async () => {
            const privateKey = await JwkPrivateSignatureKey.gen("ML-DSA-65");

            expect(privateKey.getSignatureSchemeId()).toBe(SignatureSchemeId.JWK);
            expect(privateKey.getScheme().expectedSeedSize()).toBe(32);
        });

        it("interoperates with the native ML-DSA-65 signature keys", async () => {
            const nativeKey = await MLDSA65PrivateSignatureKey.gen();
            const nativePublicKey = await nativeKey.getPublicKey();

            const jwkKey = await JwkPrivateSignatureKey.fromJwk({
                kty: "AKP",
                alg: "ML-DSA-65",
                pub: base64url.encode(await nativePublicKey.getPublicKeyAsBytes()),
                priv: base64url.encode(nativeKey.getPrivateKeyAsBytes()),
            });
            const jwkPublicKey = await jwkKey.getPublicKey();
            await expect(nativePublicKey.verify(MESSAGE, await jwkKey.sign(MESSAGE))).resolves.toBe(true);
            await expect(jwkPublicKey.verify(MESSAGE, await nativeKey.sign(MESSAGE))).resolves.toBe(true);

        });

        it.each(["ES256", "ES256K", "Ed25519", "RS256", "ML-DSA-44"] as const)(
            "map %s onto JWK Carmentis scheme identifier",
            async (alg) => {
                const privateKey = await JwkPrivateSignatureKey.gen(alg);
                expect(privateKey.getSignatureSchemeId()).toEqual(SignatureSchemeId.JWK);
            },
        );

        it("refuses to report a seed size for RSA keys", async () => {
            const privateKey = await JwkPrivateSignatureKey.fromJwk(RSA_PRIVATE_JWK);
            expect(() => privateKey.getScheme().expectedSeedSize()).toThrow(/not derived from a seed/);
        });
    });

    describe("rejected JWKs", () => {
        it("rejects a JWK without a key type", async () => {
            await expect(JwkPrivateSignatureKey.fromJwk({} as SignatureJwk)).rejects.toThrow(/missing 'kty'/);
        });

        it("rejects an unsupported key type", async () => {
            await expect(JwkPrivateSignatureKey.fromJwk({kty: "unknown"})).rejects.toThrow(/unsupported key type/);
        });

        it("rejects symmetric keys, which have no public counterpart", async () => {
            await expect(JwkPrivateSignatureKey.fromJwk({kty: "oct", k: "AAAA"} as SignatureJwk))
                .rejects.toThrow(/symmetric/);
        });

        it("ignores 'use', 'key_ops' and 'ext' rather than rejecting on them", async () => {
            const {x, y, crv} = (await JwkPrivateSignatureKey.gen("ES256")).getPublicJwk();
            const publicKey = await JwkPublicSignatureKey.fromJwk({
                kty: "EC", crv, x, y,
                use: "enc",
                key_ops: ["deriveBits"],
                ext: false,
            });

            expect(Object.keys(publicKey.getPublicJwk())).toEqual(["crv", "kty", "x", "y"]);
        });

        it("rejects curves that cannot sign", async () => {
            await expect(JwkPublicSignatureKey.fromJwk({kty: "OKP", crv: "X25519", x: "AAAA"}))
                .rejects.toThrow(/cannot sign/);
            await expect(JwkPublicSignatureKey.fromJwk({kty: "EC", crv: "P-192", x: "AAAA", y: "AAAA"}))
                .rejects.toThrow(/unsupported curve/);
        });

        it("rejects a declared algorithm that contradicts the curve", async () => {
            const publicJwk = (await JwkPrivateSignatureKey.gen("ES256")).getPublicJwk();
            await expect(JwkPublicSignatureKey.fromJwk({...publicJwk, alg: "ES384"}))
                .rejects.toThrow(/incompatible with curve/);
        });

        it("rejects an unsupported RSA algorithm", async () => {
            await expect(JwkPrivateSignatureKey.fromJwk({...RSA_PRIVATE_JWK, alg: "RSA-OAEP"}))
                .rejects.toThrow(/unsupported algorithm/);
        });

        it("rejects an unsupported ML-DSA parameter set", async () => {
            await expect(JwkPublicSignatureKey.fromJwk({kty: "AKP", alg: "ML-DSA-99", pub: "AAAA"}))
                .rejects.toThrow(/unsupported algorithm/);
        });

        it("rejects a public JWK used as a private key", async () => {
            await expect(JwkPrivateSignatureKey.fromJwk(RSA_PUBLIC_JWK))
                .rejects.toThrow(/missing member 'd'/);

            const publicJwk = (await JwkPrivateSignatureKey.gen("ML-DSA-65")).getPublicJwk();
            await expect(JwkPrivateSignatureKey.fromJwk(publicJwk)).rejects.toThrow(/missing member 'priv'/);
        });

        it("rejects a JWK missing public key material", async () => {
            await expect(JwkPublicSignatureKey.fromJwk({kty: "EC", crv: "P-256", x: "AAAA"}))
                .rejects.toThrow(/missing public member 'y'/);
            await expect(JwkPublicSignatureKey.fromJwk({kty: "RSA", e: "AQAB"}))
                .rejects.toThrow(/missing public member 'n'/);
        });

        it("rejects an ML-DSA seed of the wrong size", async () => {
            const publicJwk = (await JwkPrivateSignatureKey.gen("ML-DSA-65")).getPublicJwk();
            await expect(JwkPrivateSignatureKey.fromJwk({...publicJwk, priv: base64url.encode(new Uint8Array(16))}))
                .rejects.toThrow(/expected a 32-byte seed/);
        });
    });
});
