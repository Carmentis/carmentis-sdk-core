export class Optional<T> {
    private constructor(private value: T | null) {
    }

    static of<T>(value: T | null): Optional<T> {
        return new Optional(value);
    }

    static some<T>(value: T): Optional<T> {
        return new Optional(value);
    }

    static none<T>(): Optional<T> {
        return new Optional<T>(null);
    }

    map<U>(fn: (value: T) => U): Optional<U> {
        if (this.value === null) {
            return Optional.none<U>();
        }
        return Optional.some(fn(this.value));
    }

    unwrap(): T {
        if (this.value === null) {
            throw new Error("Called unwrap on a None value");
        }
        return this.value;
    }

    unwrapOrThrow(error: Error) {
        if (this.value === null) {
            throw error;
        }
        return this.value;
    }

    unwrapOr(defaultValue: T): T {
        return this.value === null ? defaultValue : this.value;
    }

    isSome(): boolean {
        return this.value !== null;
    }

    isNone(): boolean {
        return this.value === null;
    }
}