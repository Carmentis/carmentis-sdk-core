import {beforeAll, describe, expect, it} from "vitest";
import {SignatureTagHandler} from "../../../src/tags/SignatureTagHandler";
import {SignatureTag} from "../../../src/type/tags/SignatureTag";
import {Secp256k1PrivateSignatureKey} from "../../../src/crypto/signature/secp256k1/Secp256k1PrivateSignatureKey";
import {CryptoEncoderFactory} from "../../../src/crypto/encoder/CryptoEncoderFactory";
import {PrivateSignatureKey} from "../../../src/crypto/signature/PrivateSignatureKey";
import {SignatureTagBuilder} from "../../../src/tags/SignatureTagBuilder";
import {encodeSignatureTagPayload} from "../../../src/tags/SignatureTagPayload";

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
            data: {version: 3, accepted: true},
            pk: encodedPublicKey,
            signature: encodedSignature,
        };
    }

    /** A tag carrying only the members the schema requires, referencing its data. */
    function minimalTag(): SignatureTag {
        return {
            metadata: {
                title: "Terms of service",
                message: "Please sign the terms of service",
                origin: "https://example.com",
                requestedAt: "2026-09-04T08:00:00.000Z",
                signedAt: "2026-09-04T08:01:30.000Z",
            },
            path: "documents/terms.pdf",
            pk: encodedPublicKey,
            signature: encodedSignature,
        };
    }


    beforeAll(async () => {
        privateKey = Secp256k1PrivateSignatureKey.gen();
        encodedPublicKey = await encoder.encodePublicKey(await privateKey.getPublicKey());

        // The payload leaves the signature out, so the fully populated tag can be encoded
        // and signed before it carries a signature of its own.
        encodedSignature = encoder.encodeSignature(
            await privateKey.sign(encodeSignatureTagPayload(fullTag())),
        );
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
        expect(handler.getEmbeddedData()).toEqual({version: 3, accepted: true});
        expect(handler.getEncodedPublicKey()).toBe(encodedPublicKey);
        expect(handler.getEncodedSignature()).toBe(encodedSignature);
    });

    it("reports the optional members a minimal tag leaves out as undefined", () => {
        const handler = SignatureTagHandler.fromObject(minimalTag());

        expect(handler.getNotValidBefore()).toBeUndefined();
        expect(handler.getNotValidAfter()).toBeUndefined();
        expect(handler.getOrganizationId()).toBeUndefined();
        expect(handler.getApplicationId()).toBeUndefined();
        expect(handler.getApplicationLedgerId()).toBeUndefined();
        expect(handler.getLatestMicroblockHash()).toBeUndefined();

        // Saying nothing about on-chain anchoring is not the same as allowing it.
        expect(handler.isOnChainAllowed()).toBe(false);
    });

    it("reads the data of a tag holding it as embedded, and refuses the path accessor", () => {
        const handler = SignatureTagHandler.fromObject(fullTag());

        expect(handler.isEmbeddedData()).toBe(true);
        expect(handler.isReferencedData()).toBe(false);
        expect(handler.getEmbeddedData()).toEqual({version: 3, accepted: true});
        expect(() => handler.getReferencedDataPath()).toThrow(/does not reference its data/);
    });

    it("reads the data of a tag holding a path as referenced, and refuses the data accessor", () => {
        const handler = SignatureTagHandler.fromObject(minimalTag());

        expect(handler.isReferencedData()).toBe(true);
        expect(handler.isEmbeddedData()).toBe(false);
        expect(handler.getReferencedDataPath()).toBe("documents/terms.pdf");
        expect(() => handler.getEmbeddedData()).toThrow(/does not embed its data/);
    });

    it("decodes the public key and the signature it carries", async () => {
        const handler = SignatureTagHandler.fromObject(fullTag());

        const publicKey = await handler.getPublicKey();
        expect(await publicKey.getPublicKeyAsBytes())
            .toEqual(await (await privateKey.getPublicKey()).getPublicKeyAsBytes());

        // The decoded key and signature go together: they verify the payload of the tag.
        const payload = encodeSignatureTagPayload(handler.toObject());
        await expect(publicKey.verify(payload, handler.getSignature())).resolves.toBe(true);
    });

    it("rejects an object that is not a signature tag", () => {
        const {signedAt, ...withoutSignedAt} = fullTag().metadata;
        void signedAt;

        expect(() => SignatureTagHandler.fromObject({...fullTag(), metadata: withoutSignedAt})).toThrow();
        expect(() => SignatureTagHandler.fromObject({...fullTag(), pk: 42})).toThrow();
        expect(() => SignatureTagHandler.fromObject(undefined)).toThrow();
    });

    it("rejects a tag holding neither the signed data nor a path to it, or both", () => {
        const {data, ...withoutData} = fullTag();
        void data;

        expect(() => SignatureTagHandler.fromObject(withoutData)).toThrow(/either the signed data or the path/);
        expect(() => SignatureTagHandler.fromObject({...fullTag(), path: "documents/terms.pdf"}))
            .toThrow(/either the signed data or the path/);
    });
});

