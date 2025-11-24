import type { AbsolutePathOps, JoinableBasic } from '../core'
import type { RelativePath } from '../path'
import { RelativePathUrl } from './relative-path-url'
import type { AbsolutePath } from '../path'
import type { UrlPathParts } from './url-types'
import { isUrlPathParts } from './url-types'
import { UrlBase } from './url-base'
import { pth, urt } from '../tools'

type TRelative    = RelativePathUrl
type TJoinable    = RelativePathUrl | RelativePath
type TResolveable = RootPathUrl


export class RootPathUrl extends UrlBase<TJoinable> implements AbsolutePathOps<TRelative, TResolveable, TJoinable> {
  constructor(url: string | RootPathUrl | AbsolutePath | UrlPathParts) {
    const parts = (url instanceof RootPathUrl) ? url.parts : isUrlPathParts(url) ? url : urt.parsePath(String(url))
    if (!RootPathUrl.isRootPathUrlString(parts.pathname)) {
      throw new Error(`RootPathUrl must start with '/': ${parts.pathname}`)
    }
    super(parts)
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // --- AbsolutePathOps implementation ---------------------------------------
  //
  /////////////////////////////////////////////////////////////////////////////

  resolve(...args: readonly (JoinableBasic | TJoinable | TResolveable | null | undefined)[]): this {
    const parts = urt.resolve(this.parts, args.filter(Boolean).map(String))
    return this.cloneWithParts(parts)
  }

  relativeTo(base: this): TRelative {
    return new RelativePathUrl({ pathname: pth.relative(base.pathname, this.pathname) })
  }

  descendsFrom(ancestor: this | string, opts?: { includeSelf?: boolean }): boolean {
    const ancestorUrl = ancestor instanceof RootPathUrl ? ancestor : new RootPathUrl(ancestor)
    return pth.descendsFrom(ancestorUrl.pathname, this.pathname, opts)
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // --- Static methods ---------------------------------
  //
  /////////////////////////////////////////////////////////////////////////////

  static isRootPathUrlString(s: string): boolean {
    return s.startsWith('/')
  }

}
