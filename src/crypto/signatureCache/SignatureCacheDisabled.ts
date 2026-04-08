import {SignatureCacheEntry} from './SignatureCacheEntry';
import {SignatureCacheInterface} from './SignatureCacheInterface';

export class SignatureCacheDisabled implements SignatureCacheInterface {
    constructor() {
    }

    async has(entry: SignatureCacheEntry) {
        return false;
    }

    async get(entry: SignatureCacheEntry) {
        return false;
    }

    async set(entry: SignatureCacheEntry, result: boolean) {
    }
}
