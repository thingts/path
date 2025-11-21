import type { AbsolutePathOps, JoinableBasic } from '../core'
import type { RelativePath } from '../path'
import type { UrlPathParts } from './url-types'
import { RelativePathUrl } from './relative-path-url'
import { RootPathUrl } from './root-path-url'
import { UrlBase } from './url-base'
import { pth, urt } from '../tools'

type TRelative    = RelativePathUrl
type TJoinable    = RelativePathUrl | RelativePath
type TResolveable = RootPathUrl | FullPathUrl

/**
 * Fully qualified URL with origin, pathname, query, and fragment.
 * Immutable, compositional, and consistent with PathBase.
 */
export class FullPathUrl extends UrlBase<TJoinable> implements AbsolutePathOps<TRelative, TResolveable, TJoinable> {
  readonly #origin: string

  constructor(url: string | URL | FullPathUrl) {
    const str = String(url)
    const parsed = urt.parseUrl(str)
    if (parsed.kind !== 'hierarchical') {
      throw urt.urlParseError(parsed, str)
    }
    const { path, origin } = parsed
    super('/'+path) // ensure leading slash
    this.#origin = origin
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // --- Accessors and converters ---------------------------------------------
  //
  /////////////////////////////////////////////////////////////////////////////

  get origin(): string { return this.#origin }
  get href(): string { return this.toString() }
  get rootPath(): RootPathUrl { return new RootPathUrl(urt.buildPath(this.pathParts)) }
  toURL(): URL { return new URL(this.toString()) }

  /////////////////////////////////////////////////////////////////////////////
  //
  // --- AbsolutePathOps implementation ---------------------------------------
  //
  /////////////////////////////////////////////////////////////////////////////

  resolve(...args: readonly (JoinableBasic | TJoinable | TResolveable)[]): this {
    const { origin, ...parts } = urt.resolve(this.pathParts, args.filter(Boolean).map(String), { baseOrigin: this.#origin })
    return this.cloneWithUrlString(`${origin}${urt.buildPath(parts)}`)
  }

  relativeTo(base: this): TRelative {
    if (this.#origin !== base.#origin) {
      throw new Error('Cannot compute relative path between URLs with different origins.')
    }
    return new RelativePathUrl(this.nextPathString({ pathname: pth.relative(base.pathname, this.pathname) }))
  }

  descendsFrom(ancestor: this | string, opts?: { includeSelf?: boolean }): boolean {
    const ancestorUrl = ancestor instanceof FullPathUrl ? ancestor : new FullPathUrl(ancestor)
    if (this.#origin !== ancestorUrl.#origin) {
      return false
    }
    return pth.descendsFrom(ancestorUrl.pathname, this.pathname, opts)
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // --- Mutation-like (immutable) operations ---------------------------------
  //
  /////////////////////////////////////////////////////////////////////////////

  replaceOrigin(origin: string | FullPathUrl): FullPathUrl {
    const o = origin instanceof FullPathUrl ? origin.#origin : origin
    return new FullPathUrl(`${o}${this.toString().replace(/^[^/]+\/\/[^/]+/, '')}`)
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // --- Static methods ---------------------------------
  //
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Returns true if the given string is a valid full path (hierarchical) URL.
   *
   * @example
   *
   * ```
   * FullPathUrl.isFullPathUrlString('https://example.com/path/to/resource?query=param#fragment') // true
   * FullPathUrl.isFullPathUrlString('ftp://ftp.example.com/resource') // true
   * FullPathUrl.isFullPathUrlString('data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==') // false
   * FullPathUrl.isFullPathUrlString('/relative/path') // false
   * ```
   *
   */
  static isFullPathUrlString(s: string): boolean {
    return urt.parseUrl(s).kind === 'hierarchical'
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // --- UrlBase Overrides ------------------------------------------------------------
  //
  /////////////////////////////////////////////////////////////////////////////

  override toString(): string {
    return `${this.#origin}${super.toString()}`
  }

  protected override cloneWithParts(params: Partial<UrlPathParts>): this {
    const ctor = this.constructor as new(path: string) => this
    const path = this.nextPathString(params)
    return new ctor(`${this.#origin}${path}`)
  }

}
