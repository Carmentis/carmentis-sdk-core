import { describe, it, expect, beforeEach } from 'vitest';
import { MLDSA65PrivateSignatureKey } from "../../src/crypto/signature/ml-dsa-65";
import { BinarySigner } from "../../src/crypto/signature/signer/binary/BinarySigner";
import { BinaryVerifier } from "../../src/crypto/signature/signer/binary/BinaryVerifier";
import { BinaryEncoding } from "../../src/crypto/signature/signer/binary/BinaryEndoding";
import { BinaryEncoder } from "../../src/crypto/signature/signer/binary/BinaryEncoder";

describe("Binary Signature", () => {
    let sk: MLDSA65PrivateSignatureKey;
    let signer: BinarySigner;
    let verifier: BinaryVerifier;

    beforeEach(async () => {
        sk = await MLDSA65PrivateSignatureKey.gen();
        signer = new BinarySigner();
        verifier = new BinaryVerifier();
    });

    describe("BinarySigner", () => {
        it("should sign a message encoded in HEX", async () => {
            const message = "Hello, World!";
            const encodedMessage = BinaryEncoder.encode(Buffer.from(message), BinaryEncoding.HEX);

            const signature = await signer.sign(sk, BinaryEncoding.HEX, encodedMessage);

            expect(signature).toBeTruthy();
            expect(typeof signature).toBe('string');
        });

        it("should sign a message encoded in BASE64", async () => {
            const message = "Hello, World!";
            const encodedMessage = BinaryEncoder.encode(Buffer.from(message), BinaryEncoding.BASE64);

            const signature = await signer.sign(sk, BinaryEncoding.BASE64, encodedMessage);

            expect(signature).toBeTruthy();
            expect(typeof signature).toBe('string');
        });

        it("should sign a message encoded in BASE64URL", async () => {
            const message = "Hello, World!";
            const encodedMessage = BinaryEncoder.encode(Buffer.from(message), BinaryEncoding.BASE64URL);

            const signature = await signer.sign(sk, BinaryEncoding.BASE64URL, encodedMessage);

            expect(signature).toBeTruthy();
            expect(typeof signature).toBe('string');
        });

        it("should support chaining setSignatureEncoding", async () => {
            const message = "Test message";
            const encodedMessage = BinaryEncoder.encode(Buffer.from(message), BinaryEncoding.HEX);

            const result = signer.setSignatureEncoding(BinaryEncoding.HEX);
            expect(result).toBe(signer);

            const signature = await signer.sign(sk, BinaryEncoding.HEX, encodedMessage);
            expect(signature).toBeTruthy();
        });

        it("should return signature in the configured encoding", async () => {
            const message = "Test message";
            const encodedMessage = BinaryEncoder.encode(Buffer.from(message), BinaryEncoding.HEX);

            const hexSigner = new BinarySigner().setSignatureEncoding(BinaryEncoding.HEX);
            const hexSignature = await hexSigner.sign(sk, BinaryEncoding.HEX, encodedMessage);
            expect(/^[0-9a-fA-F]+$/.test(hexSignature)).toBe(true);

            const base64Signer = new BinarySigner().setSignatureEncoding(BinaryEncoding.BASE64);
            const base64Signature = await base64Signer.sign(sk, BinaryEncoding.HEX, encodedMessage);
            expect(/^[A-Za-z0-9+/]*={0,2}$/.test(base64Signature)).toBe(true);

            const base64urlSigner = new BinarySigner().setSignatureEncoding(BinaryEncoding.BASE64URL);
            const base64urlSignature = await base64urlSigner.sign(sk, BinaryEncoding.HEX, encodedMessage);
            expect(/^[A-Za-z0-9\-_]*={0,2}$/.test(base64urlSignature)).toBe(true);
        });
    });

    describe("BinaryVerifier", () => {
        it("should verify a signature encoded in HEX", async () => {
            const pk = await sk.getPublicKey();
            const message = "Hello, World!";
            const encodedMessage = BinaryEncoder.encode(Buffer.from(message), BinaryEncoding.HEX);

            const signature = await signer.setSignatureEncoding(BinaryEncoding.HEX).sign(sk, BinaryEncoding.HEX, encodedMessage);
            const result = await verifier.setSignatureEncoding(BinaryEncoding.HEX).verify(pk, BinaryEncoding.HEX, encodedMessage, signature);

            expect(result).toBe(true);
        });

        it("should verify a signature encoded in BASE64", async () => {
            const pk = await sk.getPublicKey();
            const message = "Hello, World!";
            const encodedMessage = BinaryEncoder.encode(Buffer.from(message), BinaryEncoding.BASE64);

            const signature = await signer.setSignatureEncoding(BinaryEncoding.BASE64).sign(sk, BinaryEncoding.BASE64, encodedMessage);
            const result = await verifier.setSignatureEncoding(BinaryEncoding.BASE64).verify(pk, BinaryEncoding.BASE64, encodedMessage, signature);

            expect(result).toBe(true);
        });

        it("should verify a signature encoded in BASE64URL", async () => {
            const pk = await sk.getPublicKey();
            const message = "Hello, World!";
            const encodedMessage = BinaryEncoder.encode(Buffer.from(message), BinaryEncoding.BASE64URL);

            const signature = await signer.setSignatureEncoding(BinaryEncoding.BASE64URL).sign(sk, BinaryEncoding.BASE64URL, encodedMessage);
            const result = await verifier.setSignatureEncoding(BinaryEncoding.BASE64URL).verify(pk, BinaryEncoding.BASE64URL, encodedMessage, signature);

            expect(result).toBe(true);
        });

        it("should support chaining setSignatureEncoding", async () => {
            const pk = await sk.getPublicKey();
            const message = "Test message";
            const encodedMessage = BinaryEncoder.encode(Buffer.from(message), BinaryEncoding.HEX);

            const result = verifier.setSignatureEncoding(BinaryEncoding.HEX);
            expect(result).toBe(verifier);
        });

        it("should reject invalid signatures", async () => {
            const pk = await sk.getPublicKey();
            const message = "Hello, World!";
            const encodedMessage = BinaryEncoder.encode(Buffer.from(message), BinaryEncoding.HEX);
            const invalidSignature = BinaryEncoder.encode(Buffer.from("invalid"), BinaryEncoding.HEX);

            const result = await verifier.setSignatureEncoding(BinaryEncoding.HEX).verify(pk, BinaryEncoding.HEX, encodedMessage, invalidSignature);

            expect(result).toBe(false);
        });
    });

    describe("Round-trip signing and verification", () => {
        it.each([
            [BinaryEncoding.HEX],
            [BinaryEncoding.BASE64],
            [BinaryEncoding.BASE64URL],
        ])("should sign and verify a message with %s encoding", async (encoding) => {
            const pk = await sk.getPublicKey();
            const message = "Test message for round-trip";
            const encodedMessage = BinaryEncoder.encode(Buffer.from(message), encoding);

            const signature = await new BinarySigner()
                .setSignatureEncoding(encoding)
                .sign(sk, encoding, encodedMessage);

            const result = await new BinaryVerifier()
                .setSignatureEncoding(encoding)
                .verify(pk, encoding, encodedMessage, signature);

            expect(result).toBe(true);
        });

        it("should fail verification when message is modified", async () => {
            const pk = await sk.getPublicKey();
            const message = "Original message";
            const encodedMessage = BinaryEncoder.encode(Buffer.from(message), BinaryEncoding.HEX);

            const signature = await signer.setSignatureEncoding(BinaryEncoding.HEX).sign(sk, BinaryEncoding.HEX, encodedMessage);

            const modifiedMessage = "Modified message";
            const encodedModifiedMessage = BinaryEncoder.encode(Buffer.from(modifiedMessage), BinaryEncoding.HEX);

            const result = await verifier.setSignatureEncoding(BinaryEncoding.HEX).verify(pk, BinaryEncoding.HEX, encodedModifiedMessage, signature);

            expect(result).toBe(false);
        });

        it("should fail verification when signature is modified", async () => {
            const pk = await sk.getPublicKey();
            const message = "Test message";
            const encodedMessage = BinaryEncoder.encode(Buffer.from(message), BinaryEncoding.HEX);

            const signature = await signer.setSignatureEncoding(BinaryEncoding.HEX).sign(sk, BinaryEncoding.HEX, encodedMessage);
            const signatureBytes = BinaryEncoder.decode(signature, BinaryEncoding.HEX);
            signatureBytes[0] = (signatureBytes[0] + 1) % 256;
            const modifiedSignature = BinaryEncoder.encode(signatureBytes, BinaryEncoding.HEX);

            const result = await verifier.setSignatureEncoding(BinaryEncoding.HEX).verify(pk, BinaryEncoding.HEX, encodedMessage, modifiedSignature);

            expect(result).toBe(false);
        });

        it("should work with different message encodings for message and signature", async () => {
            const pk = await sk.getPublicKey();
            const message = "Test message";
            const encodedMessage = BinaryEncoder.encode(Buffer.from(message), BinaryEncoding.BASE64);

            const signature = await signer.setSignatureEncoding(BinaryEncoding.HEX).sign(sk, BinaryEncoding.BASE64, encodedMessage);

            const result = await verifier.setSignatureEncoding(BinaryEncoding.HEX).verify(pk, BinaryEncoding.BASE64, encodedMessage, signature);

            expect(result).toBe(true);
        });
    });

    describe("Edge cases", () => {
        it("should handle empty messages", async () => {
            const pk = await sk.getPublicKey();
            const message = "";
            const encodedMessage = BinaryEncoder.encode(Buffer.from(message), BinaryEncoding.HEX);

            const signature = await signer.setSignatureEncoding(BinaryEncoding.HEX).sign(sk, BinaryEncoding.HEX, encodedMessage);
            const result = await verifier.setSignatureEncoding(BinaryEncoding.HEX).verify(pk, BinaryEncoding.HEX, encodedMessage, signature);

            expect(result).toBe(true);
        });

        it("should handle large messages", async () => {
            const pk = await sk.getPublicKey();
            const message = "X".repeat(10000);
            const encodedMessage = BinaryEncoder.encode(Buffer.from(message), BinaryEncoding.HEX);

            const signature = await signer.setSignatureEncoding(BinaryEncoding.HEX).sign(sk, BinaryEncoding.HEX, encodedMessage);
            const result = await verifier.setSignatureEncoding(BinaryEncoding.HEX).verify(pk, BinaryEncoding.HEX, encodedMessage, signature);

            expect(result).toBe(true);
        });

        it("should handle binary data with null bytes", async () => {
            const pk = await sk.getPublicKey();
            const message = Buffer.from([0x00, 0x01, 0x02, 0x00, 0x04]);
            const encodedMessage = BinaryEncoder.encode(message, BinaryEncoding.BASE64);

            const signature = await signer.setSignatureEncoding(BinaryEncoding.BASE64).sign(sk, BinaryEncoding.BASE64, encodedMessage);
            const result = await verifier.setSignatureEncoding(BinaryEncoding.BASE64).verify(pk, BinaryEncoding.BASE64, encodedMessage, signature);

            expect(result).toBe(true);
        });
    });
});
