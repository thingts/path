import { pth } from '../tools'
import { PathBase } from './path-base'

/**
 * @expand
 */
type Joinable = RelativePath

/**
 * Represents a relative path (i.e. a path that doesn't start at the root,
 * i.e. doesn't have a leading separator), and provides methods for path
 * manipulation and queries.
 *
 * {@link RelativePath} is similar to {@link AbsolutePath} but
 * lacks methods that are only valid for absolute paths.
 *
 * @example
 * ```ts
 * const p1 = new Relative('demos')
 * const p2 = p1.join('demo1/src', 'index.ts') // 'demos/demo1/src/index.ts'
 * ```
 *
 */
export class RelativePath extends PathBase<Joinable> {

  /**
   * Create a new {@link RelativePath} from a string or another {@link RelativePath}.
   *
   * The path is normalized and guaranteed to be relative. Any trailing
   * separator is removed.
   *
   * @throws Throws an error if the provided path is absolute
   *
   * @example
   * ```ts
   * new RelativePath('project/demos')
   * new RelativePath('/project/demos')         // ❌ Throws error: path must be relative
   * new RelativePath('project//src/../demos/') // → AbsolutePath('project/demos')
   * ```
   */
  constructor(relpath: string | RelativePath) {
    relpath = String(relpath)
    if (!RelativePath.isRelativePathString(relpath)) {
      throw new Error(`Path must be relative, not absolute: "${relpath}"`)
    }
    super(relpath)
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  //  --- Static helpers ---
  //
  /////////////////////////////////////////////////////////////////////////////

   /**
   * Checks whether a string is a relative path.  (I.e., if it would be
   * acceptable to the {@link RelativePath} constructor.)
   *
   * @param filepath - The string to check.
   * @returns `true` if the string is an absolute path, otherwise false.
   */
  static isRelativePathString(filepath: string): boolean {
    return !pth.isAbsolute(filepath)
  }

}
