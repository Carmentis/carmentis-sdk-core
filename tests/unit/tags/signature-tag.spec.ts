import {beforeAll, describe, expect, it} from "vitest";
import {SignatureTagHandler} from "../../../src/tags/SignatureTagHandler";
import {SignatureTag} from "../../../src/type/tags/SignatureTag";
import {Secp256k1PrivateSignatureKey} from "../../../src/crypto/signature/secp256k1/Secp256k1PrivateSignatureKey";
import {CryptoEncoderFactory} from "../../../src/crypto/encoder/CryptoEncoderFactory";
import {PrivateSignatureKey} from "../../../src/crypto/signature/PrivateSignatureKey";

const SIGNED_MESSAGE = new TextEncoder().encode("The quick brown fox jumps over the lazy dog");

const encoder = CryptoEncoderFactory.defaultStringSignatureEncoder();





describe("SignatureTagHandler", () => {


    /** The signer of every tag built here, along with its encoded key and signature. */
    let privateKey: PrivateSignatureKey;
    let encodedPublicKey: string;
    let encodedSignature: string;

    /** A tag carrying every member the schema allows. */
    function fullTag(): SignatureTag {
        return {
            metadata: {
                title: "Terms of service",
                message: "Please sign the terms of service",
                origin: "https://example.com",
                requestedAt: "2026-09-04T08:00:00.000Z",
                signedAt: "2026-09-04T08:01:30.000Z",
                notValidBefore: "2026-09-04T00:00:00.000Z",
                notValidAfter: "2026-12-31T23:59:59.000Z",
                allowOnChain: true,
                organizationId: "organization-id",
                applicationId: "application-id",
                applicationLedgerId: "application-ledger-id",
                latestMicroblockHash: "aabbcc",
            },
            data: {type: "embedded", data: {version: 3, accepted: true}},
            pk: encodedPublicKey,
            signature: encodedSignature,
        };
    }

    /** A tag carrying only the members the schema requires. */
    function minimalTag(): SignatureTag {
        return {
            metadata: {
                title: "Terms of service",
                message: "Please sign the terms of service",
                origin: "https://example.com",
                signedAt: "2026-09-04T08:01:30.000Z",
            },
            data: {type: "referenced", path: "documents/terms.pdf"},
            pk: encodedPublicKey,
            signature: encodedSignature,
        };
    }


    beforeAll(async () => {
        privateKey = Secp256k1PrivateSignatureKey.gen();
        encodedPublicKey = await encoder.encodePublicKey(await privateKey.getPublicKey());
        encodedSignature = encoder.encodeSignature(await privateKey.sign(SIGNED_MESSAGE));
    });

    it("exposes every member of a fully populated tag", () => {
        const tag = fullTag();
        const handler = SignatureTagHandler.fromObject(tag);

        expect(handler.toObject()).toEqual(tag);
        expect(handler.getMetadata()).toEqual(tag.metadata);
        expect(handler.getTitle()).toBe("Terms of service");
        expect(handler.getMessage()).toBe("Please sign the terms of service");
        expect(handler.getOrigin()).toBe("https://example.com");
        expect(handler.getRequestedAt()).toBe("2026-09-04T08:00:00.000Z");
        expect(handler.getSignedAt()).toBe("2026-09-04T08:01:30.000Z");
        expect(handler.getNotValidBefore()).toBe("2026-09-04T00:00:00.000Z");
        expect(handler.getNotValidAfter()).toBe("2026-12-31T23:59:59.000Z");
        expect(handler.isOnChainAllowed()).toBe(true);
        expect(handler.getOrganizationId()).toBe("organization-id");
        expect(handler.getApplicationId()).toBe("application-id");
        expect(handler.getApplicationLedgerId()).toBe("application-ledger-id");
        expect(handler.getLatestMicroblockHash()).toBe("aabbcc");
        expect(handler.getEncodedPublicKey()).toBe(encodedPublicKey);
        expect(handler.getEncodedSignature()).toBe(encodedSignature);
    });

    it("reports the optional members a minimal tag leaves out as undefined", () => {
        const handler = SignatureTagHandler.fromObject(minimalTag());

        expect(handler.getRequestedAt()).toBeUndefined();
        expect(handler.getNotValidBefore()).toBeUndefined();
        expect(handler.getNotValidAfter()).toBeUndefined();
        expect(handler.getOrganizationId()).toBeUndefined();
        expect(handler.getApplicationId()).toBeUndefined();
        expect(handler.getApplicationLedgerId()).toBeUndefined();
        expect(handler.getLatestMicroblockHash()).toBeUndefined();

        // Saying nothing about on-chain anchoring is not the same as allowing it.
        expect(handler.isOnChainAllowed()).toBe(false);
    });

    it("gives access to embedded data, and refuses the referenced accessor", () => {
        const handler = SignatureTagHandler.fromObject(fullTag());

        expect(handler.isEmbeddedData()).toBe(true);
        expect(handler.isReferencedData()).toBe(false);
        expect(handler.getData()).toEqual({type: "embedded", data: {version: 3, accepted: true}});
        expect(handler.getEmbeddedData()).toEqual({version: 3, accepted: true});
        expect(() => handler.getReferencedDataPath()).toThrow(/not referenced by the tag/);
    });

    it("gives access to the referenced path, and refuses the embedded accessor", () => {
        const handler = SignatureTagHandler.fromObject(minimalTag());

        expect(handler.isReferencedData()).toBe(true);
        expect(handler.isEmbeddedData()).toBe(false);
        expect(handler.getData()).toEqual({type: "referenced", path: "documents/terms.pdf"});
        expect(handler.getReferencedDataPath()).toBe("documents/terms.pdf");
        expect(() => handler.getEmbeddedData()).toThrow(/not embedded in the tag/);
    });

    it("decodes the public key and the signature it carries", async () => {
        const handler = SignatureTagHandler.fromObject(fullTag());

        const publicKey = await handler.getPublicKey();
        expect(await publicKey.getPublicKeyAsBytes())
            .toEqual(await (await privateKey.getPublicKey()).getPublicKeyAsBytes());

        // The decoded key and signature go together: they verify the message that was signed.
        await expect(publicKey.verify(SIGNED_MESSAGE, handler.getSignature())).resolves.toBe(true);
    });

    it("rejects an object that is not a signature tag", () => {
        const {signedAt, ...withoutSignedAt} = fullTag().metadata;
        void signedAt;

        expect(() => SignatureTagHandler.fromObject({...fullTag(), metadata: withoutSignedAt})).toThrow();
        expect(() => SignatureTagHandler.fromObject({...fullTag(), data: {type: "linked"}})).toThrow();
        expect(() => SignatureTagHandler.fromObject({...fullTag(), pk: 42})).toThrow();
        expect(() => SignatureTagHandler.fromObject(undefined)).toThrow();
    });
});
