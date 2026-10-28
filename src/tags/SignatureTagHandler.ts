import * as v from "valibot";
import { TAG } from '../type/tags/tags';
import { TagHandler } from "./TagHandler";
import { JsonObject } from '../type/valibot/json/Json';
import { SignatureObjectSchema, SignatureVerificationContextSchema } from '../type/JsonSignatureSchemas';
import { DckfSignatureDecoder } from "../crypto/encoder/signature/dckf/DckfSignatureDecoder";
import { JsonSignatureParser } from "../crypto/signature/signer/json/JsonSignatureParser";
import { JsonSignatureVerifier } from "../crypto/signature/signer/json/JsonSignatureVerifier";
import { SignatureNode } from '../type/valibot/resolutionNodes/ResolutionNodes';
import { ResolverPath } from '../resolver/ResolverPath';

export class SignatureTagHandler extends TagHandler {
    getTags() {
        return [ { name: TAG.SIGNATURE } ];
    }

    async handle(tag: string, object: any, path: ResolverPath) {
        const wrapper = v.parse(SignatureObjectSchema, object);
        const keyDecoder = new DckfSignatureDecoder();
        if (wrapper.publicKey === undefined) {
            throw new Error('no public key provided');
        }
        const pk = await keyDecoder.decodePublicKey(wrapper.publicKey);
        const parsedContext = v.safeParse(SignatureVerificationContextSchema, wrapper.context ?? {});
        if (!parsedContext.success) {
            throw new Error(
                `Invalid verification context: ${parsedContext.issues.map(issue => issue.message).join('; ')}`,
            );
        }

        let parsedSignature;
        try {
            parsedSignature = JsonSignatureParser.parse(object);
        }
        catch(err) {
            console.error(err);
            throw new Error("malformed signature");
        }
        const verifier = new JsonSignatureVerifier();
        if (wrapper.payload !== undefined) {
            verifier.setPayload(wrapper.payload);
        }
        const result = await verifier.verify(pk, parsedSignature, parsedContext.output);
        if (!result.verified) {
            throw new Error("the signature verification failed");
        }
        const node: SignatureNode = {
            type: "signature",
            publicKey: wrapper.publicKey,
            valid: true,
        }
        return {
            output: result.payload as JsonObject,
            node,
            resolveOutput: false,
        };
    }
}
