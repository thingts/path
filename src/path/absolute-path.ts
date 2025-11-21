import type { AbsolutePathOps, JoinableBasic } from '../core'
import { PathBase } from './path-base'
import { RelativePath } from './relative-path'
import { pth } from '../tools'

type TRelative = RelativePath
type TJoinable = RelativePath
type TResolveable = AbsolutePath

/**
 * Represents an absolute filesystem path (i.e. a path starting at the root, i.e.
 * has a leading separator), and provides methods for path resolution,
 * manipulation and queries.
 *
 * {@link AbsolutePath} instances are normalized and immutable.
 *
 * {@link AbsolutePath} has the same functionality as {@link RelativePath} but
 * with additional methods that are only valid for absolute paths: {@link
 * resolve}, {@link relativeTo}, and {@link descendsFrom}.
 *
 * Note that {@link AbsolutePath} provides pure path manipulation, it does
 * not access the filesystem in any way.  (If you want to work with the
 * filesystem, you can use the
 * [`@thingts/fs-path`](https://npm.com/package/@thingts/fs-path) library which
 * extends {@link AbsolutePath} with filestem operations.)
 *
 * @example
 * ```ts
 * const p1 = new AbsolutePath('/project/demos')
 * const p2 = p1.join('demo1/src', 'index.ts') // '/project/demos/demo1/src/index.ts'
 * console.log(p2.descendsFrom(p1)) // true
 * console.log(p2.relativeTo(p1)) // 'demo1/src/index.ts' (RelativePath)
 * ```
 *
 */
export class AbsolutePath extends PathBase<TJoinable> implements AbsolutePathOps<TRelative, TResolveable, TJoinable> {

  /**
   * Create a new {@link AbsolutePath} from a string or another {@link AbsolutePath}.
   *
   * The path is normalized and guaranteed to be absolute. Any trailing
   * separator is removed.
   *
   * Throws an error if the provided path is not absolute.
   *
   * @example
   * ```ts
   * new AbsolutePath('/project/demos') // OK
   * new AbsolutePath('project/demos')  // Throws Error
   * new AbsolutePath('/project//src/../demos/') // normalized => /project/demos
   * ```
   */
  constructor(path: string | AbsolutePath) {
    path = String(path)
    if (!AbsolutePath.isAbsolutePathString(path)) {
      throw new Error(`Path must be absolute: "${path}"`)
    }
    super(pth.resolve(path))
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  //  --- Path manipulation methods ---
  //
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Resolve additional path arguments against this absolute path.
   *
   * Accepts strings, {@link Filename}, {@link RelativePath}, or {@link AbsolutePath} objects.
   * Null and undefined segments are ignored.
   *
   * Similar to join, except that if any argument is an {@link AbsolutePath} or string
   * starting with a path separator, the current path is discarded and
   * resolution starts from that segment.
   *
   * @returns A new {@link AbsolutePath} with the resolved path.
   *
   * @example
   * ```ts
   * const p1 = new AbsolutePath('/project/demos')
   * const p2 = p1.resolve('demo1/src', 'index.ts') // '/project/demos/demo1/src/index.ts'
   * const p3 = p1.resolve('/etc/config') // '/etc/config' (resets to absolute path)
   * ```
   */
  resolve(...args: readonly (JoinableBasic | TJoinable | TResolveable)[]): this {
    return this.cloneWithPath(pth.resolve(this.path_, ...args.filter(Boolean).map(String)))
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  //  --- Path query methods ---
  //
  /////////////////////////////////////////////////////////////////////////////
 
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
  relativeTo(base: AbsolutePath): RelativePath {
    return new RelativePath(pth.relative(base.path_, this.path_))
  }

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
  descendsFrom(ancestor: AbsolutePath | string, opts?: { includeSelf?: boolean }): boolean {
    return pth.descendsFrom(pth.resolve(String(ancestor)), this.path_, opts)
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  //  --- Static helpers ---
  //
  /////////////////////////////////////////////////////////////////////////////
  

   /**
   * Checks whether a string is an absolute path.  (I.e., if it would be
   * acceptable to the {@link AbsolutePath} constructor.)
   *
   * @param filepath - The string to check.
   * @returns True if the string is an absolute path, otherwise false.
   */
  static isAbsolutePathString(filepath: string): boolean {
    return pth.isAbsolute(filepath)
  }

}
