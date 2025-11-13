import * as urt from './url-tools'
import type { FilenameBase } from './filename-base'
import type { RelativePathUrl } from './relative-path-url'
import { UrlBase } from './url-base'

export class RootPathUrl extends UrlBase {
  constructor(path: string) {
    if (!RootPathUrl.isRootPathUrlString(path)) {
      throw new Error(`RootPathUrl must start with '/': ${path}`)
    }
    super(path)
  }

  resolve(...segments: readonly (string | RelativePathUrl | RootPathUrl | FilenameBase | null | undefined)[]): RootPathUrl {
    const parts = urt.joinOrResolve(this.pathParts, segments, { mode: 'resolve' })
    return new RootPathUrl(urt.buildPath(parts))
  }

  static isRootPathUrlString(s: string): boolean {
    return s.startsWith('/')
  }

}
