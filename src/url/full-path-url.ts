import type { AbsolutePathOps, JoinableBasic } from '../core'
import type { RelativePath } from '../path'
import type { UrlFullParts } from './url-types'
import { RelativePathUrl } from './relative-path-url'
import { RootPathUrl } from './root-path-url'
import { UrlBase } from './url-base'
import { isUrlFullParts } from './url-types'
import { pth, urt } from '../tools'


type TRelative    = RelativePathUrl

/** @inline */
type TJoinable    = RelativePathUrl | RelativePath

/** @inline */
type TResolveable = RootPathUrl | FullPathUrl

/**
 * Fully qualified URL with origin, pathname, query, and fragment, for URLs
 * that have paths, specifically the ["special
 * schemes"](https://url.spec.whatwg.org/#special-scheme): `http://`,
 * `https://`, `ftp://`, `ftps://`, `ws://`, `wss://`, and `file://`.
 *
 * Analogous to {@link AbsolutePath} but for Full URLs, i.e. it has an origin
 * (e.g. `https://example.com:8080`) and may have query parameters and a
 * fragment, and has methods to work with them.
 *
 * Has the same capabilities as {@link RootPathUrl}, but requires an origin,
 * and provides methods to work with the origin and for conversion to/from
 * the standard `URL` class.
 *
 * {@include ./doc-normalization.md}
 * * The origin is normalized to lowercase scheme and host.
 *
 * {@include ./doc-encoding.md}
 *
 * @example
 * ```ts
 * const url1 = new FullPathUrl('https://example.com:8080/foo/bar/baz.txt?query=1#frag')
 * const url2 = new FullPathUrl({
 *   origin: 'https://example.com:8080',
 *   pathname: '/foo/bar/baz.txt',
 *   query: { query: '1' },
 *   fragment: 'frag'
 * })
 * url1.equals(url2) // → true
 * url1.toURL()      // → URL('https://example.com:8080/foo/bar/baz.txt?query=1#frag')
 * url1.href         // → 'https://example.com:8080/foo/bar/baz.txt?query=1#frag'
 * url1.rootPath     // → RootPathUrl('/foo/bar/baz.txt?query=1#frag')
 *
 * const url3 = new FullPathUrl({
 *     origin: 'HTTPS://Example.com:8080',
 *     pathname: '/foo bar/baz.txt',
 *     query: { 'a b': 'c d??' },
 *     fragment: 'my fragment #1'
 * })
 *
 * url3.origin   // → 'https://example.com:8080'
 * url3.pathname // → '/foo bar/baz.txt'
 * url3.query    // → { 'a b': 'c d??' }
 * url3.fragment // → 'my fragment #1'
 * url3.href     // → 'https://example.com:8080/foo%20bar/baz.txt?a%20b=c%20d%3F%3F#my%20fragment%20%231'
 * ```
 */
export class FullPathUrl extends UrlBase<TJoinable> implements AbsolutePathOps<TRelative, TResolveable, TJoinable> {
  readonly #origin: string

