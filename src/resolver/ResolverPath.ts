import { JsonData, JsonObject } from '../type/valibot/json/Json';

type Path = (string | number)[]

export class ResolverPath {
    private readonly path: Path;

    constructor(path: Path = []) {
        this.path = path;
    }

    static fromSerialized(str: string) {
        return new ResolverPath(JSON.parse(str));
    }

    static clone(path: ResolverPath) {
        return new ResolverPath([...path.path]);
    }

    serialize(from?: number, to?: number) {
        return JSON.stringify(this.path.slice(from, to));
    }

    getPath() {
        return this.path;
    }

    length() {
        return this.path.length;
    }

    isSubPath(subPath: ResolverPath) {
        return subPath.path.every((part, ndx) => part === this.path[ndx]);
    }

    isEqual(subPath: ResolverPath) {
        return this.length() == subPath.length() && this.isSubPath(subPath);
    }

    append(key: string | number) {
        this.path.push(key);
        return this;
    }

    join(relativePath: Path) {
        for (const item of relativePath) {
            switch (item) {
                case ".": {
                    break;
                }
                case "..": {
                    if (this.path.length === 0) {
                        throw new Error(`encountered '..' at the root of the path`);
                    }
                    this.removeLast();
                    break;
                }
                default: {
                    this.append(item);
                    break;
                }
            }            
        }
        return this;
    }

    applyToData(root: JsonData): JsonData {
        let node = root;
        let path = "root";
        for (const item of this.path) {
            const isNumber = typeof item === 'number';
            if (node === null || typeof node !== 'object' || Array.isArray(node) !== isNumber) {
                throw new Error(`property ${JSON.stringify(item)} cannot be applied to '${path}'`);
            }
            node = (node as any)[item];
            if (node === undefined) {
                throw new Error(`property ${JSON.stringify(item)} of '${path}' not found`);
            }
            path += isNumber ? `[${item}]` : '.' + item;
        }
        return node;
    }

    removeLast() {
        this.path.pop();
        return this;
    }

    toString() {
        return this.path.map((key, ndx) =>
            typeof key == 'number' ? `[${key}]` : (ndx > 0 ? '.' : '') + key
        ).join("");
    }
}
