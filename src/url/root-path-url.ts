import type { AbsolutePathOps, JoinableBasic } from '../core'
import type { RelativePath } from '../path'
import { RelativePathUrl } from './relative-path-url'
import { UrlBase } from './url-base'
import { pth, urt } from '../tools'

type TRelative    = RelativePathUrl
type TJoinable    = RelativePathUrl | RelativePath
type TResolveable = RootPathUrl


export class RootPathUrl extends UrlBase<TJoinable> implements AbsolutePathOps<TRelative, TResolveable, TJoinable> {
  constructor(path: string) {
    if (!RootPathUrl.isRootPathUrlString(path)) {
      throw new Error(`RootPathUrl must start with '/': ${path}`)
    }
    super(path)
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // --- AbsolutePathOps implementation ---------------------------------------
  //
  /////////////////////////////////////////////////////////////////////////////

  resolve(...args: readonly (JoinableBasic | TJoinable | TResolveable | null | undefined)[]): this {
    const parts = urt.joinOrResolve(this.pathParts, args.filter(Boolean).map(String), { mode: 'resolve' })
    return this.cloneWithUrlString(urt.buildPath(parts))
  }

  relativeTo(base: this): TRelative {
    return new RelativePathUrl(this.nextPathString({ pathname: pth.relative(base.pathname, this.pathname) }))
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
