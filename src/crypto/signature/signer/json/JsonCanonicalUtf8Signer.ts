import {BinaryEncoding} from "../binary/BinaryEndoding";
import {PrivateSignatureKey} from "../../PrivateSignatureKey";
import {CryptoEncoderFactory} from "../../../encoder/CryptoEncoderFactory";
import {JsonEncoder} from "./JsonEncoder";
import {JsonCanonicalizationMethod} from "./JsonCanonicalizationMethod";
import {BinaryEncoder} from "../binary/BinaryEncoder";
import {SignatureContext, SignatureObject, SignatureType} from "../../../../type/JsonSignatureSchemas";

export class JsonCanonicalUtf8Signer {
    private signatureEncoding: BinaryEncoding = BinaryEncoding.BASE64;
    private includePayload: boolean = true;
    private includePublicKey: boolean = true;
    private includeSignatureEncoding: boolean = true;
    private location?: object = undefined;

    setSignatureEncoding(encoding: BinaryEncoding) {
        this.signatureEncoding = encoding;
        return this;
    }

    setIncludePayload(shouldInclude: boolean) {
        this.includePayload = shouldInclude
        this.location = undefined;
        return this;
    }

    setIncludePublicKey(shouldInclude: boolean) {
        this.includePublicKey = shouldInclude
        return this;
    }

    setIncludeSignatureEncoding(shouldInclude: boolean) {
        this.includeSignatureEncoding = shouldInclude
        return this;
    }

    /**
     * Useful when the payload should not be referred here but elsewhere.
     *
     * When specified, the payload is automatically ignored in the returned signature
     * and the provided location object is put inplace (flat).
     */
    setPayloadLocation(location: object) {
        this.location = location;
        this.includePayload = false;
    }

    async sign(
        sk: PrivateSignatureKey,
        context: SignatureContext,
        payload: unknown
    ): Promise<SignatureObject> {
        const encoder = CryptoEncoderFactory.defaultStringSignatureEncoder();
        const pk = this.includePublicKey ? (
            await encoder.encodePublicKey(await sk.getPublicKey())
        ) : undefined;
        const rawMessage = JsonEncoder.encode(
            {
                context,
                payload
            },
            JsonCanonicalizationMethod.JSON_CANONICAL
        );
        const rawSignature = await sk.sign(rawMessage);
        const signature = BinaryEncoder.encode(rawSignature, this.signatureEncoding)
        return {
            signatureType: SignatureType.JSON_CANONICAL_UTF8,
            context,
            signature,
            ...this.location,
            ...(this.includePayload && {payload}),
            ...(this.includePublicKey && {publicKey: pk}),
            ...(this.includeSignatureEncoding && {signatureEncoding: this.signatureEncoding})
        }
    }
}