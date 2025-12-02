import type { FilenameOps, PathOps, JoinableBasic } from '../core'
import type { UrlPathParts, UrlQueryParams } from './url-types'
import { Filename } from '../filename'
import { fnt, pth, urt } from '../tools'

type Override<T, R> = Omit<T, keyof R> & R
const RemovePart = Symbol('url-base.RemovePart')
type RemovablePathParts = Override<UrlPathParts, { fragment: string | typeof RemovePart, query: UrlQueryParams | typeof RemovePart }>

/**
 * Base class for all URL-style path types.
 * Provides query + fragment handling and immutable join/resolve utilities.
 */
export abstract class UrlBase<TJoinable> implements PathOps<TJoinable> {
  readonly #pathname:  string
  readonly #query?:    UrlQueryParams
  readonly #fragment?: string

  constructor(parts:  UrlPathParts) {
    const { pathname, query, fragment } = parts
    this.#pathname = pathname
    this.#query    = query
    this.#fragment = fragment
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // --- Accessors ------------------------------------------------------------
  //
  /////////////////////////////////////////////////////////////////////////////

  /**
   * @returns Returns the pathname component of the URL as a string
   * 
   * @see {@link segments}
   * @see {@link filename}
   * @see {@link isDirectory}
   *
   */
  get pathname(): string                     { return this.#pathname }

  /**
   * The query parameters (search) component of the URL, as a key/value
   * map.  
   *
   * Note the distinction between an empty query and no query:
   * * * *empty* - `{}` - The URL has a `?` but no parameters after it
   * * * *no query* - `undefined` - The URL has no `?` at all
   *
   * @see {@link mergeQuery}
   * @see {@link replaceQuery}
   * @see {@link removeQuery}
   */
  get query():    UrlQueryParams | undefined { return this.#query && { ...this.#query } }

  /**
   * The fragment (hash) component of the URL, without the leading `#`.
   *
   * Note a distinction between an empty fragment and no fragment:
   * * *empty* - `''` - The URL has a hash, but with nothing after it
   * * *no fragment* - `undefined` - The URL has no hash at all
   *
   * @see {@link replaceFragment}
   * @see {@link removeFragment}
   */
  get fragment(): string | undefined         { return this.#fragment }

  /**
   * In URL strings a trailing slash is significant -- it nominally
   * signifies a directory (e.g. `http://example.com/foo/bar/`) vs. a file
   * or resource.
   *
   * And so if a URL path's instances {@link pathname `.pathname`} ends with a slash,
   * it is considered a *directory*, and its {@link filename `.filename`} is
   * undefined.  If it does not end with a slash, its final segment is
   * considered the filename, same as for plain paths.
   *
   * A pathname consisting of a single dot (`.`) is also considered a
   * directory.
   *
   * To remove the directory designation (i.e. remove the trailing slash) from a URL path, use {@link unDirectory `unDirectory()`};
   * to create a directory designation (i.e. add a trailing slash, use {@link join `join('/')`}.
   *
   * @returns Returns `true` if this URL's {@link pathname `.pathname`} ends with a slash
   *
   * @see {@link filename}
   * @see {@link pathname}
   * @see {@link unDirectory}
   */
  get isDirectory(): boolean                 { return this.#pathname.endsWith('/') || this.#pathname === '/' || this.#pathname === '.'}

  /**
   * {@inheritDoc <internal>!PathOps#segments}}
   * @ForDirectoryPaths
   * If the pathname ends with a slash (i.e. {@link isDirectory `this.isDirectory === true`})
   * there is no filename, the last segment in the array will be the last
   * directory name.
   */
  get segments(): string[]                   { return this.#pathname.split('/').filter(Boolean) }

  /** @hidden */
  protected get parts(): UrlPathParts {
    return {
      pathname: this.#pathname,
      query:    this.#query,
      fragment: this.#fragment,
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // --- PathOps implementation -----------------------------------------------
  //
  /////////////////////////////////////////////////////////////////////////////

  /**
   * {@inheritDoc <internal>!FilenameOps#stem}
   * @ForDirectoryPaths
   * If the pathname ends with a slash (i.e. {@link isDirectory `this.isDirectory === true`})
   * there is no filename, and so `this.stem` returns `undefined`
   */
  get stem(): string | undefined         { return this.filename?.stem }

  /**
   * {@inheritDoc <internal>!FilenameOps#extension}
   * @ForDirectoryPaths
   * If the pathname ends with a slash (i.e. {@link isDirectory `this.isDirectory === true`})
   * there is no filename, and so `this.extension` returns `undefined`
   */
  get extension(): string | undefined    { return this.filename?.extension }

  /**
   * {@inheritDoc <internal>!PathOps#filename}
   *
   * @ForDirectoryPaths
   * If the pathname ends with a slash (i.e. {@link isDirectory `this.isDirectory === true`})
   * there is no filename, so `this.filename` returns `undefined`.
   */
  get filename(): Filename | undefined   { return this.#filenameStr ? new Filename(this.#filenameStr) : undefined }

  /**
   * @returns Returns a new URL instance for parent directory of this URL.  The new
   * instance always has {@link isDirectory `.isDirectory`} `true`, and keeps the same
   * query and hash as `this`.
   */
  get parent(): this                     { return this.cloneWithPathname(pth.dirname(this.#pathname)) }

  /**
   * {@inheritDoc <internal>!FilenameOps#replaceExtension}
   */
  replaceExtension(newExtension: string): this {
    return this.cloneWithFilename(this.#requireFilename('replaceExtension').replaceExtension(newExtension))
  }

  /**
   * {@inheritDoc <internal>!PathOps#replaceFilename}
   */
  replaceFilename(newFilename: string | Filename): this {
    void this.#requireFilename('replaceFilename')
    return this.cloneWithFilename(String(newFilename))
  }

  /**
   * {@inheritDoc <internal>!PathOps#replaceParent}
   */
  replaceParent(newParent: string | this): this {
    const parts = this.parts
    parts.pathname = ''
    return this.cloneWithPathname(urt.join(parts, [String(newParent), this.#leaf, this.isDirectory ? '/' : '']).pathname)
  }

  /**
   * {@inheritDoc <internal>!FilenameOps#replaceStem}
   */
  replaceStem(newStem: string): this {
    return this.cloneWithFilename(this.#requireFilename('replaceStem').replaceStem(newStem))
  }

  /**
   * {@inheritDoc <internal>!PathOps#transformFilename}
   */
  transformFilename(fn: (filename: Filename) => string | Filename): this {
    return this.cloneWithFilename(fn(this.#requireFilename('transformFilename')))
  }

  /**
   * Join additional path segments to this URL's pathname.
   *
   * Accepts relative path objects and {@link Filename} segment arguments
   * for type safety, but you can also directly pass strings for
   * convenience.   All args are stringified and interpreted as segments to
   * be joined, regardless of whether they start with a path separator or
   * URL origin.
   *
   * In addition to joining path segments, `.join()` also merges queries
   * and fragments from the given segments into the resulting URL: as the
   * args are processed, any query encountered will be merged into the
   * current query using the semantics of {@link mergeQuery `mergeQuery()`},  and any
   * fragment will replace the current fragment.
   *
   * (It's not possible to remove an existing query parameter or the entire
   * query or an existing framgent using `.join()`, only to add/replace
   * them, although they can be replaced with '')
   *
   * Any `null`, `undefined`, or empty segments are ignored.
   *
   * @returns A new instance with the segments appended and resulting
   * pathname normalized, and queries and fragments merged.
   */

  join(...segments: readonly (JoinableBasic | TJoinable)[]): this {
    const parts = urt.join(this.parts, segments.filter(Boolean).map(String))
    return this.cloneWithParts(parts)
  }

  /**
   * Returns true if this URL is equal to the given URL instance or URL
   * string, where equality is defined as equality of their string
   * representations.
   */
  equals(other: string | this): boolean { return this.toString() === String(other) }

  /////////////////////////////////////////////////////////////////////////////
  //
  // --- Mutation-like (immutable) operations ---------------------------------
  //
  /////////////////////////////////////////////////////////////////////////////

  /**
   * @returns Returns a new instance with the given pathname replacing the
   * current pathname; all other URL components remain the same.
   */
  replacePathname(path: string | FilenameOps): this {
    return this.cloneWithParts({ pathname: String(path) })
  }

  /*
   * @returns Returns a new instance with the given query parameters,
   * replacing the current query parameters (if any).
   *
   * The given query parameters can be empty `{}` to create an empty query
   * (i.e. a `?` with no parameters after it); to remove the query
   * entirely, use {@link removeQuery `removeQuery()`}.
   *
   * @see {@link UrlBase#query query}
   * @see {@link mergeQuery}
   * @see {@link removeQuery}
   */
  replaceQuery(query: UrlQueryParams): this {
    return this.cloneWithParts({ query })
  }

  /**
   * Merges the given query parameters into the URL's existing query
   * parameters, returning a new instance with the merged result.
   *
   * The merge overwrite the values of the existing query for whichever
   * keys are given in the provided query.    If there is no current query,
   * or if the current query is empty, this has the same effect as {@link
   * replaceQuery `replaceQuery()`}.
   *
   * @see {@link UrlBase#query query}
   * @see {@link replaceQuery}
   * @see {@link removeQuery}
   *
   * @example
   * ```ts
   * url.replaceQuery({ a: '1', b: '2' })          // ?a=1&b=2
   * url.mergeQuery({ b: '3', c: '4' })    // ?a=1&b=3&c=4
   *
   * url.replaceQuery({ arr: ['1', '2'] })          // ?arr=1&arr=2
   * url.mergeQuery({ arr: [...url.query.arr, '3'] }) // ?arr=1&arr=2&arr=3
   * ```
   */
  mergeQuery(query: UrlQueryParams): this {
    const merged: UrlQueryParams = { ...this.#query, ...query }
    return this.cloneWithParts({ query: merged })
  }

  /**
   * @returns Returns a new instance with the query parameters removed,
   * i.e. the URL string will have no `?` component.
   *
   * @see {@link query}
   * @see {@link mergeQuery}
   * @see {@link replaceQuery}
   */
  removeQuery(): this {
    return this.cloneWithParts({ query: RemovePart })
  }

  /**
   * @returns
   *
   * Returns a new instance with the given fragment (hash) string,
   * replacing the current fragment (if any).
   *
   * For convenience, a single leading `#` in `fragment` will be stripped;
   * if you want a leading `#` to be part of the fragment, use `##`
   *
   * You can provide an empty string to create an empty fragment; to remove
   * the fragment entirely, use {@link removeFragment}.
   *
   * @see {@link UrlBase#fragment fragment}
   * @see {@link removeFragment}
   */
  replaceFragment(fragment: string): this {
    return this.cloneWithParts({ fragment: urt.stripLeadingHash(fragment) })
  }

  /**
   * Returns a new instance with the fragment removed, i.e. the URL string
   * will have no `#` component.
   *
   * @see {@link UrlBase#fragment fragment}
   * @see {@link replaceFragment}
   */
  removeFragment(): this {
    return this.cloneWithParts({ fragment: RemovePart })
  }

  /**
   * @returns Returns a new instance with the directory designation
   * removed, i.e.  the final slash (if any) is removed from the pathname.
   *
   * @see {@link isDirectory}
   * @see {@link pathname}
   */
  unDirectory(): this {
    if (this.isDirectory) {
      return this.cloneWithParts({ pathname: this.#pathname.replace(/\/+$/,'') })
    }
    return this
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // --- Stringification ------------------------------------------------------
  //
  /////////////////////////////////////////////////////////////////////////////

  /**
   * @returns Returns the string representation of this URL.
   */
  toString(): string {
    return urt.partsToString(this.parts)
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // --- Internals -----------------------------------------------------------
  //
  /////////////////////////////////////////////////////////////////////////////
  
  /** @hidden */
  protected nextParts(overrides: Partial<RemovablePathParts> = {}): UrlPathParts {
    const { pathname, query, fragment } = overrides
    return {
      pathname: (pathname !== undefined) ? pth.conformAbsolute(pathname, this.#isAbsolute) : this.#pathname,
      query:    (query  === RemovePart) ? undefined : (query ?? this.#query),
      fragment: (fragment === RemovePart) ? undefined : (fragment ?? this.#fragment),
    }
  }

  /**
   * @hidden
   *
   * Protected factory to construct a new instance of the current class,
   * optionally given any of a new pathname, query, or fragment.  Any not
   * provided will default to the current instance's value.
   *
   * Used by all mutation-like methods to return a new instance of the same
   * class, allowing derived classes that inherit those methods to return new
   * instances of themselves without needing to override them.
   */
  protected cloneWithParts(params: Partial<RemovablePathParts>): this {
    const ctor = this.constructor as new(parts: UrlPathParts) => this
    return new ctor(this.nextParts(params))
  }

  /** @hidden */
  protected cloneWithPathname(pathname: string): this {
    return this.cloneWithParts({ pathname })
  }

  /** @hidden */
  protected cloneWithFilename(filename: string|Filename): this { return this.parent.join(filename) }


  get #leaf(): string | undefined        { return [...this.segments].pop() }
  get #filenameStr(): string | undefined { return this.isDirectory ? undefined : fnt.basename(this.#pathname) }
  get #isAbsolute(): boolean             { return pth.isAbsolute(this.#pathname) }

  #requireFilename(what: string): Filename {
    return this.filename ??
      (() => { throw new Error(`Can't ${what}, directory path has no filename: ${this.toString()}`) })()
  }

}
