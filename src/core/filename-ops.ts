export interface FilenameOps {

  /**
   * Returns the extension of the filename including the leading dot, as a
   * string.  If the filename has no extension, returns an empty string.
   * 
   * Note that if the filename starts with a dot (e.g. `.gitignore`),
   * that dot is considered part of the stem.  So `.gitignore` has
   * extension `''` and `.gitignore.bak` has extension `.bak`
   */
  get extension(): string

  /**
   * Returns the stem of the filename, i.e. the part before the extension.
   * If the filename has no extension, returns the entire filename
   * 
   * Note that if the filename starts with a dot (e.g. `.gitignore`),
   * that dot is considered part of the stem.  So `.gitignore` and
   * `.gitignore.bak` both have stem `.gitignore`
   */

  get stem(): string 

  /**
   * Replace the filename stem, keeping the extension the same
   *
   * @returns A new {@link Filename} instance
   *
   * @example
   * ```ts
   * new Filename('index.ts').replaceStem('main') // 'main.ts' (Filename)
   * ```
   */
  replaceStem(newStem: string): this

  /**
   * Replace the filename extensions, keeping the stem the same
   *
   * @returns A new {@link Filename} instance
   *
   * @example
   * ```ts
   * new Filename('index.ts').replaceExtension('.js') // 'index.js' (Filename)
   * ```
   */
  replaceExtension(newExt: string): this

  /** Returns the filename as string. */
  toString(): string

  /** Returns true if this filename equals the other filename or string */
  equals(other: string | this): boolean
}
