import type { RelativeUrlPath } from './relative-url-path'
import { RootUrlPath } from './root-url-path'
import { UrlPathBase } from './url-path-base'
import * as urt from './url-tools'

/**
 * Fully qualified URL with origin, pathname, query, and anchor.
 * Immutable, compositional, and consistent with PathBase.
 */
export class HostUrlPath extends UrlPathBase {
  readonly origin_: string

  constructor(url: string | URL | HostUrlPath) {
    const u = url instanceof HostUrlPath ? url.toURL()
            : url instanceof URL ? url
            : urt.newURL(String(url)) // eslint-disable-line @typescript-eslint/no-unnecessary-type-conversion
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
  resolve(
    ...segments: readonly (string | RelativeUrlPath | RootUrlPath | HostUrlPath | null | undefined)[]
  ): HostUrlPath {
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

  protected override newSelfUrl(params: { pathname?: string, query?: Record<string, string | string[]>, anchor?: string }): this {
    const ctor = this.constructor as new(path: string) => this
    const { pathname, query, anchor } = params
    const path = urt.buildPath({
      pathname: pathname ?? this.pathname,
      query:    query ?? this.query,
      anchor:   anchor ?? this.anchor
    })
    return new ctor(`${this.origin_}${path}`)
  }

}
