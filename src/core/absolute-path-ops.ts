import type { Filename } from '../filename'
import type { PathOps } from './path-ops'

export interface AbsolutePathOps<TResolvable = never, TJoinable = never> extends PathOps<TJoinable> {
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
}
