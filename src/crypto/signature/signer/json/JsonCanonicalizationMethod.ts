/**
 * JSON canonicalization methods for transforming JSON objects before signature verification.
 * Currently supports JSON Canonicalization Scheme (JCS) per RFC 8785.
 * Additional methods can be added without breaking existing clients.
 */
export enum JsonCanonicalizationMethod {
    /** RFC 8785 JSON Canonicalization Scheme */
    JSON_CANONICAL = 'json-canonical',
    CBOR = "cbor"
}