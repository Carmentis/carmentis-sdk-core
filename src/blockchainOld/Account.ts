export {}
/*
export class Account {
    vb: AccountVb;
    provider: Provider;
    gasPrice: CMTSToken;

    constructor({provider}: {provider: Provider}) {
        this.vb = new AccountVb({ provider });
        this.provider = provider;
        this.gasPrice = CMTSToken.zero();
    }

    async _createGenesis(genesisPublicKey?: PublicSignatureKey) {
        // we need a public key to create the genesis account, so we raise an exception if
        // both the provider and the default public key are undefined
        const isUnkeyed = !this.provider.isKeyed();
        const undefinedGenesisPublicKey = genesisPublicKey === undefined;
        if (isUnkeyed && undefinedGenesisPublicKey) {
            throw new IllegalStateError("Cannot create a genesis account without a keyed provider or default public key.")
        }

        // we use in priority the default public key, if provided, or the keyed provider's public key
        const publicKey = genesisPublicKey || this.getPrivateSignatureKey().getPublicKey();
        await this.vb.setSignatureScheme({
            schemeId: this.getSignatureSchemeId()
        });
        await this.vb.setPublicKey(publicKey);
        await this.vb.setTokenIssuance({
            amount: ECO.INITIAL_OFFER
        });

    }

    /**
     *
     * @param {Uint8Array} sellerAccount
     * @param {PublicSignatureKey} buyerPublicKey
     * @param {number} amount
     * @returns {Promise<void>}
     * @private
     *
    async _create(sellerAccount: Uint8Array, buyerPublicKey: PublicSignatureKey, amount: number) {
        if (!this.provider.isKeyed()) throw new IllegalStateError("Cannot create an account without a keyed provider.")
        await this.vb.setSignatureScheme({
            schemeId: this.getSignatureSchemeId()
        });

        await this.vb.setPublicKey(buyerPublicKey);

        await this.vb.setCreation({
            sellerAccount: sellerAccount,
            amount: amount
        });
    }

    async _load(identifier: Uint8Array) {
        await this.vb.load(identifier);
    }



    async transfer(object: AccountTransfer) {
        await this.vb.setTransfer(object);
    }

    async vestingTransfer(object: AccountVestingTransfer) {
        await this.vb.setVestingTransfer(object);
    }

    async escrowTransfer(object: AccountEscrowTransfer) {
        await this.vb.setEscrowTransfer(object);
    }

    async stake(object: AccountStake) {
        await this.vb.setStake(object);
    }

    setGasPrice(gasPrice: CMTSToken) {
        this.gasPrice = gasPrice;
    }

    async publishUpdates(waitForAnchoring = true) {
        if (this.provider.isKeyed()) {
            this.vb.setGasPrice(this.gasPrice);
            await this.vb.setSignature(this.getPrivateSignatureKey());
            return await this.vb.publish(waitForAnchoring);
        } else {
            throw new IllegalStateError("Cannot publish updates without a keyed provider.");
        }

    }

    private getSignatureSchemeId() {
        if (this.provider.isKeyed()) {
            return this.getPrivateSignatureKey().getSignatureSchemeId();
        } else {
            throw new IllegalStateError("Cannot get signature scheme ID without a keyed provider.")
        }
    }

    private getPrivateSignatureKey() {
        if (this.provider.isKeyed()) {
            return this.provider.getPrivateSignatureKey();
        } else {
            throw new IllegalStateError("Cannot get private signature key without a keyed provider.")
        }
    }

    getVirtualBlockchainId() {
        return Hash.from(this.vb.getId());
    }

    async isIssuer() {
        const firstBlock = await this.vb.getFirstMicroBlock();
        try {
            const foundSection = firstBlock.getSection(section => section.type === SectionType.ACCOUNT_TOKEN_ISSUANCE);
            return true;
        } catch (e) {
            return false;
        }

    }
}

 */
