import type { RelativePath } from '../path'
import { UrlBase } from './url-base'

type Joinable = RelativePathUrl | RelativePath

export class RelativePathUrl extends UrlBase<Joinable> {
  constructor(path: string) {
    if (!RelativePathUrl.isRelativePathUrlString(path)) {
      throw new Error(`RelativePathUrl must not start with '/': ${path}`)
    }
    super(path)
  }

  static isRelativePathUrlString(s: string): boolean {
    return !s.startsWith('/')
  }
}