  /**
   * Creates a new FullPathUrl instance from the given URL, string or parts.
   *
   * @throws Throws an error if given a string that does not properly parse to
   * a full URL, or if given a scheme that is not one of: `http:`, `https:`,
   * `ftp:`, `ftps:`, `ws:`, 'wss:', or `file:`
   * 
   *
   * @example
   * ```ts
   * const url1 = new FullPathUrl('https://example.com:8080/foo/bar/baz.txt?query=1#frag')
   * const url2 = new FullPathUrl({
   *   origin: 'https://example.com:8080',
   *   pathname: '/foo/bar/baz.txt',
   *   query: { query: '1' },
   *   fragment: 'frag'
   * })
   * ```
   */
  constructor(url: string | URL | FullPathUrl | UrlFullParts) {
    const parts = url instanceof FullPathUrl ? url.parts : isUrlFullParts(url) ? url : urt.parseFullUrl(String(url))
    if (parts.pathname === '.') { parts.pathname = '/' }
    if (!pth.isAbsolute(parts.pathname)) {
      throw new Error(`FullPathUrl requires an absolute pathname. Got: '${parts.pathname}'`)
    }
    if(!urt.isHierarchicalOrigin(parts.origin)) {
      throw new Error(`FullPathUrl requires a hierarchical URL scheme (e.g. 'http:', 'https:'). Got: '${parts.origin}'`)
    }
    super(parts)
    this.#origin = parts.origin
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // --- Accessors and converters ---------------------------------------------
  //
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Returns the origin (scheme + authority) portion of the URL.
   * @example
   * ```ts
   * const url = new FullPathUrl('https://example.com:8080/foo/bar/baz.txt?query=1#frag')
   * url.origin // → 'https://example.com:8080'
   * ```
   */
  get origin(): string { return this.#origin }

  /**
   * The full URL as a string, with proper percent-encoding applied.
   * 
   * This is an alias for {@link toString}
   */
  get href(): string { return this.toString() }

  /**
   * Returns a {@link RootPathUrl } representing the root path of this URL,
   * including the query and fragment (if any) -- I.e. this URL without the
   * origin.
   * @example
   * ```ts
   * const url = new FullPathUrl('https://example.com:8080/foo/bar/baz.txt?query=1#frag')
   * url.rootPath // → RootPathUrl('/foo/bar/baz.txt?query=1#frag')
   * ```
   */
  get rootPath(): RootPathUrl { return new RootPathUrl(this.parts) }

  /**
   * @returns
   * Returns a new `URL` instance representing this FullPathUrl.
   * @example
   * ```ts
   * const url = new FullPathUrl('https://example.com:8080/foo/bar/baz.txt?query=1#frag')
   * url.toURL() // → URL('https://example.com:8080/foo/bar/baz.txt?query=1#frag')
   * ```
   */
  toURL(): URL { return new URL(this.toString()) }

  /////////////////////////////////////////////////////////////////////////////
  //
  // --- UrlBase documentation overrides --------------------------------------
  //
  /////////////////////////////////////////////////////////////////////////////

  /**
   * {@inheritDoc <internal>!UrlBase#join}
   * @example
   *  ```ts
   *  const url    = new FullPathUrl('/foo/bar?x=1#frag')
   *  const result = url.join('more', '/other/path?x=2&y=2#fragB', 'final.txt#fragC')
   *          // → FullPathUrl('/foo/bar/more/other/path/final.txt?x=2&y=2#fragC')
   *  ```
   */
  override join(...segments: readonly (JoinableBasic | TJoinable)[]): this { return super.join(...segments) }

  /////////////////////////////////////////////////////////////////////////////
  //
  // --- AbsolutePathOps implementation ---------------------------------------
  //
  /////////////////////////////////////////////////////////////////////////////

  /**
   * {@include ./doc-resolve.md}
   * @ForFullPathURLs
   * As the args are processed, if a full URL (i.e. origin + pathname
   * starting with '/') is encountered, the entire current URL is discarded
   * (origin, pathname, query, fragment) and replaced with that argument.
   *
   * `resolve()` can be used to convert a {@link RootPathUrl} or {@link RelativePathUrl} to a {@link FullPathUrl} (see examples).
   *
   * @example
   * ```ts
   * const url = new FullPathUrl('http://example.com/project/src?x=1#frag')
   * url.resolve('lib/utils', '../index.ts', '?y=2', '#newfrag') // → FullPathUrl('http://example.com/project/src/lib/index.ts?y=2#newfrag')
   * url.resolve('lib', '/other/path/file.txt&z=3')              // → FullPathUrl('http://example.com/other/path/file.txt?z=3')
   * url.resolve('http://another.com/new/path')                  // → FullPathUrl('http://another.com/new/path')
   *
   * // Converting a RootPathUrl to FullPathUrl
   * const root = new RootPathUrl('/project/src/index.ts?x=1#frag')
   * const rel = new RelativePathUrl('project/src/index.ts?x=1#frag')
   * new FullPathUrl('http://example.com/').resolve(rootPath) // → FullPathUrl('http://example.com/project/src/index.ts?x=1#frag')
   * new FullPathUrl('http://example.com/').resolve(relPath)  // → FullPathUrl('http://example.com/project/src/index.ts?x=1#frag')
   * ```
   *
   * @see {@link rootPath}
   */
  resolve(...args: readonly (JoinableBasic | TJoinable | TResolveable)[]): this {
    const parts = urt.resolve(this.parts, args.filter(Boolean).map(String))
    return this.cloneWithParts(parts)
  }

  /**
   * {@inheritDoc <internal>!AbsolutePathOps#relativeTo}
   * @QueryAndFragment
   * The returned {@link RelativePathUrl } has the same query and fragment as `this`
   * @throws Throws an error if the two origins differ
   * @example
   * ```ts
   * const p1 = new FullPathUrl('http://example.com/project')
   * const p2 = new FullPathUrl('http://example.com/project/src/index.ts?q=1#frag')
   * const rel = p2.relativeTo(p1) // → RelativePathUrl('src/index.ts?q=1#frag')
   */
  relativeTo(base: this): TRelative {
    if (this.#origin !== base.#origin) {
      throw new Error('Cannot compute relative path between URLs with different origins.')
    }
    return new RelativePathUrl(this.nextParts({ pathname: pth.relative(base.pathname, this.pathname) }))
  }

  /**
   * {@inheritDoc <internal>!AbsolutePathOps#descendsFrom}
   * @Origin
   * The origin is also compared; if the origins differ, this method returns `false`.   
   * @QueryAndFragment
   * Query and fragment are ignored.
   *
   * @example
   * ```ts
   * const p1 = new FullPathUrl('http://example.com/project')
   * const p2 = new FullPathUrl('http://example.com/project/src/index.ts')
   * p2.descendsFrom(p1)                        // → true
   * p1.descendsFrom(p1)                        // → false
   * p1.descendsFrom(p1, { includeSelf: true }) // → true
   * ```
   */
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

  /**
   * @returns A new FullPathUrl instance with the origin replaced with the
   * given value.
   * @example
   * ```ts
   * const url = new FullPathUrl('https://example.com/foo/bar')
   * url.replaceOrigin('http://another.com') // → FullPathUrl('http://another.com/foo/bar')
   * ```
   */
  replaceOrigin(origin: string | FullPathUrl): this {
    const o = origin instanceof FullPathUrl ? origin.#origin : origin
    return this.cloneWithParts({ origin: o })
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
