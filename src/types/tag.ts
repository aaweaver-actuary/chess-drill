/**
 * Represents a key-value pair tag used for annotating or categorizing entities.
 *
 * @remarks
 * The `Tag` class encapsulates a string key and value, which can be used to
 * store metadata or labels in various contexts, such as chess games or drills.
 *
 * @example
 * ```typescript
 * const tag = new Tag('Opening', 'Sicilian Defense');
 * ```
 *
 * @public
 */
export class Tag {
  private key: string;
  private value: string;

  constructor(key: string, value: string) {
    this.key = key;
    this.value = value;
  }

  /**
   * Retrieves the key of the tag.
   *
   * @returns The key of the tag.
   */
  public getKey(): string {
    return this.key;
  }

  /**
   * Retrieves the value of the tag.
   *
   * @returns The value of the tag.
   */
  public getValue(): string {
    return this.value;
  }

  /**
   * Converts the tag to a string representation.
   *
   * @returns A string in the format "key: value".
   */
  public toString(): string {
    return `${this.key}: ${this.value}`;
  }


}
