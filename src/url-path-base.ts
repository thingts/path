import type { FilenameBase } from './filename-base'
import { PathBase } from './path-base'
import * as urt from './url-tools'

/**
 * Base class for all URL-style path types.
 * Provides query + anchor handling and immutable join/resolve utilities.
 */
export abstract class UrlPathBase extends PathBase {
  /** Normalized path (inherited contract) */
  protected path_: string
  protected readonly query_: Record<string, string | string[]>
  protected readonly anchor_: string

  constructor(path: string) {
    super()
    const { pathname, query, anchor } = urt.parse(path)
    this.path_   = urt.normalize(pathname)
    this.query_  = query
    this.anchor_ = anchor
  }

  /////////////////////////////////////////////////////////////////////////////
  // --- Accessors ------------------------------------------------------------
  /////////////////////////////////////////////////////////////////////////////

  get pathname(): string { return this.path_ }
  get query(): Record<string, string | string[]> { return { ...this.query_ } }
  get anchor(): string { return this.anchor_ }

  /////////////////////////////////////////////////////////////////////////////
  // --- Mutation-like (immutable) operations ---------------------------------
  /////////////////////////////////////////////////////////////////////////////

  replacePathname(path: string | FilenameBase): this {
    return this.newSelfUrl({ pathname: String(path) })
  }

  replaceQuery(query: Record<string, string | string[]>): this {
    return this.newSelfUrl({ query })
  }

  mergeQuery(query: Record<string, string | string[]>): this {
    const merged: Record<string, string | string[]> = { ...this.query_, ...query }
    return this.newSelfUrl({ query: merged })
  }

  replaceAnchor(anchor: string): this {
    return this.newSelfUrl({ anchor })
  }

  join(...segments: readonly (string | UrlPathBase | null | undefined)[]): this {
    const { pathname, query, anchor } = urt.join({
      pathname: this.pathname,
      query:    this.query,
      anchor:   this.anchor
    }, segments)

    return this.newSelfUrl({ pathname, query, anchor })
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
   * Unlike newSelf() in PathBase, this version accepts optional pathname,
   * query, or anchor; in fact the newSelf() version is implemented in terms of
   * this one.
   */
  protected newSelfUrl(params: { pathname?: string, query?: Record<string, string | string[]>, anchor?: string }): this {
    const ctor = this.constructor as new(path: string) => this
    const { pathname, query, anchor } = params
    const path = urt.buildPath({
      pathname: pathname ?? this.pathname,
      query:    query ?? this.query,
      anchor:   anchor ?? this.anchor
    })
    return new ctor(path)
  }

  override newSelf(pathname: string): this {
    return this.newSelfUrl({ pathname })
  }

  /////////////////////////////////////////////////////////////////////////////
  // --- Stringification ------------------------------------------------------
  /////////////////////////////////////////////////////////////////////////////

  toString(): string {
    const queryString = urt.queryToString(this.query_)
    const frag = this.anchor_ ? `#${this.anchor_}` : ''
    return `${this.path_}${queryString}${frag}`
  }

}
