/**
 * HCVDecoded class represents the result of decoding an HCV string.
 * It provides methods to access the keys and value, and to check if a given key sequence matches.
 */
export class HCVDecoded {
  private readonly keys: string[];
  private readonly value: string;

  /**
   * Creates a new HCVDecoded instance.
   * @param keys - The list of keys from the decoded string
   * @param value - The value from the decoded string
   */
  constructor(keys: string[], value: string) {
    this.keys = keys;
    this.value = value;
  }

  /**
   * Checks if the given keys match the keys in this decoded object.
   * @param keys - The keys to check against
   * @returns True if the keys match, false otherwise
   */
  public matchesKeys(...keys: string[]): boolean {
    if (keys.length !== this.keys.length) {
      return false;
    }

    return keys.every((key, index) => key === this.keys[index]);
  }

  /**
   * Gets the list of keys from the decoded string.
   * @returns The list of keys
   */
  public getKeys(): string[] {
    return [...this.keys];
  }

  /**
   * Gets the value from the decoded string.
   * @returns The value
   */
  public getValue(): string {
    return this.value;
  }
}

/**
 * HCVCodec (Hierarchical Context Value Codec) provides methods to encode and decode
 * strings in the format key1:key2:...:keyn{value}.
 */
export class HCVCodec {
  /**
   * Encodes a list of keys and a value into a string in the format key1:key2:...:keyn{value}.
   * The last parameter is treated as the value, and all preceding parameters are treated as keys.
   * @param args - The keys followed by the value (at least one key and one value)
   * @returns The encoded string
   * @throws Error if fewer than 2 arguments are provided
   */
  public static encode(...args: string[]): string {
    if (args.length < 2) {
      throw new Error('At least one key and one value must be provided');
    }

    const keys = args.slice(0, -1);
    const value = args[args.length - 1];

    return `${keys.join(':')}${value ? `{${value}}` : '{}'}`;
  }

  /**
   * Decodes a string in the format key1:key2:...:keyn{value} into an HCVDecoded object.
   * @param encoded - The encoded string to decode
   * @returns An HCVDecoded object containing the keys and value
   * @throws Error if the encoded string is not in the correct format
   */
  public static decode(encoded: string): HCVDecoded {
    const match = encoded.match(/^(.*?)(?:\{(.*)\})?$/);
    
    if (!match) {
      throw new Error('Invalid encoded string format');
    }

    const keysString = match[1];
    const value = match[2] || '';
    
    // Handle the case where there are no keys (empty string before the curly braces)
    const keys = keysString ? keysString.split(':') : [];
    
    return new HCVDecoded(keys, value);
  }
}