import type { AbsolutePathOps, JoinableBasic } from '../core'
import type { RelativePath } from '../path'
import type { UrlFullParts } from './url-types'
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

  constructor(url: string | URL | FullPathUrl | UrlFullParts) {
    const parts = url instanceof FullPathUrl ? url.parts : (typeof url === 'string' || url instanceof URL ) ? urt.parseFullUrl(String(url)) : url
    if (parts.pathname === '.') { parts.pathname = '/' }
    if (!pth.isAbsolute(parts.pathname)) {
      throw new Error(`FullPathUrl requires an absolute pathname. Got: '${parts.pathname}'`)
    }
    super(parts)
    this.#origin = parts.origin
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // --- Accessors and converters ---------------------------------------------
  //
  /////////////////////////////////////////////////////////////////////////////

  get origin(): string { return this.#origin }
  get href(): string { return this.toString() }
  get rootPath(): RootPathUrl { return new RootPathUrl(urt.partsToString(this.parts)) }
  toURL(): URL { return new URL(this.toString()) }

  /////////////////////////////////////////////////////////////////////////////
  //
  // --- AbsolutePathOps implementation ---------------------------------------
  //
  /////////////////////////////////////////////////////////////////////////////

  resolve(...args: readonly (JoinableBasic | TJoinable | TResolveable)[]): this {
    const parts = urt.resolve(this.parts, args.filter(Boolean).map(String))
    return this.cloneWithParts(parts)
  }

  relativeTo(base: this): TRelative {
    if (this.#origin !== base.#origin) {
      throw new Error('Cannot compute relative path between URLs with different origins.')
    }
    return new RelativePathUrl(this.nextParts({ pathname: pth.relative(base.pathname, this.pathname) }))
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

  replaceOrigin(origin: string | FullPathUrl): this {
    const o = origin instanceof FullPathUrl ? origin.#origin : origin
    return this.cloneWithParts({ origin: o })
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
    return urt.analyzeUrl(s).kind === 'hierarchical'
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // --- UrlBase Overrides ------------------------------------------------------------
  //
  /////////////////////////////////////////////////////////////////////////////

  protected override get parts(): UrlFullParts {
    return {
      ...super.parts,
      origin: this.#origin,
    }
  }

  protected override cloneWithParts(params: Partial<UrlFullParts>): this {
    const { origin, ...parts } = params
    const ctor = this.constructor as new(parts: UrlFullParts) => this
    return new ctor({
      origin: origin ?? this.#origin,
      ...this.nextParts(parts),
    })
  }

}
