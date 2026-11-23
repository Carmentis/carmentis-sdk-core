# Using the Carmentis KMS from the SDK

The SDK talks to a Carmentis KMS through three building blocks (all exported from `@cmts-dev/carmentis-sdk-core`):

| Class | Role |
|---|---|
| `KmsSession` | Logs in by signing a server challenge with *your* access key, and keeps the JWT fresh. |
| `CarmentisKmsClient` | Typed HTTP client for the user-facing endpoints. |
| `KmsPrivateSignatureKey` | A signature key whose `sign()` is delegated to the KMS; the private key never leaves the server. |

## 1. Open a session

Your own key identifies you: its public half is the *access key* of your userspaces.

```ts
import {Secp256k1PrivateSignatureKey, KmsSession} from "@cmts-dev/carmentis-sdk-core";

const accessKey = Secp256k1PrivateSignatureKey.gen(); // or load your persisted key

const session = new KmsSession({baseUrl: "https://kms.example.com", accessKey});
const kms = session.createClient();
```

The session requests a challenge (`POST /api/auth/user/challenge`), signs it, exchanges it for a JWT
(`POST /api/auth/user/login`) and renews it before expiry. On a `401`, the client re-authenticates and retries once.

## 2. Userspaces

```ts
// Public mode: creates a userspace whose access key is the current session key.
const userspace = await kms.createPublicUserspace({label: "My userspace", metadata: {team: "billing"}});

const mine = await kms.listMyUserspaces();
const details = await kms.getUserspace(userspace.id);
```

> `updateUserspace`, `deleteUserspace`, `addAccessKey` and `removeAccessKey` are documented as
> administrator / API-key endpoints; with a plain user session the server may reject them.

## 3. Discover plugins

Each plugin lists its `capabilities`. The `key/create` capability carries the JSON Schema of the parameters
expected when creating a key.

```ts
const plugins = await kms.listPlugins();
for (const plugin of plugins) {
    console.log(plugin.id, plugin.name, plugin.builtin);
    for (const cap of plugin.capabilities) {
        console.log("  ", cap.method, cap.params ?? "(no params)");
    }
}

const local = plugins.find(p => p.id === "local")!;
const createSchema = local.capabilities.find(c => c.method === "key/create")?.params;
```

Known methods: `key/create`, `key/public`, `sign/raw`, `sign/json`, `cert/get`, `cert/create-self-signed`, `cert/csr`.

## 4. Create a key and sign

```ts
import {KmsPrivateSignatureKey} from "@cmts-dev/carmentis-sdk-core";

const key = await KmsPrivateSignatureKey.create({
    client: kms,
    userspaceId: userspace.id,
    pluginId: "local",
    label: "Document signing",
    params: {algorithm: "ES256"}, // validated against the plugin's key/create schema
});

const data = new TextEncoder().encode("hello world");
const signature = await key.sign(data);          // delegated to POST .../sign/raw

const publicKey = await key.getPublicKey();       // KmsPublicSignatureKey, verified locally
console.log(await publicKey.verify(data, signature)); // true
```

To reuse an existing key:

```ts
const key = await KmsPrivateSignatureKey.fromKmsKey({client: kms, userspaceId, keyId});
```

## 5. Inspect a key

```ts
const keys = await kms.listKeys(userspace.id);

// Methods this particular key supports (may be narrower than its plugin's).
const caps = await kms.getKeyCapabilities(userspace.id, keys[0].id);

const jwk = await kms.getPublicJwk(userspace.id, keys[0].id);
const carmentisPk = await kms.getPublicKey(userspace.id, keys[0].id, "carmentis");
```

## 6. Sign a JSON payload

`sign/json` signs structured data together with a context (`purpose` is required, `signedAt` defaults to now).

```ts
const result = await kms.signJson(userspace.id, key.getKmsReference().keyId, {
    payload: {documentId: "doc-42", amount: {value: 1250.5, currency: "EUR"}},
    context: {purpose: "invoice-approval"},
    signatureType: "json-canonical+utf8", // or "jws"
});

if (result.signatureType === "jws") {
    console.log(result.jws);
} else {
    console.log(result.signature, result.context.signedAt);
}
```

## 7. X.509 certificates

```ts
const {keyId} = key.getKmsReference();

// Self-signed certificate, attached to the key.
const chain = await kms.createCertificates(userspace.id, keyId, "self-signed", {
    subject: "CN=My key, O=Acme",
    san: ["example.org"],
    validityDays: 365,
});

// Or: ask the key provider for one.
// await kms.createCertificates(userspace.id, keyId, "fetch");

// Or: produce a CSR, get it signed by your CA, then import the chain (PEM, leaf first).
const csr = await kms.createCsr(userspace.id, keyId, {subject: "CN=My key, O=Acme"});
await kms.importCertificates(userspace.id, keyId, [/* leaf PEM, intermediates… */]);

const attached = await kms.getCertificates(userspace.id, keyId);
```

## 8. Error handling

Non-2xx answers throw a `KmsError` carrying the HTTP status and the parsed body.

```ts
import {KmsError} from "@cmts-dev/carmentis-sdk-core";

try {
    await kms.createCsr(userspace.id, keyId, {subject: "CN=x"});
} catch (e) {
    if (e instanceof KmsError && e.isUnsupported()) {
        console.warn("The key's plugin does not implement this method (HTTP 501)");
    } else {
        throw e;
    }
}
```

## 9. Cleanup

```ts
await kms.deleteKey(userspace.id, keyId); // destroys the private key or the access configuration
```
