import {NetworkProvider} from '../../src/providers/NetworkProvider';
import {describe, it, expect} from 'vitest';

describe('NetworkProvider', () => {
    it('should return the chainId', async () => {
        const nodeUrl = "https://node2.server2.devnet.carmentis.io";
        const provider = new NetworkProvider(nodeUrl);
        const chainId = await provider.getChainId();
        expect(chainId).toEqual("cmts:devnet");
    });
});
