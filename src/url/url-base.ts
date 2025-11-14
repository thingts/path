import type { FilenameBase } from '../core'
import type { QueryParams, UrlPathParts } from './url-types'
import { PathBase } from '../path/path-base'
import { urt } from '../tools'

/**
 * Base class for all URL-style path types.
 * Provides query + fragment handling and immutable join/resolve utilities.
 */
export abstract class UrlBase extends PathBase {
  protected path_: string
  protected readonly query_?: QueryParams
  protected readonly fragment_?: string

  constructor(path: string) {
    super()
    const { pathname, query, fragment } = urt.parse(path)
    this.path_   = pathname
    this.query_  = query
    this.fragment_ = fragment
  }

  /////////////////////////////////////////////////////////////////////////////
  // --- Accessors ------------------------------------------------------------
  /////////////////////////////////////////////////////////////////////////////

  get pathname(): string { return this.path_ }
  get query():    QueryParams { return { ...this.query_ } }
  get fragment(): string | undefined { return this.fragment_ }

  protected get pathParts(): UrlPathParts {
    return {
      pathname: this.path_,
      query:    this.query_,
      fragment:   this.fragment_,
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

  replaceFragment(fragment: string): this {
    return this.cloneWithParts({ fragment })
  }

  join(...segments: readonly (string | UrlBase | null | undefined)[]): this {
    const pathParts = urt.joinOrResolve(this.pathParts, segments, { mode: 'join' })
    return this.cloneWithParts(pathParts)
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
      pathname: pathname ?? this.path_,
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
   *
   * Unlike cloneWithPath() in PathBase, this version accepts optional pathname,
   * query, or fragment; in fact the cloneWithPath() version is implemented in terms of
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
    return urt.buildPath(this.pathParts)
  }

}
