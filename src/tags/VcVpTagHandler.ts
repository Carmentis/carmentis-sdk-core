import * as v from "valibot";
import { TAG } from '../type/tags/tags';
import { TagHandler } from "./TagHandler";
import { TagHandlerOutput } from '../resolver/ResolverTypes';
import { VcVpTagType, VcVpSchema } from "../type/VcVpSchema";
import { SdJwt } from "../credentials/SdJwt";
import { VcNode, VpNode } from '../type/valibot/resolutionNodes/ResolutionNodes';
import { ResolverPath } from '../resolver/ResolverPath';

export class VcVpTagHandler extends TagHandler {
    getTags() {
        return [ { name: TAG.VC }, { name: TAG.VP } ];
    }

    async handle(tag: string, object: any, path: ResolverPath) {
        const wrapper = v.parse(VcVpSchema, object);
        const isVc = tag == TAG.VC;
        switch (wrapper.type) {
            case VcVpTagType.SDJWT_IETF: {
                return await this.processSdJwt(isVc, wrapper.sdjwt_ietf);
            }
            case VcVpTagType.JWT_W3C: {
                return await this.processJwtW3c(isVc, wrapper.jwt_w3c);
            }
        }
    }

    private async processSdJwt(isVc: boolean, str: string) {
        const sdJwt = new SdJwt(str);
        const object = await sdJwt.decode();
        // TODO: re-enable this check
        if (false && !object.valid) {
            throw new Error("the verification of the claims failed");
        }
        const node: VcNode | VpNode = {
            type: isVc ? "vc" : "vp",
            valid: true,
        }
        return {
            output: object.claims,
            node,
            resolveOutput: false,
        };
    }

    private async processJwtW3c(isVc: boolean, str: any): Promise<TagHandlerOutput> {
        throw new Error(`'jwt_w3c' is not yet supported`);
    }
}
