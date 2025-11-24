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

  get pathname(): string                     { return this.#pathname }
  get query():    UrlQueryParams | undefined { return this.#query && { ...this.#query } }
  get fragment(): string | undefined         { return this.#fragment }
  get isDirectory(): boolean                 { return this.#pathname.endsWith('/') || this.#pathname === '/' || this.#pathname === '.'}
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

  get stem(): string | undefined         { return this.filename?.stem }
  get extension(): string | undefined    { return this.filename?.extension }
  get filename(): Filename | undefined   { return this.#filenameStr ? new Filename(this.#filenameStr) : undefined }
  get parent(): this                     { return this.cloneWithPathname(pth.dirname(this.#pathname)) }

  replaceExtension(newExtension: string): this {
    return this.cloneWithFilename(this.#requireFilename('replaceExtension').replaceExtension(newExtension))
  }

  replaceFilename(newFilename: string | Filename): this {
    void this.#requireFilename('replaceFilename')
    return this.cloneWithFilename(String(newFilename))
  }

  replaceParent(newParent: string | this): this {
    const parts = this.parts
    parts.pathname = ''
    return this.cloneWithPathname(urt.join(parts, [String(newParent), this.#leaf, this.isDirectory ? '/' : '']).pathname)
  }

  replaceStem(newStem: string): this {
    return this.cloneWithFilename(this.#requireFilename('replaceStem').replaceStem(newStem))
  }

  transformFilename(fn: (filename: Filename) => string | Filename): this {
    return this.cloneWithFilename(fn(this.#requireFilename('transformFilename')))
  }

  join(...segments: readonly (JoinableBasic | TJoinable)[]): this {
    const parts = urt.join(this.parts, segments.filter(Boolean).map(String))
    return this.cloneWithParts(parts)
  }

  equals(other: string | this): boolean { return this.toString() === String(other) }

  /////////////////////////////////////////////////////////////////////////////
  //
  // --- Mutation-like (immutable) operations ---------------------------------
  //
  /////////////////////////////////////////////////////////////////////////////

  replacePathname(path: string | FilenameOps): this {
    return this.cloneWithParts({ pathname: String(path) })
  }

  replaceQuery(query: UrlQueryParams): this {
    return this.cloneWithParts({ query })
  }

  mergeQuery(query: UrlQueryParams): this {
    const merged: UrlQueryParams = { ...this.#query, ...query }
    return this.cloneWithParts({ query: merged })
  }

  removeQuery(): this {
    return this.cloneWithParts({ query: RemovePart })
  }

  replaceFragment(fragment: string): this {
    return this.cloneWithParts({ fragment: urt.stripLeadingHash(fragment) })
  }

  removeFragment(): this {
    return this.cloneWithParts({ fragment: RemovePart })
  }

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

  toString(): string {
    return urt.partsToString(this.parts)
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // --- Internals -----------------------------------------------------------
  //
  /////////////////////////////////////////////////////////////////////////////
  
  protected nextParts(overrides: Partial<RemovablePathParts> = {}): UrlPathParts {
    const { pathname, query, fragment } = overrides
    return {
      pathname: (pathname !== undefined) ? pth.conformAbsolute(pathname, this.#isAbsolute) : this.#pathname,
      query:    (query  === RemovePart) ? undefined : (query ?? this.#query),
      fragment: (fragment === RemovePart) ? undefined : (fragment ?? this.#fragment),
    }
  }

  /*
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

  protected cloneWithPathname(pathname: string): this {
    return this.cloneWithParts({ pathname })
  }

  protected cloneWithFilename(filename: string|Filename): this { return this.parent.join(filename) }


  get #leaf(): string | undefined        { return [...this.segments].pop() }
  get #filenameStr(): string | undefined { return this.isDirectory ? undefined : fnt.basename(this.#pathname) }
  get #isAbsolute(): boolean             { return pth.isAbsolute(this.#pathname) }

  #requireFilename(what: string): Filename {
    return this.filename ??
      (() => { throw new Error(`Can't ${what}, directory path has no filename: ${this.toString()}`) })()
  }

}
