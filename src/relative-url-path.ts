import { UrlPathBase } from './url-path-base'

export class RelativeUrlPath extends UrlPathBase {
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
