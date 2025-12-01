import type { AbsolutePathOps, JoinableBasic } from '../core'
import type { RelativePath } from '../path'
import { RelativePathUrl } from './relative-path-url'
import type { AbsolutePath } from '../path'
import type { UrlPathParts } from './url-types'
import { isUrlPathParts } from './url-types'
import { UrlBase } from './url-base'
import { pth, urt } from '../tools'

type TRelative    = RelativePathUrl
type TJoinable    = RelativePathUrl | RelativePath
type TResolveable = RootPathUrl


/**
 *
 * A rooted URL instance, i.e. with a pathname that starts with '/', but
 * without an origin.
 *
 * Analogous to {@link AbsolutePath}, but for URLs; i.e. it may have query
 * paramaters and a fragment, and has methods to work with them.
 *
 * To convert to a full URL with an origin, see {@link FullUrlPath#resolve}
 *
 * {@include ./doc-normalization.md}
 *
 * {@include ./doc-encoding.md}
 */
export class RootPathUrl extends UrlBase<TJoinable> implements AbsolutePathOps<TRelative, TResolveable, TJoinable> {
  constructor(url: string | RootPathUrl | AbsolutePath | UrlPathParts) {
    const parts = (url instanceof RootPathUrl) ? url.parts : isUrlPathParts(url) ? url : urt.parsePath(String(url))
    if (!urt.isRootPathUrlString(parts.pathname)) {
      throw new Error(`RootPathUrl must start with '/': ${parts.pathname}`)
    }
    super(parts)
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // --- AbsolutePathOps implementation ---------------------------------------
  //
  /////////////////////////////////////////////////////////////////////////////

  /**
   * {@include ./doc-resolve.md}
   * @example
   * ```ts
   * const url = new RootPathUrl('/project/src?x=1#frag')
   * url.resolve('lib/utils', '../index.ts', '?y=2', '#newfrag') // → RootPathUrl('/project/src/lib/index.ts?y=2#newfrag')
   * url.resolve('lib', '/other/path/file.txt&z=3')              // → RootPathUrl('/other/path/file.txt?z=3')
   * ```
   */
  resolve(...args: readonly (JoinableBasic | TJoinable | TResolveable | null | undefined)[]): this {
    const parts = urt.resolve(this.parts, args.filter(Boolean).map(String))
    return this.cloneWithParts(parts)
  }

  /**
   * {@inheritDoc <internal>!AbsolutePathOps#relativeTo}
   * @QueryAndFragment
   * The returned {@link RelativePathUrl } has the same query and fragment as `this`
   * @example
   * ```ts
   * const p1 = new RootPathUrl('/project')
   * const p2 = new RootPathUrl('/project/src/index.ts?q=1#frag')
   * const rel = p2.relativeTo(p1) // → RelativePathUrl('src/index.ts?q=1#frag')
   */
  relativeTo(base: this): TRelative {
    return new RelativePathUrl({ pathname: pth.relative(base.pathname, this.pathname) })
  }

  /**
   * {@inheritDoc <internal>!AbsolutePathOps#descendsFrom}
   * @QueryAndFragment
   * Query and fragment are ignored.
   *
   * @example
   * ```ts
   * const p1 = new RootPathUrl('/project')
   * const p2 = new RootPathUrl('/project/src/index.ts')
   * p2.descendsFrom(p1)                        // → true
   * p1.descendsFrom(p1)                        // → false
   * p1.descendsFrom(p1, { includeSelf: true }) // → true
   * ```
   */
  descendsFrom(ancestor: this | string, opts?: { includeSelf?: boolean }): boolean {
    const ancestorUrl = ancestor instanceof RootPathUrl ? ancestor : new RootPathUrl(ancestor)
    return pth.descendsFrom(ancestorUrl.pathname, this.pathname, opts)
  }
}
