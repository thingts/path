import type { Filename } from '../filename'
import type { FilenameOps } from './filename-ops'

export type JoinableBasic = string | Filename | null | undefined

export interface PathOps<TJoinable = never> extends FilenameOps {

  /////////////////////////////////////////////////////////////////////////////
  //
  //  --- Getters for path properties ---
  //
  /////////////////////////////////////////////////////////////////////////////

  /**
   * The filename component (last path segment) as a {@link Filename}.
   *
   * @example
   * ```ts
   * new AbsolutePath('/a/b/c.txt').filename // 'c.txt' (Filename)
   * new RelativePath('a/b/c.txt').filename  // 'c.txt' (Filename)
   * ```
   */
  get filename(): Filename | undefined

  /**
   * The parent directory of this path.
   *
   * @returns A new path instance pointing to the parent.
   * @example
   * ```ts
   * new AbsolutePath('/a/b/c.txt').parent // '/a/b' (AbsolutePath)
   * new RelativePath('a/b/c.txt').parent  // 'a/b' (RelativePath)
   * ```
   */
  get parent(): this

  /**
   * The segments of this path as an array of strings.
   * @example
   * ```ts
   * new AbsolutePath('/a/b/c.txt').segments // ['a', 'b', 'c.txt']
   * new RelativePath('a/b/c.txt').segments  // ['a', 'b', 'c.txt']
   * ```
   */
  get segments(): string[]

  /////////////////////////////////////////////////////////////////////////////
  //
  // --- Path manipulation methods ---
  //
  /////////////////////////////////////////////////////////////////////////////


  /**
   * Join additional path segments to this path.
   *
   * Accepts strings, filenames, or path objects; `null` and `undefined` are accepted and ignored.
   *
   * @returns A new path instance with the segments appended
   *
   * @example
   * ```ts
   * const a1 = new AbsolutePath('/project/demo')
   * const a2 = a1.join('demo1/src', 'index.js') // '/project/demo/demo1/src/index.js'
   * a2 instanceof AbsolutePath // true
   *
   * const r1 = new RelativePath('demo')
   * const r2 = r1.join('demo1/src', 'index.js') // 'demo/demo1/src/index.js'
   * r2 instanceof RelativePath // true
   * ```
   */
  join(...segments: readonly (JoinableBasic | TJoinable)[]): this 

  /**
   * Replace the filename (last segment).
   *
   * @returns A new path with the filename replaced.
   */
  replaceFilename(newFilename: string | Filename): this

 /**
   * Replace the filename stem, keeping the extension the same
   *
   * @param newStem - New stem to use (extension is preserved).
   * @returns A new path with the stem replaced.
   * @example
   * ```ts
   * new AbsolutePath('/a/b/c.txt').replaceStem('d') // '/a/b/d.txt' (AbsolutePath)
   * new RelativePath('a/b/c.txt').replaceStem('d')  // 'a/b/d.txt' (RelativePath)
   * ```
   */
  replaceStem(newStem: string): this 

  /**
   * Replace the filename extension, keeping the stem the same.  The passed
   * can include or omit the leading dot; if omitted, it will be added.
   *
   * @param newExt - New extension, e.g. `json` or `.json`
   * @returns A new path with the extension replaced.
   * @example
   * ```ts
   * new AbsolutePath('/a/b/c.txt').replaceExtension('json') // '/a/b/c.json' (AbsolutePath)
   * new RelativePath('a/b/c.txt').replaceExtension('.json') // '/a/b/c.json' (RelativePath)
   * ```
   */
  replaceExtension(newExt: string): this

  /**
   * Transform the filename via a callback.
   *
   * @param fn - Receives the current {@link Filename}, returns a new filename
   *             (string or {@link Filename}).
   * @returns A new path with the transformed filename.
   * @example
   * ```ts
   * p.transformFilename(f => String(f).toUpperCase())
   * ```
   */
  transformFilename(fn: (filename: Filename) => string | Filename): this

  /**
   * Replace the parent directory while keeping the current filename.
   *
   * @param newParent - Parent directory as string or another `PathBase`.
   * @returns A new path rooted at `newParent` with the same filename.
   * @example
   * ```ts
   * new AbsolutePath('/old/file.txt').replaceParent('/new/dir') // '/new/dir/file.txt' (AbsolutePath)
   * new RelativePath('old/file.txt').replaceParent('new/dir')   // 'new/dir/file.txt' (RelativePath)
   * ```
   */
  replaceParent(newParent: string | this): this

}
