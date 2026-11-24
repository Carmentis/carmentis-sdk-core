/** Error raised when the KMS answers with a non-2xx status. */
export class KmsError extends Error {
    constructor(
        public readonly status: number,
        public readonly body: unknown,
        message?: string,
    ) {
        super(message ?? `KMS request failed with HTTP ${status}`);
        this.name = "KmsError";
    }

    /**
     * True for an unknown wallet, a wallet API key used on another wallet, or a signed
     * request on a wallet the signer does not administer (the KMS answers 404 in all cases).
     */
    isNotFound(): boolean {
        return this.status === 404;
    }

    /** True when the wallet's plugin does not implement the requested method. */
    isUnsupported(): boolean {
        return this.status === 501;
    }
}
