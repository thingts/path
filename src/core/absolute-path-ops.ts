import type { Filename } from '../filename'
import type { PathOps } from './path-ops'

export interface AbsolutePathOps<TRelative extends PathOps, TResolvable = never, TJoinable = never> {
  /**
   * Resolve additional paths or components against this absolute path.
   *
   * Similar to {@link join}, except that if any argument is absolute, the current
   * path is discarded and resolution starts from that argument.
   *
   * @returns A new instance of this type, representing the resolved path.
   */
  resolve(...args: readonly (string | Filename | null | undefined | TJoinable | TResolvable)[]): this

  /**
   * Compute the relative path from the given base path to this path.
   *
   * @param base - The base absolute path.
   * @returns A relative path that goes from `base` to `this`.
   *
   * @example
   * ```ts
   * const p1 = new AbsolutePath('/project')
   * const p2 = new AbsolutePath('/project/src/index.ts')
   * const rel = p2.relativeTo(p1) // → RelativePath('src/index.ts')
   * p1.join(rel).equals(p2)       // → true
   * ```
   */
  relativeTo(base: this): TRelative

  /**
   * Test whether this path is a descendant of the given ancestor path.
   *
   * @param ancestor - An absolute path or string to check against.
   * @param opts.includeSelf - If true, return true when the paths are identical.
   * @returns True if this path descends from the ancestor, otherwise false.
   *
   * @example
   * ```ts
   * const p1 = new AbsolutePath('/project')
   * const p2 = new AbsolutePath('/project/src/index.ts')
   * p2.descendsFrom(p1)                        // → true
   * p1.descendsFrom(p1)                        // → false
   * p1.descendsFrom(p1, { includeSelf: true }) // → true
   * ```
   */
  descendsFrom(ancestor: this | string, opts?: { includeSelf?: boolean }): boolean
}
