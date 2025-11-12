import * as urt from './url-tools'
import type { RelativeUrlPath } from './relative-url-path'
import type { RootUrlPath } from './root-url-path'
import type { UrlPathParts } from './url-types'
import { UrlBase } from './url-base'

/**
 * Fully qualified URL with origin, pathname, query, and anchor.
 * Immutable, compositional, and consistent with PathBase.
 */
export class HostUrlPath extends UrlBase {
  readonly origin_: string

  constructor(url: string | URL | HostUrlPath) {
    const u = (url instanceof URL) ? url : (url instanceof HostUrlPath) ? url.toURL() : urt.newURL(url)
    super(u.href.slice(u.origin.length))
    this.origin_ = u.origin
  }

  get origin(): string { return this.origin_ }
  get href(): string { return this.toString() }

  /////////////////////////////////////////////////////////////////////////////
  // --- Core behaviors -------------------------------------------------------
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Resolve a relative, root, or host URL against this one.
   */
  resolve(...segments: readonly (string | RelativeUrlPath | RootUrlPath | HostUrlPath | null | undefined)[]): HostUrlPath {
    const { origin, ...parts } = urt.joinOrResolve(this, segments, { mode: 'resolve', baseOrigin: this.origin_ })
    return new HostUrlPath(`${origin}${urt.buildPath(parts)}`)
  }


  replaceOrigin(origin: string | HostUrlPath): HostUrlPath {
    const o = origin instanceof HostUrlPath ? origin.origin_ : origin
    return new HostUrlPath(`${o}${this.toString().replace(/^[^/]+\/\/[^/]+/, '')}`)
  }

  toString(): string {
    return `${this.origin_}${super.toString()}`
  }

  toURL(): URL {
    return new URL(this.toString())
  }

  static isHostUrlPathString(s: string): boolean {
    return urt.isHierarchicalUrl(s)
  }

  protected override cloneWithParts(params: Partial<UrlPathParts>): this {
    const ctor = this.constructor as new(path: string) => this
    const path = this.nextPathString(params)
    return new ctor(`${this.origin_}${path}`)
  }

}
