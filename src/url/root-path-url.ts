import type { AbsolutePathOps, JoinableBasic } from '../core'
import type { RelativePath } from '../path'
import type { RelativePathUrl } from './relative-path-url'
import { UrlBase } from './url-base'
import { urt } from '../tools'

type Joinable    = RelativePathUrl | RelativePath
type Resolveable = RootPathUrl


export class RootPathUrl extends UrlBase<Joinable> implements AbsolutePathOps<Resolveable, Joinable> {
  constructor(path: string) {
    if (!RootPathUrl.isRootPathUrlString(path)) {
      throw new Error(`RootPathUrl must start with '/': ${path}`)
    }
    super(path)
  }

  resolve(...args: readonly (JoinableBasic | Joinable | Resolveable | null | undefined)[]): this {
    const parts = urt.joinOrResolve(this.pathParts, args.filter(Boolean).map(String), { mode: 'resolve' })
    return this.cloneWithUrlString(urt.buildPath(parts))
  }

  static isRootPathUrlString(s: string): boolean {
    return s.startsWith('/')
  }

}
