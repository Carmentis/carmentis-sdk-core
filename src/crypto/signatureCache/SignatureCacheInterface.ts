import {SignatureCacheEntry} from './SignatureCacheEntry';

export interface SignatureCacheInterface  {
    has(entry: SignatureCacheEntry): Promise<boolean>;
    get(entry: SignatureCacheEntry): Promise<boolean|undefined>;
    set(entry: SignatureCacheEntry, result: boolean): void;
}
