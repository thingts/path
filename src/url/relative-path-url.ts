import { UrlBase } from './url-base'

export class RelativePathUrl extends UrlBase {
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
