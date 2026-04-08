import {configure, getConsoleSink} from "@logtape/logtape";
import {ProviderFactory} from "../../providers/ProviderFactory";
import {
    WalletRequestBasedApplicationLedgerMicroblockBuilder
} from "./WalletRequestBasedApplicationLedgerMicroblockBuilder";
import {ApplicationLedgerVb} from "./ApplicationLedgerVb";
import {WalletCrypto} from "../../wallet/WalletCrypto";
import {Utils} from "../../utils/utils";
import {CMTSToken} from "../../economics/currencies/token";
import {Secp256k1PrivateSignatureKey} from "../../crypto/signature/secp256k1/Secp256k1PrivateSignatureKey";
import {MlKemPrivateDecryptionKey} from "../../crypto/encryption/public-key-encryption/MlKemPrivateDecryptionKey";
import {ActorNotSubscribedError} from "../../errors/carmentis-error";
import {Hash} from "../../entities/Hash";
import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(async () => {
    await configure({
        sinks: { console: getConsoleSink() },
        loggers: [
            { category: '@cmts-dev/carmentis-sdk', lowestLevel: 'debug', sinks: ['console']  }
        ]
    })
})


describe('ApplicationLedgerStateUpdateRequest', () => {
    const request  = {
        /*
        actorAssignations: [],
        actors: [
            { name: 'sender' },
            { name: 'receiver' },
            { name: 'filesign' },
        ],
        approvalMessage: "",
        author: "filesign",
        channelAssignations: [],
        channels: [
            { public: true, name: "main" }
        ],
        endorser: "sender",
        hashableFields: [],
        maskableFields: [],
        data: {}

         */
        author: 'filesign',
        endorser: 'sender',
        data: {},
        channels: [
            {
                name: 'mainChannel',
                public: false,
            }
        ],
        channelAssignations: [
            {
                channelName: 'mainChannel',
                fieldPath: 'this.*'
            }
        ],
        actors: [
            { name: "filesign" },
            { name: "sender" },
            { name: "receiver" },
        ],
        actorAssignations: [
            {
                channelName: 'mainChannel',
                actorName: 'filesign'
            },
            {
                channelName: 'mainChannel',
                actorName: 'sender'
            },
        ],
        approvalMessage: 'sendingConfirm',
    }

    const walletCrypto = WalletCrypto.generateWallet();
    const provider = ProviderFactory.createInMemoryProviderWithExternalProvider("http://localhost:26657");

    it("Should fails with a not subscribed actor", async () => {
        // we enable the draft mode to be able to work with the current microblock
        const applicationLedger = ApplicationLedgerVb.createApplicationLedgerVirtualBlockchain(provider);
        const mbBuilder = await WalletRequestBasedApplicationLedgerMicroblockBuilder.createFromVirtualBlockchain(
            Hash.from(Utils.getNullHash()),
            applicationLedger
        );
        try {
            await mbBuilder.createMicroblockFromStateUpdateRequest(
                walletCrypto.getDefaultAccountCrypto(),
                request
            )
            expect(true).toBe(false);
        } catch (e) {
            expect(e).toBeInstanceOf(ActorNotSubscribedError);
            if (e instanceof ActorNotSubscribedError) {
                expect(e.getNotSubscribedActorName()).toBe('sender')
            }
        }
    })

    it('should create a microblock', async () => {

        // we enable the draft mode to be able to work with the current microblock
        const applicationLedger = ApplicationLedgerVb.createApplicationLedgerVirtualBlockchain(provider);
        const mbBuilder = await WalletRequestBasedApplicationLedgerMicroblockBuilder.createFromVirtualBlockchain(
            Hash.from(Utils.getNullHash()),
            applicationLedger
        );
        await mbBuilder.subscribeActor(
            'sender',
            await Secp256k1PrivateSignatureKey.gen().getPublicKey(),
            await (await MlKemPrivateDecryptionKey.gen()).getPublicKey()
            )
        const mb = await mbBuilder.createMicroblockFromStateUpdateRequest(
            walletCrypto.getDefaultAccountCrypto(),
            request
            )

        for (const actor of ['sender', "receiver", "filesign"]) {
            const isAssumedToBeSubscribed = actor !== 'receiver';
            expect(applicationLedger.isActorDefined(actor)).toBe(true);
            expect(applicationLedger.actorIsSubscribed(actor)).toBe(isAssumedToBeSubscribed);
        }
        expect(applicationLedger.isActorDefined('unknown')).toBe(false)


        // we create a new application ledger which simulates what is supposed to do the wallet to verify
        const newApplicationLedger = ApplicationLedgerVb.createApplicationLedgerVirtualBlockchain(provider);
        newApplicationLedger.enableDraftMode();
        await newApplicationLedger.appendMicroBlock(mb);

        for (const actor of ['sender', "receiver", "filesign"]) {
            const isAssumedToBeSubscribed = actor !== 'receiver';
            expect(newApplicationLedger.isActorDefined(actor)).toBe(true);
            expect(newApplicationLedger.actorIsSubscribed(actor)).toBe(isAssumedToBeSubscribed);
        }
        /*
        const provider = ProviderFactory.createInMemoryProvider();
        const vb = new ApplicationLedgerVb(provider);
        const mb = Microblock.createGenesisApplicationLedgerMicroblock();
        const builder = new ApplicationLedgerStateUpdateRequestHandler(mb, vb);

        const hostPrivateDecryptionKey = MlKemPrivateDecryptionKey.gen();
        await builder.createMicroblockFromStateUpdateRequest(
            hostPrivateDecryptionKey,
            {
                applicationId: Utils.binaryToHexa(new Uint8Array(32)),
                author: "test",
                data: {}
            }
        )

         */
    })
});