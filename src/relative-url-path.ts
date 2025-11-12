import { UrlBase } from './url-base'

export class RelativeUrlPath extends UrlBase {
  constructor(path: string) {
    if (!RelativeUrlPath.isRelativeUrlPathString(path)) {
      throw new Error(`RelativeUrlPath must not start with '/': ${path}`)
    }
    super(path)
  }

  static isRelativeUrlPathString(s: string): boolean {
    return !s.startsWith('/')
  }
}
