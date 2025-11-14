import type { PathOps, JoinableBasic } from '../core'
import type { QueryParams, UrlPathParts } from './url-types'
import { Filename } from '../filename'
import { FilenameBase } from '../core'
import { fnt, pth, urt } from '../tools'

/**
 * Base class for all URL-style path types.
 * Provides query + fragment handling and immutable join/resolve utilities.
 */
export abstract class UrlBase<TJoinable> extends FilenameBase implements PathOps<TJoinable> {
  protected pathname_: string
  protected readonly query_?: QueryParams
  protected readonly fragment_?: string

  constructor(path: string) {
    super()
    const { pathname, query, fragment } = urt.parse(path)
    this.pathname_ = pathname
    this.query_    = query
    this.fragment_ = fragment
  }

  /////////////////////////////////////////////////////////////////////////////
  // --- Accessors ------------------------------------------------------------
  /////////////////////////////////////////////////////////////////////////////

  get pathname(): string { return this.pathname_ }
  get query():    QueryParams { return { ...this.query_ } }
  get fragment(): string | undefined { return this.fragment_ }

  protected get pathParts(): UrlPathParts {
    return {
      pathname: this.pathname_,
      query:    this.query_,
      fragment:   this.fragment_,
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // --- PathOps implementation -----------------------------------------------
  /////////////////////////////////////////////////////////////////////////////

  get filename(): Filename { return new Filename(this.filename_) }
  get parent(): this       { return this.cloneWithPathname(pth.dirname(this.pathname_)) }

  replaceExtension(newExtension: string): this                           { return this.cloneWithFilename(this.filename.replaceExtension(newExtension)) }
  replaceFilename(newFilename: string | Filename): this                  { return this.cloneWithFilename(String(newFilename)) }
  replaceParent(newParent: string | this): this                          { return this.cloneWithPathname(pth.join(String(newParent), this.filename_)) }
  replaceStem(newStem: string): this                                     { return this.cloneWithFilename(this.filename.replaceStem(newStem)) }
  transformFilename(fn: (filename: Filename) => string | Filename): this { return this.cloneWithFilename(fn(this.filename)) }

  join(...segments: readonly (JoinableBasic | TJoinable)[]): this {
    const pathParts = urt.joinOrResolve(this.pathParts, segments.filter(Boolean).map(String), { mode: 'join' })
    return this.cloneWithParts(pathParts)
  }

  /////////////////////////////////////////////////////////////////////////////
  // --- Mutation-like (immutable) operations ---------------------------------
  /////////////////////////////////////////////////////////////////////////////

  replacePathname(path: string | FilenameBase): this {
    return this.cloneWithParts({ pathname: String(path) })
  }

  replaceQuery(query: QueryParams): this {
    return this.cloneWithParts({ query })
  }

  mergeQuery(query: QueryParams): this {
    const merged: QueryParams = { ...this.query_, ...query }
    return this.cloneWithParts({ query: merged })
  }

  replaceFragment(fragment: string): this {
    return this.cloneWithParts({ fragment })
  }


  /**
   * Protected helper to construct a new path string, optionally given any of a
   * new pathname, query, or fragment.  Any not provided will default to the
   * current instance's value.
   *
   * Used by all mutation-like methods to build the new path string.
   */
  protected nextPathString(params: Partial<UrlPathParts>): string {
    const { pathname, query, fragment } = params
    return urt.buildPath({
      pathname: pathname ?? this.pathname_,
      query:    query    ?? this.query_,
      fragment: fragment ?? this.fragment_
    })
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
  protected cloneWithParts(params: Partial<UrlPathParts>): this {
    const ctor = this.constructor as new(path: string) => this
    const path = this.nextPathString(params)
    return new ctor(path)
  }

  protected cloneWithPathname(pathname: string): this {
    return this.cloneWithParts({ pathname })
  }

  protected cloneWithUrlString(path: string): this {
    const ctor = this.constructor as new(path: string) => this
    return new ctor(path)
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // --- FilenameBase abstract method implemenations ---
  //
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Returns true if this path equals the other path or string.
   * Does not depend on the order of query parameters.
   */
  equals(other: string | this): boolean                   { return this.toString() === this.cloneWithUrlString(String(other)).toString() }

  protected get filename_(): string                       { return fnt.basename(this.pathname_) }
  protected cloneWithFilename(filename: string|Filename): this { return this.parent.join(filename) }

  /////////////////////////////////////////////////////////////////////////////
  // --- Stringification ------------------------------------------------------
  /////////////////////////////////////////////////////////////////////////////

  toString(): string {
    return urt.buildPath(this.pathParts)
  }

}
