export class CometBFTPublicKey {

    private static readonly ED25519_PUBLIC_KEY_TYPE = "tendermint/PubKeyEd25519";
    static createFromEd25519PublicKey( publicKey: string ) {
        return new CometBFTPublicKey( CometBFTPublicKey.ED25519_PUBLIC_KEY_TYPE, publicKey );
    }

    private constructor(
        private readonly type: string,
        private readonly publicKey: string
    ) {}

    getType() {
        return this.type;
    }

    getPublicKey() {
        return this.publicKey;
    }
}