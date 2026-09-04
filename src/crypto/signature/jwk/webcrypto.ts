/**
 * Returns the Web Crypto `SubtleCrypto` implementation of the current runtime.
 *
 * The lookup is deliberately lazy: resolving `globalThis.crypto.subtle` at module
 * scope would throw while merely importing the module on runtimes where Web Crypto
 * is not exposed globally (Node.js < 19, browsers in an insecure context).
 *
 * @return {SubtleCrypto} The `SubtleCrypto` instance of the current runtime.
 * @throws {Error} If the runtime does not expose the Web Crypto API.
 */
export function getSubtle(): SubtleCrypto {
    const webCrypto = globalThis.crypto;
    if (!webCrypto || !webCrypto.subtle) {
        throw new Error(
            "The Web Crypto API is not available: 'globalThis.crypto.subtle' is undefined. " +
            "In Node.js, use version 19 or later (or assign `globalThis.crypto = require('node:crypto').webcrypto`); " +
            "in a browser, make sure the page runs in a secure context (HTTPS or localhost).",
        );
    }
    return webCrypto.subtle;
}
