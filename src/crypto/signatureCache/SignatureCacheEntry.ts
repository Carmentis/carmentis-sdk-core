export class SignatureCacheEntry  {
    private key: string;

    constructor(signatureAlgorithm: number, publicKeyString: string, messageHashString: string) {
        this.key = `${signatureAlgorithm}|${publicKeyString}|${messageHashString}`;
    }

    getKey() {
        return this.key;
    }
}
