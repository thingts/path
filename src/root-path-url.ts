import * as urt from './url-tools'
import type { AbsolutePath } from './absolute-path'
import type { RelativePath } from './relative-path'
import type { RelativePathUrl } from './relative-path-url'
import { UrlBase } from './url-base'

export class RootPathUrl extends UrlBase {
  constructor(path: string) {
    if (!RootPathUrl.isRootPathUrlString(path)) {
      throw new Error(`RootPathUrl must start with '/': ${path}`)
    }
    super(path)
  }

  resolve(...segments: readonly (string | RelativePathUrl | RootPathUrl | RelativePath | AbsolutePath | null | undefined)[]): RootPathUrl {
    let pathname = this.pathname
    let query = { ...this.query }
    let fragment = this.fragment
    for (const s of segments) {
      if (!s) continue
      const { pathname: relPathname, query: relQuery, fragment: relFragment } = urt.parse(String(s))
      if (relPathname.startsWith('/')) {
        pathname   = relPathname
        query  = relQuery ?? {}
        fragment = relFragment
      } else {
        pathname = [pathname.replace(/\/$/, ''), relPathname].filter(Boolean).join('/')
        query = { ...query, ...relQuery }
        if (relFragment) fragment = relFragment
      }
    }
    return new RootPathUrl(urt.buildPath({ pathname, query, fragment }))
  }

  static isRootPathUrlString(s: string): boolean {
    return s.startsWith('/')
  }

}
