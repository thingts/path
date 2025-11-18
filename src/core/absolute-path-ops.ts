import type { Filename } from '../filename'
import type { PathOps } from './path-ops'

export interface AbsolutePathOps<TRelative extends PathOps, TResolvable = never, TJoinable = never> extends PathOps<TJoinable> {
  /**
   * Resolve additional paths or components against this absolute path.
   *
   * Similar to join, except that if any argument is absoulte, the current
   * path is discarded and resolution starts from that argument.
   *
   * @returns A new absolute path instance representing the resolved path.
   *
   * @example
   * ```ts
   * const base = new AbsolutePath('/project/demo')
   * const resolved = base.resolve('demo1/src', 'index.js') // '/project/demo/demo1/src/index.js'
   * resolved instanceof AbsolutePath // true
   * ```
   */
  resolve(...args: readonly (string | Filename | null | undefined | TJoinable | TResolvable)[]): this

  /**
   * Compute the relative path from the given base path to this path.
   *
   * @param base - The base absolute path.
   * @returns A {@link RelativePath} that goes from `base` to `this`.
   *
   * @example
   * ```ts
   * const p1 = new AbsolutePath('/project/demo')
   * const p2 = new AbsolutePath('/project/demo/src/index.ts')
   * const rel = p2.relativeTo(p1) // 'src/index.ts' (RelativePath)
   * p1.join(rel).equals(p2)       // true
   * ```
   */
  relativeTo(base: this): TRelative

  /**
   * Test whether this path is a descendant of the given ancestor path.
   *
   * @param ancestor - An `AbsolutePath` or string to check against.
   * @param opts.includeSelf - If true, return true when the paths are identical.
   * @returns True if this path descends from the ancestor, otherwise false.
   *
   * @example
   * ```ts
   * const p1 = new AbsolutePath('/project/demo')
   * const p2 = new AbsolutePath('/project/demo/src/index.ts')
   * console.log(p2.descendsFrom(p1)) // true
   * console.log(p1.descendsFrom(p1)) // false
   * console.log(p1.descendsFrom(p1, { includeSelf: true })) // true
   * ```
   */
  descendsFrom(ancestor: this | string, opts?: { includeSelf?: boolean }): boolean
}
