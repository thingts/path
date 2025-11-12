import * as urt from './url-tools'
import type { AbsolutePath } from './absolute-path'
import type { RelativePath } from './relative-path'
import type { RelativeUrlPath } from './relative-url-path'
import { UrlPathBase } from './url-path-base'

export class RootUrlPath extends UrlPathBase {
  constructor(path: string) {
    if (!RootUrlPath.isRootUrlPathString(path)) {
      throw new Error(`RootUrlPath must start with '/': ${path}`)
    }
    super(path)
  }

  resolve(...segments: readonly (string | RelativeUrlPath | RootUrlPath | RelativePath | AbsolutePath | null | undefined)[]): RootUrlPath {
    let pathname = this.pathname
    let query = { ...this.query }
    let anchor = this.anchor
    for (const s of segments) {
      if (!s) continue
      const { pathname: relPathname, query: relQuery, anchor: relAnchor } = urt.parse(String(s))
      if (relPathname.startsWith('/')) {
        pathname   = relPathname
        query  = relQuery ?? {}
        anchor = relAnchor
      } else {
        pathname = [pathname.replace(/\/$/, ''), relPathname].filter(Boolean).join('/')
        query = { ...query, ...relQuery }
        if (relAnchor) anchor = relAnchor
      }
    }
    return new RootUrlPath(urt.buildPath({ pathname, query, anchor }))
  }

  static isRootUrlPathString(s: string): boolean {
    return s.startsWith('/')
  }

}
