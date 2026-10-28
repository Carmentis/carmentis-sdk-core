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
