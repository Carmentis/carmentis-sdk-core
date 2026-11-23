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

    /** True when the key's plugin does not implement the requested method. */
    isUnsupported(): boolean {
        return this.status === 501;
    }
}
