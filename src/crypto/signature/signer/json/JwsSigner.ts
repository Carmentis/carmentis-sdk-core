import {JwkPrivateSignatureKey} from "../../jwk/JwkPrivateSignatureKey";
import {CryptoEncoderFactory} from "../../../encoder/CryptoEncoderFactory";
import {JwsSignatureObject, SignatureContext, SignatureType} from "../../../../type/JsonSignatureSchemas";
import {
    bytesToBase64Url,
    deriveJwtClaimsFromSignatureContext,
    determineJwsAlgorithm,
    utf8StringToBase64Url
} from "./JsonSignatureUtils";

export class JwsSigner {
    private includePublicKey: boolean = true;
    private typ: string = 'JWT';

    /**
     * Creates a JWS signature object from the given payload and signature context.
     *
     * @param sk The private signature key.
     * @param context The context in which the signature is considered valid.
     * @param payload The payload to sign.
     */
    async sign(
        sk: JwkPrivateSignatureKey,
        context: SignatureContext,
        payload: Record<string, unknown>
    ): Promise<JwsSignatureObject> {
        // reject if the payload is not a flat, plain object
        if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
            throw new TypeError(
                'JWS payload must be a flat, plain object so it can be inlined as JWT claims'
            );
        }

        // load the private JWK
        const privateJwk = sk.getPrivateJwk();
        const alg = determineJwsAlgorithm(privateJwk);

        // populate standard claims in the jwt header
        const standardClaims = deriveJwtClaimsFromSignatureContext(context);
        const collidingClaim = Object.keys(standardClaims).find(key => key in payload);
        if (collidingClaim) {
            throw new Error(
                `Payload defines reserved claim "${collidingClaim}", already derived from the signature context`
            );
        }

        const header: Record<string, unknown> = {
            alg,
            typ: this.typ,
            ...(privateJwk.kid ? {kid: privateJwk.kid} : {}),
            // context is added here without being flattened
            context,
            ...standardClaims,
        };

        const encodedHeader = utf8StringToBase64Url(JSON.stringify(header));
        const encodedPayload = utf8StringToBase64Url(JSON.stringify(payload));
        const signingInput = `${encodedHeader}.${encodedPayload}`;

        const signingInputBytes = new TextEncoder().encode(signingInput);
        const rawSignature = await sk.sign(signingInputBytes);
        const encodedSignature = bytesToBase64Url(rawSignature);

        const jws = `${signingInput}.${encodedSignature}`;

        let publicKey: string | undefined;
        if (this.includePublicKey) {
            const encoder = CryptoEncoderFactory.defaultStringSignatureEncoder();
            publicKey = await encoder.encodePublicKey(await sk.getPublicKey());
        }

        return {
            signatureType: SignatureType.JWS,
            jws,
            ...(publicKey !== undefined && {publicKey}),
        };
    }
}