import type { RelativePath } from '../path'
import type { UrlPathParts } from './url-types'
import { UrlBase } from './url-base'
import { isUrlPathParts } from './url-types'
import { urt } from '../tools'

type Joinable = RelativePathUrl | RelativePath

export class RelativePathUrl extends UrlBase<Joinable> {
  constructor(url: string | RelativePathUrl | RelativePath | UrlPathParts) {
    const parts = (url instanceof RelativePathUrl) ? url.parts : isUrlPathParts(url) ? url : urt.parsePath(String(url))
    if (!RelativePathUrl.isRelativePathUrlString(parts.pathname)) {
      throw new Error(`RelativePathUrl must not start with '/': ${parts.pathname}`)
    }
    super(parts)
  }

  static isRelativePathUrlString(s: string): boolean {
    return !s.startsWith('/')
  }
}