describe("SignatureTagBuilder", () => {

    /** The signer of every tag built here. */
    let privateKey: PrivateSignatureKey;

    /** A builder holding the members every tag built here needs. */
    function builderWithRequiredMembers(): SignatureTagBuilder {
        return SignatureTagBuilder.create()
            .setTitle("Terms of service")
            .setMessage("Please sign the terms of service")
            .setOrigin("https://example.com")
            .setRequestedAt("2026-09-04T08:00:00.000Z")
            .setEmbeddedData({version: 3, accepted: true});
    }

    beforeAll(() => {
        privateKey = Secp256k1PrivateSignatureKey.gen();
    });

    it("signs a tag carrying every member", async () => {
        const handler = await builderWithRequiredMembers()
            .setSignedAt("2026-09-04T08:01:30.000Z")
            .setNotValidBefore("2026-09-04T00:00:00.000Z")
            .setNotValidAfter("2026-12-31T23:59:59.000Z")
            .setAllowOnChain(true)
            .setOrganizationId("organization-id")
            .setApplicationId("application-id")
            .setApplicationLedgerId("application-ledger-id")
            .setLatestMicroblockHash("aabbcc")
            .signWith(privateKey);

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
        expect(handler.getEmbeddedData()).toEqual({version: 3, accepted: true});

        // The tag is signed by the key it names, over its own payload.
        expect(handler.getEncodedPublicKey())
            .toBe(await encoder.encodePublicKey(await privateKey.getPublicKey()));
        const publicKey = await handler.getPublicKey();
        const payload = encodeSignatureTagPayload(handler.toObject());
        await expect(publicKey.verify(payload, handler.getSignature())).resolves.toBe(true);
    });

    it("leaves the members it was not given out of the tag", async () => {
        const handler = await builderWithRequiredMembers()
            .setReferencedData("documents/terms.pdf")
            .signWith(privateKey);

        expect(Object.keys(handler.getMetadata()).sort())
            .toEqual(["message", "origin", "requestedAt", "signedAt", "title"]);
        expect(handler.isOnChainAllowed()).toBe(false);
    });

    it("holds either the data or the path to it, whichever was set last", async () => {
        const referenced = await builderWithRequiredMembers()
            .setReferencedData("documents/terms.pdf")
            .signWith(privateKey);

        expect(referenced.isReferencedData()).toBe(true);
        expect(referenced.isEmbeddedData()).toBe(false);
        expect(referenced.getReferencedDataPath()).toBe("documents/terms.pdf");
        expect(referenced.toObject()).not.toHaveProperty("data");

        const embedded = await builderWithRequiredMembers()
            .setReferencedData("documents/terms.pdf")
            .setEmbeddedData({version: 3, accepted: true})
            .signWith(privateKey);

        expect(embedded.isEmbeddedData()).toBe(true);
        expect(embedded.isReferencedData()).toBe(false);
        expect(embedded.getEmbeddedData()).toEqual({version: 3, accepted: true});
        expect(embedded.toObject()).not.toHaveProperty("path");
    });

    it("dates the signature at the moment it signs, unless told otherwise", async () => {
        const before = Date.now();
        const handler = await builderWithRequiredMembers().signWith(privateKey);
        const after = Date.now();

        const signedAt = Date.parse(handler.getSignedAt());
        expect(signedAt).toBeGreaterThanOrEqual(before);
        expect(signedAt).toBeLessThanOrEqual(after);

        // A `Date` is accepted wherever a date string is.
        const dated = await builderWithRequiredMembers()
            .setSignedAt(new Date("2026-09-04T08:01:30.000Z"))
            .signWith(privateKey);
        expect(dated.getSignedAt()).toBe("2026-09-04T08:01:30.000Z");
    });

    it("signs the same payload whatever order the members were set in", async () => {
        const one = await SignatureTagBuilder.create()
            .setTitle("Terms of service")
            .setOrigin("https://example.com")
            .setSignedAt("2026-09-04T08:01:30.000Z")
            .setRequestedAt("2026-09-04T08:00:00.000Z")
            .setMessage("Please sign the terms of service")
            .setEmbeddedData({version: 3, accepted: true})
            .signWith(privateKey);

        const other = await SignatureTagBuilder.create()
            .setEmbeddedData({accepted: true, version: 3})
            .setMessage("Please sign the terms of service")
            .setSignedAt("2026-09-04T08:01:30.000Z")
            .setTitle("Terms of service")
            .setRequestedAt("2026-09-04T08:00:00.000Z")
            .setOrigin("https://example.com")
            .signWith(privateKey);

        expect(encodeSignatureTagPayload(other.toObject()))
            .toEqual(encodeSignatureTagPayload(one.toObject()));
        await expect((await other.getPublicKey())
            .verify(encodeSignatureTagPayload(other.toObject()), one.getSignature()))
            .resolves.toBe(true);
    });

    it("signs a tag no member of which can be changed afterwards", async () => {
        const handler = await builderWithRequiredMembers().signWith(privateKey);
        const publicKey = await handler.getPublicKey();
        const signature = handler.getSignature();
        const tag = handler.toObject();

        for (const tampered of [
            {...tag, metadata: {...tag.metadata, title: "Something else"}},
            {...tag, metadata: {...tag.metadata, allowOnChain: true}},
            {...tag, data: {version: 4, accepted: true}},
            {metadata: tag.metadata, path: "documents/terms.pdf", pk: tag.pk, signature: tag.signature},
            {...tag, pk: await encoder.encodePublicKey(await Secp256k1PrivateSignatureKey.gen().getPublicKey())},
        ]) {
            await expect(publicKey.verify(encodeSignatureTagPayload(tampered), signature))
                .resolves.toBe(false);
        }
    });

    it("refuses to sign a tag missing a required member", async () => {
        await expect(SignatureTagBuilder.create().signWith(privateKey))
            .rejects.toThrow(/without a title/);
        await expect(SignatureTagBuilder.create().setTitle("Terms of service").signWith(privateKey))
            .rejects.toThrow(/without a message/);
        await expect(
            SignatureTagBuilder.create()
                .setTitle("Terms of service")
                .setMessage("Please sign the terms of service")
                .signWith(privateKey),
        ).rejects.toThrow(/without an origin/);
        await expect(
            SignatureTagBuilder.create()
                .setTitle("Terms of service")
                .setMessage("Please sign the terms of service")
                .setOrigin("https://example.com")
                .signWith(privateKey),
        ).rejects.toThrow(/without a request date/);
        await expect(
            SignatureTagBuilder.create()
                .setTitle("Terms of service")
                .setMessage("Please sign the terms of service")
                .setOrigin("https://example.com")
                .setRequestedAt("2026-09-04T08:00:00.000Z")
                .signWith(privateKey),
        ).rejects.toThrow(/without data/);
    });
});
