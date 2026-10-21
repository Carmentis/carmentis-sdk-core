import { Utils } from '../src/utils/utils';
import { Base64 } from '../src/data/base64';
import { getPublicKey } from '@noble/secp256k1';

const SK = "bd37ab56d1a23e623ce59083fcc06fa9c4d66756fd92d75ce9059feafd49cc37";
console.log(privateEthKeyToJwk(SK));

export function privateEthKeyToJwk(privateKeyHex: string): JsonWebKey {
    const privateKey = Utils.binaryFromHexa(privateKeyHex.replace(/^0x/, ''));
    const publicKey = getPublicKey(privateKey, false);

    return {
        kty: 'EC',
        crv: 'secp256k1',
        d: Base64.encodeBinary(privateKey, Base64.URL),
        x: Base64.encodeBinary(publicKey.slice(1, 33), Base64.URL),
        y: Base64.encodeBinary(publicKey.slice(33, 65), Base64.URL),
    };
}
