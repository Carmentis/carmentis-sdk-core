import {AccountVb} from "./AccountVb";
import {ProviderFactory} from "../../providers/ProviderFactory";
import {Microblock} from "../microblock/Microblock";
import {configure, getConsoleSink} from "@logtape/logtape";
import {Secp256k1PublicSignatureKey} from "../../crypto/signature/secp256k1/Secp256k1PublicSignatureKey";
import {Secp256k1PrivateSignatureKey} from "../../crypto/signature/secp256k1/Secp256k1PrivateSignatureKey";
import {ProtocolVb} from "./ProtocolVb";
import {BlockchainUtils} from "../../utils/BlockchainUtils";
import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(async () => {
    await configure({
        sinks: { console: getConsoleSink() },
        loggers: [
            { category: 'microblock', lowestLevel: 'debug', sinks: ['console']  }
        ]
    })
})

describe("virtualBlockchain.appendMicroblock", () => {
    it('should correctly add a microblock', async () => {
        const provider = ProviderFactory.createInMemoryProvider();
        const accountVb = new AccountVb(provider);
        expect(accountVb.isEmpty()).toBeTruthy();
        expect(accountVb.getHeight()).toEqual(0);

        // create an initial microblock
        const sk = Secp256k1PrivateSignatureKey.gen();
        const pk = await sk.getPublicKey();
        const microblock = await AccountVb.createIssuerAccountCreationMicroblock(
            pk
        );
        await microblock.seal(sk);
        //const signature = await microblock.sign(sk);
        //microblock.addAccountSignatureSection({ signature, schemeId: sk.getSignatureSchemeId() });
        await accountVb.appendMicroBlock(microblock)
        expect(accountVb.getHeight()).toEqual(1)
        expect(accountVb.isEmpty()).toBeFalsy();
        expect(await accountVb.getPublicKey()).toBeInstanceOf(Secp256k1PublicSignatureKey);
        expect(await accountVb.getMicroblock(1)).toBeInstanceOf(Microblock)
    });
})

describe("Virtual blockchain encoding", () => {
    it("Should correctly encode and decode a virtual blockchain state", async () => {
        // we create a protocol vb which contains a more complex internal state
        const provider = ProviderFactory.createInMemoryProvider();
        const vb = new ProtocolVb(provider);
        const state = await vb.getVirtualBlockchainState();
        const encodedState = BlockchainUtils.encodeVirtualBlockchainState(state);
        const decodedState = BlockchainUtils.decodeVirtualBlockchainState(encodedState);
        expect(decodedState).toEqual(state);
    })
})