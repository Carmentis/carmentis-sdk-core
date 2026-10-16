import {describe, it, expect, vi} from 'vitest'
import {ProviderFactory} from "../../src/providers/ProviderFactory";
import {ApplicationLedgerVb} from "../../src/blockchain/virtualBlockchains/ApplicationLedgerVb";
import {
    WalletRequestBasedApplicationLedgerMicroblockBuilder
} from "../../src/blockchain/virtualBlockchains/WalletRequestBasedApplicationLedgerMicroblockBuilder";
import {
    CryptoHandlerApplicationLedgerActorIdentityAdapter
} from "../../src/blockchain/virtualBlockchains/IApplicationLedgerActorIdentity";
import {VirtualBlockchainSeed} from "../../src/blockchain/virtualBlockchains/VirtualBlockchainSeed";
import {ProtocolInternalState} from "../../src/blockchain/internalStates/ProtocolInternalState";
import {VirtualBlockchainType} from "../../src/type/VirtualBlockchainType";
import {SectionType} from "../../src/type/valibot/blockchain/section/SectionType";
import {WalletCrypto} from "../../src/wallet/WalletCrypto";
import {Hash} from "../../src/entities/Hash";
import {Utils} from "../../src/utils/utils";

describe('WalletRequestBasedApplicationLedgerMicroblockBuilder', () => {
    it('should not invite the creator of a channel on its own channel', async () => {
        // the builder only requires the protocol state from the provider: no node is needed
        const provider = ProviderFactory.createInMemoryProvider();
        vi.spyOn(provider, 'getProtocolState').mockResolvedValue(ProtocolInternalState.createInitialState());

        const vb = ApplicationLedgerVb.createApplicationLedgerVirtualBlockchain(provider);
        const vbSeed = VirtualBlockchainSeed.create(VirtualBlockchainType.APP_LEDGER_VIRTUAL_BLOCKCHAIN, 0);
        const builder = await WalletRequestBasedApplicationLedgerMicroblockBuilder.createFromEmptyVirtualBlockchain(
            Hash.from(Utils.getNullHash()),
            vb,
            vbSeed
        );
        const identity = new CryptoHandlerApplicationLedgerActorIdentityAdapter(
            WalletCrypto.generateWallet().getDefaultAccountCrypto()
        );

        // the author (actor 0) creates the private channel "main" and is assigned to it
        const mb = await builder.createMicroblockFromStateUpdateRequest(identity, {
            channels: [
                {
                    name: "main",
                    public: false
                }
            ],
            actors: [
                {
                    name: "test"
                }
            ],
            data: {
                __digest__: {
                    digest: "BD0D627406CE45439AB17B9E26ED56DE666517E00705D4EA85754EF624BE28E4",
                    type: "json",
                    encoding: "canonical",
                    digestAlg: "sha256"
                }
            },
            channelAssignations: [
                {
                    channelName: "main",
                    fieldPath: "this.*"
                }
            ],
            actorAssignations: [
                {
                    actorName: "test",
                    channelName: "main"
                }
            ],
            author: "test"
        });

        // the channel is created by actor 0, who derives the channel key locally
        const channelCreations = mb.getSectionsByType(SectionType.APP_LEDGER_CHANNEL_CREATION);
        expect(channelCreations).toHaveLength(1);
        expect((channelCreations[0] as any).creatorId).toBe(0);

        // no invitation should be included: the creator cannot invite himself
        expect(mb.getSectionsByType(SectionType.APP_LEDGER_CHANNEL_INVITATION)).toHaveLength(0);

        // should contain an application ledger creation
        expect(mb.getSectionsByType(SectionType.APP_LEDGER_CREATION)).toHaveLength(1);

        // the data are still encrypted in the private channel
        expect(mb.getSectionsByType(SectionType.APP_LEDGER_PRIVATE_CHANNEL_DATA)).toHaveLength(1);
    })
});
