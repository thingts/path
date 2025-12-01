/**
 * Interface defining operations on objects that have filenames
 */
export interface FilenameOps {

  /**
   * Returns the extension of the filename including the leading dot, as a
   * string.  If the filename has no extension, returns an empty string.
   * 
   * Note that if the filename starts with a dot (e.g. `.gitignore`),
   * that dot is considered part of the stem.  So `.gitignore` has
   * extension `''` and `.gitignore.bak` has extension `.bak`
   */
  extension: string | undefined

  /**
   * Returns the stem of the filename, i.e. the part before the extension.
   * If the filename has no extension, returns the entire filename
   * 
   * Note that if the filename starts with a dot (e.g. `.gitignore`),
   * that dot is considered part of the stem.  So `.gitignore` and
   * `.gitignore.bak` both have stem `.gitignore`
   */

  stem: string  | undefined

  /**
   * Replace the filename stem, keeping the extension the same
   *
   * @returns A new instance with the filename stem replaced.
   *
   * @example
   * ```ts
   * new Filename('index.ts').replaceStem('main') // → Filename('main.ts')
   * ```
   */
  replaceStem(newStem: string): this

  /**
   * Replace the filename extension, keeping the stem the same.  The passed
   * string can include or omit the leading dot; if omitted, it will be added.
   *
   * @param newExt - New extension, e.g. `json` or `.json`
   *
   * @returns A new instance with the filename extension replaced.
   *
   * @example
   * ```ts
   * new Filename('file.txt').replaceExtension('json') // → Filename('file.json')
   * ```
   */
  replaceExtension(newExt: string): this

  /** Returns the filename as string. */
  toString(): string

  /** Returns true if this filename equals the other filename or filename string */
  equals(other: string | this): boolean
}
