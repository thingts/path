import type { AbsolutePathOps, JoinableBasic } from '../core'
import type { RelativePath } from '../path'
import type { RelativePathUrl } from './relative-path-url'
import type { RootPathUrl } from './root-path-url'
import type { UrlPathParts } from './url-types'
import { UrlBase } from './url-base'
import { urt } from '../tools'

type Joinable    = RelativePathUrl | RelativePath
type Resolveable = RootPathUrl | FullPathUrl

/**
 * Fully qualified URL with origin, pathname, query, and fragment.
 * Immutable, compositional, and consistent with PathBase.
 */
export class FullPathUrl extends UrlBase<Joinable> implements AbsolutePathOps<Resolveable, Joinable> {
  readonly origin_: string

  constructor(url: string | URL | FullPathUrl) {
    const u = (url instanceof URL) ? url : (url instanceof FullPathUrl) ? url.toURL() : urt.newURL(url)
    super(u.href.slice(u.origin.length))
    this.origin_ = u.origin
  }

  /////////////////////////////////////////////////////////////////////////////
  // --- Accessors ------------------------------------------------------------
  /////////////////////////////////////////////////////////////////////////////

  get origin(): string { return this.origin_ }
  get href(): string { return this.toString() }

  toURL(): URL {
    return new URL(this.toString())
  }

  /////////////////////////////////////////////////////////////////////////////
  // --- AbsolutePathOps implementation ---------------------------------------
  /////////////////////////////////////////////////////////////////////////////

  resolve(...args: readonly (JoinableBasic | Joinable | Resolveable)[]): this {
    const { origin, ...parts } = urt.joinOrResolve(this.pathParts, args.filter(Boolean).map(String), { mode: 'resolve', baseOrigin: this.origin_ })
    return this.cloneWithUrlString(`${origin}${urt.buildPath(parts)}`)
  }

  /////////////////////////////////////////////////////////////////////////////
  // --- Mutation-like (immutable) operations ---------------------------------
  /////////////////////////////////////////////////////////////////////////////

  replaceOrigin(origin: string | FullPathUrl): FullPathUrl {
    const o = origin instanceof FullPathUrl ? origin.origin_ : origin
    return new FullPathUrl(`${o}${this.toString().replace(/^[^/]+\/\/[^/]+/, '')}`)
  }


  /////////////////////////////////////////////////////////////////////////////
  // --- Static methods ---------------------------------
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Returns true if the given string is a valid full path (hierarchical) URL.
   *
   * @example
   *
   * ```
   * FullPathUrl.isFullPathUrlString('https://example.com/path/to/resource?query=param#fragment') // true
   * FullPathUrl.isFullPathUrlString('ftp://ftp.example.com/resource') // true
   * FullPathUrl.isFullPathUrlString('data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==') // false
   * FullPathUrl.isFullPathUrlString('/relative/path') // false
   * ```
   *
   */
  static isFullPathUrlString(s: string): boolean {
    return urt.isHierarchicalUrl(s)
  }

  /////////////////////////////////////////////////////////////////////////////
  // --- UrlBase Overrides ------------------------------------------------------------
  /////////////////////////////////////////////////////////////////////////////

  override toString(): string {
    return `${this.origin_}${super.toString()}`
  }

  protected override cloneWithParts(params: Partial<UrlPathParts>): this {
    const ctor = this.constructor as new(path: string) => this
    const path = this.nextPathString(params)
    return new ctor(`${this.origin_}${path}`)
  }

}
