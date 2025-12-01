import type { FilenameOps } from '../core'
import { fnt } from '../tools'

/**
 * Represents a filename (without any path components), and provides methods
 * to query and manipulate it.
 *
 * The class is immutable; all methods that modify the filename return a
 * new instance.
 *
 * The constructor ensures that the filename does not contain any directory
 * separators. If it does, an error is thrown.
 *
 * @example
 * ```ts
 * const file = new Filename('example.txt')
 * console.log(file.stem) // 'example'
 * ```
 */

export class Filename implements FilenameOps {
  #filename: string

  /**
   * Create a {@link Filename} instance from a string or another {@link Filename}
   *
   * Throws an error if the provided name contains path separators
   *
   * @example
   * ```ts
   * new Filename('index.ts') // OK
   * new Filename('demo/index.ts') // ❌ Throws error
   * ```
   */
  constructor(filename: string | Filename) {
    filename = String(filename)
    if (!Filename.#isFilenameString(filename)) {
      throw new Error(`Filename must not contain path components: "${filename}"`)
    }
    this.#filename = filename
  }

  /////////////////////////////////////////////////////////////////////////////
  // --- FilenameOps interface implementations ---
  /////////////////////////////////////////////////////////////////////////////

  get extension(): string { return fnt.extname(this.#filename) }
  get stem(): string      { return fnt.basename(this.#filename, this.extension) }

  replaceStem(newStem: string): this     { return new Filename(newStem + this.extension) as this }
  replaceExtension(newExt: string): this { return new Filename(this.stem + fnt.ensureLeadingDot(newExt)) as this }

  /////////////////////////////////////////////////////////////////////////////
  //
  // --- Filename manipulaion methods ---
  //
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Creates a new {@link Filename} by calling a callback function with the
   * old filename as a string, and using the returned string as the new
   * filename
   *
   * @returns A new {@link Filename} instance
   */
  transform(fn: (filename: string) => string): Filename {
    return new Filename(fn(this.#filename))
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // --- Static helpers ---
  //
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Returns true if the provided string is a valid filename (i.e. does not
   * contain any path separators)
   */
  static #isFilenameString(filename: string): boolean {
    return filename === fnt.basename(filename)
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // Utilities
  //
  /////////////////////////////////////////////////////////////////////////////

  toString(): string                             { return this.#filename }
  equals(other: string | Filename): boolean      { return this.#filename === String(other) }
}
