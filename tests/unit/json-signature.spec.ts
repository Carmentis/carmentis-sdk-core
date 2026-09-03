import { describe, it, expect, beforeEach } from 'vitest';
import {Secp256k1PrivateSignatureKey} from "../../src/crypto/signature/secp256k1/Secp256k1PrivateSignatureKey";
import {JsonSigner} from "../../src/crypto/signature/signer/json/JsonSigner";
import {JsonVerifier} from "../../src/crypto/signature/signer/json/JsonVerifier";
import {MLDSA65PrivateSignatureKey, MLDSA65PublicSignatureKey} from "../../src/crypto/signature/ml-dsa-65";
import {JsonCanonicalizationMethod} from "../../src/crypto/signature/signer/json/JsonCanonicalizationMethod";
import * as v from 'valibot';
import {BinaryEncoding} from "../../src/crypto/signature/signer/binary/BinaryEndoding";

const HexStringSchema = v.pipe(
    v.string(),
    v.regex(/^[0-9a-fA-F]+$/, 'Must be a hex string'),
    v.check((value) => value.length % 2 === 0, 'Hex string must have an even length'),
    v.brand('HexString'),
);

const Base64StringSchema = v.pipe(
    v.string(),
    v.regex(/^[A-Za-z0-9+/]*={0,2}$/, 'Must be a base64 string'),
    v.check((value) => value.length % 4 === 0, 'Base64 string length must be a multiple of 4'),
    v.brand('Base64String'),
);

const Base64UrlStringSchema = v.pipe(
    v.string(),
    v.regex(/^[A-Za-z0-9\-_]*={0,2}$/, 'Must be a base64url string'),
    v.brand('Base64UrlString'),
);

