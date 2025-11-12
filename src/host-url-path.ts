import * as urt from './url-tools'
import type { RelativeUrlPath } from './relative-url-path'
import type { UrlPathParts } from './url-types'
import { RootUrlPath } from './root-url-path'
import { UrlPathBase } from './url-path-base'

/**
 * Fully qualified URL with origin, pathname, query, and anchor.
 * Immutable, compositional, and consistent with PathBase.
 */
export class HostUrlPath extends UrlPathBase {
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
    let current = new URL(this.toString())
    for (const s of segments) {
      if (!s) {
        continue
      }
      const str = String(s)
      // Reset on new origin
      if (HostUrlPath.isHostUrlPathString(str)) {
        current = new URL(str)
        continue
      }
      // Reset on rooted path
      if (RootUrlPath.isRootUrlPathString(str)) {
        current = new URL(str, current.origin)
        continue
      }

      // Otherwise relative append
      const { pathname: relSegments, query: relQuery, anchor: relAnchor } = urt.parse(str)
      current.pathname = [current.pathname.replace(/\/$/, ''), relSegments].filter(Boolean).join('/')
      const currentQuery = urt.parseQuery(current.search)
      const mergedQuery = { ...currentQuery, ...relQuery }
      current.search = urt.queryToString(mergedQuery)
      if (relAnchor) {
        current.hash = `#${relAnchor}`
      } 
    }
    return new HostUrlPath(current)
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
    return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(s)
  }

  protected override cloneWithParts(params: Partial<UrlPathParts>): this {
    const ctor = this.constructor as new(path: string) => this
    const path = this.nextPathString(params)
    return new ctor(`${this.origin_}${path}`)
  }

}
