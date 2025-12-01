import type { Filename } from '../filename'
import type { FilenameOps } from './filename-ops'

/**
 * @inline
 */
export type JoinableBasic = string | Filename | null | undefined

/**
 * Operations available on path-like objects.
 */
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
   * new AbsolutePath('/a/b/c.txt').filename // Filename('c.txt')
   * new RelativePath('a/b/c.txt').filename  // Filename('c.txt')
   * ```
   */
  filename: Filename | undefined

  /**
   * The parent directory of this path.
   *
   * @returns A new instance pointing to the parent.
   * @example
   * ```ts
   * new AbsolutePath('/a/b/c.txt').parent // AbsolutePath('/a/b')
   * new RelativePath('a/b/c.txt').parent  // RelativePath('a/b')
   * ```
   */
  parent: this

  /**
   * The segments of this path as an array of strings.
   * @example
   *
   * ```ts
   * new AbsolutePath('/a/b/c.txt').segments // ['a', 'b', 'c.txt']
   * new RelativePath('a/b/c.txt').segments  // ['a', 'b', 'c.txt']
   * ```
   */
  segments: string[]

  /////////////////////////////////////////////////////////////////////////////
  //
  // --- Path manipulation methods ---
  //
  /////////////////////////////////////////////////////////////////////////////


  /**
   * Join additional path segments to this path.
   *
   * Accepts relative path objects and {@link Filename} segment arguments
   * for type safety, but you can also directly pass strings for
   * convenience.   All args are stringified and interpreted as segments to
   * be joined, regardless of whether they start with a path separator.
   *
   * Any `null`, `undefined`, or empty segments are ignored.
   *
   * @returns A new instance with the segments appended and resulting path normalized.
   *
   * @example
   * ```ts
   * const a1 = new AbsolutePath('/project/demo')
   * const a2 = a1.join('demo1/src', 'index.js') // → AbsolutePath('/project/demo/demo1/src/index.js')
   *
   * const r1 = new RelativePath('demo')
   * const r2 = r1.join('demo1/src', 'index.js') // → RelativePath('demo/demo1/src/index.js')
   * ```
   */
  join(...segments: readonly (JoinableBasic | TJoinable)[]): this 

  /**
   * Replace the filename (last segment).
   *
   * @returns A new instance with the filename replaced.
   *
   * @example
   * ```ts
   * new AbsolutePath('/a/b/c.txt').replaceFilename('d.json') // → AbsolutePath('/a/b/d.json')
   * new RelativePath('a/b/c.txt').replaceFilename('d.json')  // → RelativePath('a/b/d.json')
   * ```
   */
  replaceFilename(newFilename: string | Filename): this

 /**
   * {@inheritDoc <internal>!FilenameOps#replaceStem}
   *
   * @example
   * ```ts
   * new AbsolutePath('/a/b/c.txt').replaceStem('d') // → AbsolutePath('/a/b/d.txt')
   * new RelativePath('a/b/c.txt').replaceStem('d')  // → RelativePath('a/b/d.txt')
   * ```
   */
  replaceStem(newStem: string): this 

  /**
   * {@inheritDoc <internal>!FilenameOps#replaceExtension}
   *
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
   * @returns A new instance with the transformed filename.
   * @example
   * ```ts
   * p.transformFilename(f => String(f).toUpperCase())
   * ```
   */
  transformFilename(fn: (filename: Filename) => string | Filename): this

  /**
   * Replace the entire directory path through the parent, while keeping the current filename.
   *
   * @param newParent - Parent directory as string or another path
   * @returns A new path rooted at `newParent` with the same filename.
   * @example
   * ```ts
   * new AbsolutePath('/old/file.txt').replaceParent('/new/dir') // '/new/dir/file.txt' (AbsolutePath)
   * new RelativePath('old/file.txt').replaceParent('new/dir')   // 'new/dir/file.txt' (RelativePath)
   * ```
   */
  replaceParent(newParent: string | this): this

  /**
   * @returns Returns the string representation of this path.
   */
  toString(): string
}