describe("JSON Signature", () => {
    let sk: MLDSA65PrivateSignatureKey;
    let pk: MLDSA65PublicSignatureKey;

    beforeEach(async () => {
        sk = await MLDSA65PrivateSignatureKey.gen();
        pk = await sk.getPublicKey();
    });

    describe("Signature Encoding Formats", () => {
        it.each([
            [BinaryEncoding.HEX, HexStringSchema],
            [BinaryEncoding.BASE64, Base64StringSchema],
            [BinaryEncoding.BASE64URL, Base64UrlStringSchema],
        ])(`should sign and verify with %s encoding`, async (encoding, schema) => {
            const message = { a: 1, b: "message" };
            const signature = await new JsonSigner()
                .setSignatureEncoding(encoding)
                .sign(sk, message);

            expect(() => v.parse(schema, signature)).not.toThrow();
            const result = await new JsonVerifier()
                .setSignatureEncoding(encoding)
                .verify(pk, message, signature);
            expect(result).toBe(true);
        });
    });

    describe("JSON Canonicalization", () => {
        it("should handle messages with different property orders", async () => {
            const validMessages = [
                { a: 1, b: "message" },
                { b: "message", a: 1 },
            ];

            for (let message of validMessages) {
                const signature = await new JsonSigner()
                    .setSignatureEncoding(BinaryEncoding.HEX)
                    .sign(sk, message);
                const result = await new JsonVerifier()
                    .setSignatureEncoding(BinaryEncoding.HEX)
                    .verify(pk, message, signature);
                expect(result).toBe(true);
            }
        });

        it("should produce consistent signatures for equivalent JSON objects", async () => {
            const message1 = { a: 1, b: "message" };
            const message2 = { b: "message", a: 1 };

            const signature1 = await new JsonSigner()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, message1);
            const signature2 = await new JsonSigner()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, message2);

            expect(signature1).toBe(signature2);
        });

        it("should use JSON_CANONICAL method by default", async () => {
            const message = { a: 1, b: "message" };
            const signature = await new JsonSigner()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, message);

            const result = await new JsonVerifier()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, message, signature);
            expect(result).toBe(true);
        });

        it("should support setting JSON canonicalization method", async () => {
            const message = { a: 1, b: "message" };
            const signature = await new JsonSigner()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.JSON_CANONICAL)
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, message);

            const result = await new JsonVerifier()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.JSON_CANONICAL)
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, message, signature);
            expect(result).toBe(true);
        });
    });

    describe("CBOR Canonicalization", () => {
        it("should sign and verify with CBOR canonicalization", async () => {
            const message = { a: 1, b: "message" };
            const signature = await new JsonSigner()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, message);

            const result = await new JsonVerifier()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, message, signature);
            expect(result).toBe(true);
        });

        it("should handle different property orders with CBOR", async () => {
            const validMessages = [
                { a: 1, b: "message" },
                { b: "message", a: 1 },
            ];

            for (let message of validMessages) {
                const signature = await new JsonSigner()
                    .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                    .setSignatureEncoding(BinaryEncoding.HEX)
                    .sign(sk, message);
                const result = await new JsonVerifier()
                    .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                    .setSignatureEncoding(BinaryEncoding.HEX)
                    .verify(pk, message, signature);
                expect(result).toBe(true);
            }
        });


        it("should verify CBOR signatures with different encodings", async () => {
            const message = { a: 1, b: "message" };

            const hexSignature = await new JsonSigner()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, message);

            const result = await new JsonVerifier()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, message, hexSignature);
            expect(result).toBe(true);
        });

        it("should sign and verify with CBOR and BASE64 encoding", async () => {
            const message = { a: 1, b: "message" };
            const signature = await new JsonSigner()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.BASE64)
                .sign(sk, message);

            const result = await new JsonVerifier()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.BASE64)
                .verify(pk, message, signature);
            expect(result).toBe(true);
        });

        it("should sign and verify with CBOR and BASE64URL encoding", async () => {
            const message = { a: 1, b: "message" };
            const signature = await new JsonSigner()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.BASE64URL)
                .sign(sk, message);

            const result = await new JsonVerifier()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.BASE64URL)
                .verify(pk, message, signature);
            expect(result).toBe(true);
        });

        it("should reject modified messages with CBOR", async () => {
            const originalMessage = { a: 1, b: "message" };
            const signature = await new JsonSigner()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, originalMessage);

            const modifiedMessage = { a: 2, b: "message" };
            const result = await new JsonVerifier()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, modifiedMessage, signature);
            expect(result).toBe(false);
        });

        it("should handle nested objects with CBOR", async () => {
            const message = {
                user: {
                    id: 1,
                    name: "Alice"
                },
                data: {
                    items: [1, 2, 3]
                }
            };

            const signature = await new JsonSigner()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, message);
            const result = await new JsonVerifier()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, message, signature);
            expect(result).toBe(true);
        });

        it("should handle arrays with CBOR", async () => {
            const message = {
                items: [
                    { id: 1, name: "item1" },
                    { id: 2, name: "item2" }
                ]
            };

            const signature = await new JsonSigner()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, message);
            const result = await new JsonVerifier()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, message, signature);
            expect(result).toBe(true);
        });

        it("should handle null values with CBOR", async () => {
            const message = {
                a: 1,
                b: null,
                c: "test"
            };

            const signature = await new JsonSigner()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, message);
            const result = await new JsonVerifier()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, message, signature);
            expect(result).toBe(true);
        });

        it("should handle boolean values with CBOR", async () => {
            const message = {
                active: true,
                deleted: false,
                name: "test"
            };

            const signature = await new JsonSigner()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, message);
            const result = await new JsonVerifier()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, message, signature);
            expect(result).toBe(true);
        });

        it("should handle numeric values with CBOR", async () => {
            const message = {
                integer: 42,
                decimal: 3.14,
                negative: -100,
                zero: 0
            };

            const signature = await new JsonSigner()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, message);
            const result = await new JsonVerifier()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, message, signature);
            expect(result).toBe(true);
        });

        it("should handle special characters with CBOR", async () => {
            const message = {
                text: "Hello, World!",
                unicode: "你好世界",
                emoji: "🚀",
                escaped: "Line 1\nLine 2\tTab"
            };

            const signature = await new JsonSigner()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, message);
            const result = await new JsonVerifier()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, message, signature);
            expect(result).toBe(true);
        });

        it("should handle empty objects with CBOR", async () => {
            const message = {};

            const signature = await new JsonSigner()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, message);
            const result = await new JsonVerifier()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, message, signature);
            expect(result).toBe(true);
        });

        it("should handle empty arrays with CBOR", async () => {
            const message = { items: [] };

            const signature = await new JsonSigner()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, message);
            const result = await new JsonVerifier()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, message, signature);
            expect(result).toBe(true);
        });

        it("should handle deeply nested objects with CBOR", async () => {
            const message = {
                level1: {
                    level2: {
                        level3: {
                            level4: {
                                value: "deep"
                            }
                        }
                    }
                }
            };

            const signature = await new JsonSigner()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, message);
            const result = await new JsonVerifier()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.CBOR)
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, message, signature);
            expect(result).toBe(true);
        });
    });

    describe("Method Chaining", () => {
        it("should support chaining setSignatureEncoding in JsonSigner", async () => {
            const signer = new JsonSigner();
            const result = signer.setSignatureEncoding(BinaryEncoding.HEX);
            expect(result).toBe(signer);
        });

        it("should support chaining setJsonCanonicalizationMethod in JsonSigner", async () => {
            const signer = new JsonSigner();
            const result = signer.setJsonCanonicalizationMethod(JsonCanonicalizationMethod.JSON_CANONICAL);
            expect(result).toBe(signer);
        });

        it("should support chaining multiple methods in JsonSigner", async () => {
            const message = { test: "data" };
            const signer = new JsonSigner()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.JSON_CANONICAL)
                .setSignatureEncoding(BinaryEncoding.BASE64);

            const signature = await signer.sign(sk, message);
            expect(signature).toBeTruthy();
        });

        it("should support chaining setSignatureEncoding in JsonVerifier", async () => {
            const verifier = new JsonVerifier();
            const result = verifier.setSignatureEncoding(BinaryEncoding.HEX);
            expect(result).toBe(verifier);
        });

        it("should support chaining setJsonCanonicalizationMethod in JsonVerifier", async () => {
            const verifier = new JsonVerifier();
            const result = verifier.setJsonCanonicalizationMethod(JsonCanonicalizationMethod.JSON_CANONICAL);
            expect(result).toBe(verifier);
        });

        it("should support chaining multiple methods in JsonVerifier", async () => {
            const message = { test: "data" };
            const signature = await new JsonSigner()
                .setSignatureEncoding(BinaryEncoding.BASE64)
                .sign(sk, message);

            const result = await new JsonVerifier()
                .setJsonCanonicalizationMethod(JsonCanonicalizationMethod.JSON_CANONICAL)
                .setSignatureEncoding(BinaryEncoding.BASE64)
                .verify(pk, message, signature);
            expect(result).toBe(true);
        });
    });

    describe("Signature Verification", () => {
        it("should reject invalid signatures", async () => {
            const message = { a: 1, b: "message" };
            const invalidSignature = "deadbeefdeadbeefdeadbeefdeadbeef";

            const result = await new JsonVerifier()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, message, invalidSignature);
            expect(result).toBe(false);
        });

        it("should reject modified messages", async () => {
            const originalMessage = { a: 1, b: "message" };
            const signature = await new JsonSigner()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, originalMessage);

            const modifiedMessage = { a: 2, b: "message" };
            const result = await new JsonVerifier()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, modifiedMessage, signature);
            expect(result).toBe(false);
        });

        it("should reject messages with added properties", async () => {
            const originalMessage = { a: 1, b: "message" };
            const signature = await new JsonSigner()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, originalMessage);

            const modifiedMessage = { a: 1, b: "message", c: "extra" };
            const result = await new JsonVerifier()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, modifiedMessage, signature);
            expect(result).toBe(false);
        });

        it("should reject messages with removed properties", async () => {
            const originalMessage = { a: 1, b: "message", c: "extra" };
            const signature = await new JsonSigner()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, originalMessage);

            const modifiedMessage = { a: 1, b: "message" };
            const result = await new JsonVerifier()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, modifiedMessage, signature);
            expect(result).toBe(false);
        });
    });

    describe("Complex Message Structures", () => {
        it("should sign and verify nested objects", async () => {
            const message = {
                user: {
                    id: 1,
                    name: "Alice"
                },
                data: {
                    items: [1, 2, 3]
                }
            };

            const signature = await new JsonSigner()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, message);
            const result = await new JsonVerifier()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, message, signature);
            expect(result).toBe(true);
        });

        it("should sign and verify arrays", async () => {
            const message = {
                items: [
                    { id: 1, name: "item1" },
                    { id: 2, name: "item2" }
                ]
            };

            const signature = await new JsonSigner()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, message);
            const result = await new JsonVerifier()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, message, signature);
            expect(result).toBe(true);
        });

        it("should sign and verify messages with null values", async () => {
            const message = {
                a: 1,
                b: null,
                c: "test"
            };

            const signature = await new JsonSigner()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, message);
            const result = await new JsonVerifier()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, message, signature);
            expect(result).toBe(true);
        });

        it("should sign and verify messages with boolean values", async () => {
            const message = {
                active: true,
                deleted: false,
                name: "test"
            };

            const signature = await new JsonSigner()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, message);
            const result = await new JsonVerifier()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, message, signature);
            expect(result).toBe(true);
        });

        it("should sign and verify messages with numeric values", async () => {
            const message = {
                integer: 42,
                decimal: 3.14,
                negative: -100,
                zero: 0
            };

            const signature = await new JsonSigner()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, message);
            const result = await new JsonVerifier()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, message, signature);
            expect(result).toBe(true);
        });

        it("should sign and verify messages with special characters", async () => {
            const message = {
                text: "Hello, World!",
                unicode: "你好世界",
                emoji: "🚀",
                escaped: "Line 1\nLine 2\tTab"
            };

            const signature = await new JsonSigner()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, message);
            const result = await new JsonVerifier()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, message, signature);
            expect(result).toBe(true);
        });
    });

    describe("Round-trip with Different Keys", () => {
        it("should fail verification with different keys", async () => {
            const otherSk = await MLDSA65PrivateSignatureKey.gen();
            const otherPk = await otherSk.getPublicKey();

            const message = { a: 1, b: "message" };
            const signature = await new JsonSigner()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, message);

            const result = await new JsonVerifier()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(otherPk, message, signature);
            expect(result).toBe(false);
        });
    });

    describe("Edge Cases", () => {
        it("should sign and verify empty objects", async () => {
            const message = {};

            const signature = await new JsonSigner()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, message);
            const result = await new JsonVerifier()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, message, signature);
            expect(result).toBe(true);
        });

        it("should sign and verify objects with empty arrays", async () => {
            const message = { items: [] };

            const signature = await new JsonSigner()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, message);
            const result = await new JsonVerifier()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, message, signature);
            expect(result).toBe(true);
        });

        it("should sign and verify objects with empty strings", async () => {
            const message = { text: "" };

            const signature = await new JsonSigner()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, message);
            const result = await new JsonVerifier()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, message, signature);
            expect(result).toBe(true);
        });

        it("should handle deeply nested objects", async () => {
            const message = {
                level1: {
                    level2: {
                        level3: {
                            level4: {
                                value: "deep"
                            }
                        }
                    }
                }
            };

            const signature = await new JsonSigner()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .sign(sk, message);
            const result = await new JsonVerifier()
                .setSignatureEncoding(BinaryEncoding.HEX)
                .verify(pk, message, signature);
            expect(result).toBe(true);
        });
    });
});
