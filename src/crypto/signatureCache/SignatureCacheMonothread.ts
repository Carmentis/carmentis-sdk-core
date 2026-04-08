import {SignatureCacheEntry} from './SignatureCacheEntry';
import {SignatureCacheInterface} from './SignatureCacheInterface';

export class SignatureCacheMonothread implements SignatureCacheInterface {
    private map: Map<string, boolean>;

    constructor() {
        this.map = new Map;
    }

    async has(entry: SignatureCacheEntry) {
        return this.map.has(entry.getKey());
    }

    async get(entry: SignatureCacheEntry) {
        return this.map.get(entry.getKey());
    }

    async set(entry: SignatureCacheEntry, result: boolean) {
        this.map.set(entry.getKey(), result);
    }
}
