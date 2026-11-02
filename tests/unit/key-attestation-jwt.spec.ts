import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { SignJWT, importPKCS8 } from 'jose';
import * as x509 from '@peculiar/x509';
import { CertificateTagHandler } from '../../src/tags/CertificateTagHandler';
import { TagProcessor } from '../../src/tags/TagProcessor';
import { ResolverPath } from '../../src/resolver/ResolverPath';
import { TAG } from '../../src/type/tags/tags';
import { Secp256k1PrivateSignatureKey } from '../../src/crypto/signature/secp256k1/Secp256k1PrivateSignatureKey';
import { DckfSignatureEncoder } from '../../src/crypto/encoder/signature/dckf/DckfSignatureEncoder';
import { EncoderFactory } from '../../src/utils/encoder';
import { MicroblockNode } from '../../src/type/valibot/resolutionNodes/ResolutionNodes';

async function makeAttester() {
    const keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const cert = await x509.X509CertificateGenerator.createSelfSigned({
        serialNumber: '01',
        name: 'CN=Attester',
        notBefore: new Date(Date.now() - 3600_000),
        notAfter: new Date(Date.now() + 3600_000),
        signingAlgorithm: { name: 'ECDSA', hash: 'SHA-256' },
        keys,
    });
    const pkcs8 = Buffer.from(await crypto.subtle.exportKey('pkcs8', keys.privateKey)).toString('base64');
    const privateKey = await importPKCS8(`-----BEGIN PRIVATE KEY-----\n${pkcs8}\n-----END PRIVATE KEY-----`, 'ES256');
    const x5c = [Buffer.from(cert.rawData).toString('base64')];
    return { privateKey, x5c };
}

async function carmentisKey() {
    const pub = await Secp256k1PrivateSignatureKey.gen().getPublicKey();
    const hex = EncoderFactory.defaultBytesToStringEncoder().encode(await pub.getPublicKeyAsBytes());
    const dckf = await new DckfSignatureEncoder().encodePublicKey(pub);
    return { hex, dckf };
}

async function sign(attester: Awaited<ReturnType<typeof makeAttester>>, sub: string, exp = '1h') {
    return new SignJWT({}).setProtectedHeader({ alg: 'ES256', x5c: attester.x5c })
        .setSubject(sub).setIssuedAt().setExpirationTime(exp).sign(attester.privateKey);
}

function makeContext(publicKey?: string) {
    const processor = new TagProcessor({} as any, {} as any, {} as any);
    const node: MicroblockNode = { type: 'microblock', hash: '', publicKey: publicKey ?? '', vbId: '', height: 1, found: true };
    if (publicKey !== undefined) {
        processor.mapNode({ node, output: { content: {} } }, new ResolverPath(['mb']));
    }
    return processor;
}

const certPath = new ResolverPath(['mb', 'content', 'cert', TAG.CERTIFICATE]);

describe('KEY_ATTESTATION_JWT', () => {
    const handler = new CertificateTagHandler({} as any, {} as any, {} as any);

    it('is valid when signed by the attester and bound to the microblock signer', async () => {
        const attester = await makeAttester();
        const key = await carmentisKey();
        const jwt = await sign(attester, key.hex);
        const processor = makeContext(key.dckf);
        const res = await handler.handle(TAG.CERTIFICATE, { type: 'KEY_ATTESTATION_JWT', jwt } as any, certPath, processor);
        expect(res.node).toEqual({ type: 'certificate', valid: true });
        expect((res.output as any).keyAttestation.subject).toBe(key.hex);
        expect((res.output as any).keyAttestation.x509Chain).toHaveLength(1);
    });

    it('is invalid when the subject is another key', async () => {
        const attester = await makeAttester();
        const key = await carmentisKey();
        const other = await carmentisKey();
        const jwt = await sign(attester, other.hex);
        const res = await handler.handle(TAG.CERTIFICATE, { type: 'KEY_ATTESTATION_JWT', jwt } as any, certPath, makeContext(key.dckf));
        expect(res.node).toEqual({ type: 'certificate', valid: false });
        expect((res.output as any).keyAttestation.signatureValid).toBe(true);
        expect((res.output as any).keyAttestation.boundToSigner).toBe(false);
    });

    it('is invalid when there is no enclosing microblock', async () => {
        const attester = await makeAttester();
        const key = await carmentisKey();
        const jwt = await sign(attester, key.hex);
        const res = await handler.handle(TAG.CERTIFICATE, { type: 'KEY_ATTESTATION_JWT', jwt } as any, certPath, makeContext());
        expect(res.node).toEqual({ type: 'certificate', valid: false });
    });

    it('is invalid when the signature is tampered', async () => {
        const attester = await makeAttester();
        const key = await carmentisKey();
        const other = await carmentisKey();
        const [h, , s] = (await sign(attester, key.hex)).split('.');
        const forged = Buffer.from(JSON.stringify({ sub: other.hex })).toString('base64url');
        const res = await handler.handle(TAG.CERTIFICATE, { type: 'KEY_ATTESTATION_JWT', jwt: `${h}.${forged}.${s}` } as any, certPath, makeContext(key.dckf));
        expect((res.output as any).keyAttestation.signatureValid).toBe(false);
        expect((res.node as any).valid).toBe(false);
    });

    it('is invalid when expired', async () => {
        const attester = await makeAttester();
        const key = await carmentisKey();
        const jwt = await new SignJWT({}).setProtectedHeader({ alg: 'ES256', x5c: attester.x5c })
            .setSubject(key.hex).setIssuedAt(1000).setExpirationTime(2000).sign(attester.privateKey);
        const res = await handler.handle(TAG.CERTIFICATE, { type: 'KEY_ATTESTATION_JWT', jwt } as any, certPath, makeContext(key.dckf));
        expect((res.node as any).valid).toBe(false);
    });

    it('rejects a JWT without x5c', async () => {
        const attester = await makeAttester();
        const jwt = await new SignJWT({}).setProtectedHeader({ alg: 'ES256' }).setSubject('aa').sign(attester.privateKey);
        await expect(handler.handle(TAG.CERTIFICATE, { type: 'KEY_ATTESTATION_JWT', jwt } as any, certPath, makeContext()))
            .rejects.toThrow('x5c');
    });
});

describe('TagProcessor.getEnclosingNode', () => {
    it('returns the closest microblock or section node', () => {
        const processor = new TagProcessor({} as any, {} as any, {} as any);
        const outer: MicroblockNode = { type: 'microblock', hash: 'outer', publicKey: 'a', vbId: '', height: 1, found: true };
        const inner = { type: 'section', microblockHash: 'inner', publicKey: 'b', vbId: '', height: 1, index: 0, found: true } as const;
        processor.mapNode({ node: outer, output: { a: {} } }, new ResolverPath([]));
        processor.mapNode({ node: inner, output: { b: {} } }, new ResolverPath(['a']));

        expect(processor.getEnclosingNode(new ResolverPath(['a', 'b', 'c', TAG.CERTIFICATE]))).toBe(inner);
        expect(processor.getEnclosingNode(new ResolverPath(['a', 'x', TAG.CERTIFICATE]))).toBe(outer);
        expect(processor.getEnclosingNode(new ResolverPath(['z', TAG.CERTIFICATE]))).toBeUndefined();
    });
});
