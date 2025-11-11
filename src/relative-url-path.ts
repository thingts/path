import * as urt from './url-tools'
import { UrlPathBase } from './url-path-base'

export class RelativeUrlPath extends UrlPathBase {
  constructor(
    path: string,
  ) {
    urt.validatePath(path)
    if (path.startsWith('/')) {
      throw new Error(`RelativeUrlPath must not start with '/': ${path}`)
    }
    super(path)
  }
}
