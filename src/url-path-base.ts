import * as urt from './url-tools'
import type { FilenameBase } from './filename-base'
import type { QueryParams, UrlPathParts } from './url-types'
import { PathBase } from './path-base'

/**
 * Base class for all URL-style path types.
 * Provides query + anchor handling and immutable join/resolve utilities.
 */
export abstract class UrlPathBase extends PathBase {
  protected path_: string
  protected readonly query_?: QueryParams
  protected readonly anchor_?: string

  constructor(path: string) {
    super()
    const { pathname, query, anchor } = urt.parse(path)
    this.path_   = pathname
    this.query_  = query
    this.anchor_ = anchor
  }

  /////////////////////////////////////////////////////////////////////////////
  // --- Accessors ------------------------------------------------------------
  /////////////////////////////////////////////////////////////////////////////

  get pathname(): string { return this.path_ }
  get query():    QueryParams { return { ...this.query_ } }
  get anchor():   string | undefined { return this.anchor_ }

  get #pathParts(): UrlPathParts {
    return {
      pathname: this.path_,
      query:    this.query_,
      anchor:   this.anchor_,
    }
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

  replaceAnchor(anchor: string): this {
    return this.cloneWithParts({ anchor })
  }

  join(...segments: readonly (string | UrlPathBase | null | undefined)[]): this {
    const pathParts = urt.join(this.#pathParts, segments)
    return this.cloneWithParts(pathParts)
  }

  /**
   * Protected helper to construct a new path string, optionally given any of a
   * new pathname, query, or anchor.  Any not provided will default to the
   * current instance's value.
   *
   * Used by all mutation-like methods to build the new path string.
   */
  protected nextPathString(params: Partial<UrlPathParts>): string {
    const { pathname, query, anchor } = params
    return urt.buildPath({
      pathname: pathname ?? this.pathname,
      query:    query ?? this.query,
      anchor:   anchor ?? this.anchor
    })
  }

  /*
   * Protected factory to construct a new instance of the current class,
   * optionally given any of a new pathname, query, or anchor.  Any not
   * provided will default to the current instance's value.
   *
   * Used by all mutation-like methods to return a new instance of the same
   * class, allowing derived classes that inherit those methods to return new
   * instances of themselves without needing to override them.
   *
   * Unlike cloneWithPath() in PathBase, this version accepts optional pathname,
   * query, or anchor; in fact the cloneWithPath() version is implemented in terms of
   * this one, for creating a new instance with just a new pathname.
   */
  protected cloneWithParts(params: Partial<UrlPathParts>): this {
    const ctor = this.constructor as new(path: string) => this
    const path = this.nextPathString(params)
    return new ctor(path)
  }

  override cloneWithPath(pathname: string): this {
    return this.cloneWithParts({ pathname })
  }

  /////////////////////////////////////////////////////////////////////////////
  // --- Stringification ------------------------------------------------------
  /////////////////////////////////////////////////////////////////////////////

  toString(): string {
    return urt.buildPath(this.#pathParts)
  }

}
