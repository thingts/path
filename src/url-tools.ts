import * as pathTools from './path-tools'
import type { QueryParams, UrlPathParts } from './url-types'

export function parseQuery(q: string): QueryParams {
  const result: QueryParams = {}
  const str = q.startsWith('?') ? q.slice(1) : q
  for (const pair of str.split('&')) {
    if (!pair) continue
    const [k, v = ''] = pair.split('=', 2)
    const key = decodeURIComponent(k)
    const val = decodeURIComponent(v)
    if (result[key]) {
      const prev = result[key]
      result[key] = Array.isArray(prev) ? [...prev, val] : [prev, val]
    } else {
      result[key] = val
    }
  }
  return result
}

export function parse(s: string): UrlPathParts {
  const endify       = (x: number): number => (x === -1) ? s.length : x
  const hashIndex    = endify(s.lastIndexOf('#'))
  const queryIndex   = endify(s.lastIndexOf('?'))
  const anchorIndex  = (queryIndex === s.length || queryIndex < hashIndex) ? hashIndex : s.length
  const pathEndIndex = Math.min(anchorIndex, queryIndex)

  const pathname = s.slice(0, pathEndIndex)
  const queryStr = queryIndex < anchorIndex ? s.slice(queryIndex + 1, anchorIndex) : undefined
  const anchor = anchorIndex < s.length-1 ? s.slice(anchorIndex + 1) : undefined
  return {
    pathname: normalizePathname(pathname),
    query: queryStr ? parseQuery(queryStr) : undefined,
    anchor
  }
}


// Converts a query object back to a query string.  Canonicalizes by sorting keys.
export function queryToString(q: QueryParams): string {
  const entries = Object.entries(q).flatMap(([k, v]) =>
    Array.isArray(v) ? v.map(x => [k, x]) : [[k, v]]
  )
  entries.sort((a, b) => a[0].localeCompare(b[0]))
  if (!entries.length) return ''
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
}

export function normalizePathname(path: string): string {
  const pathNormalized = pathTools.normalize(path)
  if (pathNormalized === '.') return ''
  return(encodeURI(pathNormalized).replace(/[?#]/g, encodeURIComponent)).replace(/%25/g, '%') // double-encoded % -> single-encoded
}

export function joinOrResolve(cur: UrlPathParts, segments: readonly ({ toString: () => string } | null | undefined)[], opts: { mode: 'join' | 'resolve' }): UrlPathParts
export function joinOrResolve(cur: UrlPathParts, segments: readonly ({ toString: () => string } | null | undefined)[], opts: { mode: 'join' | 'resolve', baseOrigin: string}): UrlPathParts & { origin: string }
export function joinOrResolve(cur: UrlPathParts, segments: readonly ({ toString: () => string } | null | undefined)[], opts: { mode: 'join' | 'resolve', baseOrigin?: string}): UrlPathParts & { origin?: string } {
  const { mode, baseOrigin } = opts
  const isResolve = mode === 'resolve'
  const detectOrigin = isResolve && (baseOrigin !== undefined)
  let origin   = baseOrigin
  let pathname = cur.pathname
  let query    = { ...cur.query }
  let anchor   = cur.anchor
  for (const s of segments) {
    let relOrigin: string | undefined = undefined

    if (!s) { continue }
    let str = s.toString()

    const isHierarchical = isHierarchicalUrl(str)
    const isNonHierarchical = isNonHierarchicalUrl(str)
    if (isHierarchical && detectOrigin) {
      const u   = new URL(str)
      str       = u.href.slice(u.origin.length)
      relOrigin = u.origin
    }
    const { pathname: relPathname, query: relQuery, anchor: relAnchor } = parse(str)

    if (isResolve) {
      if (detectOrigin && isNonHierarchical) {
        throw new Error(`Cannot resolve non-hierarchical URL: ${str}`)
      }
      if (relOrigin || relPathname.startsWith('/')) {
        origin = relOrigin ?? origin
        pathname = relPathname
        query = { ...relQuery }
        anchor = relAnchor
        continue
      }
    }
    pathname = `${pathname}/${relPathname}`
    query = { ...query, ...relQuery }
    if (relAnchor) { anchor = relAnchor }
  }
  return { origin, pathname: normalizePathname(pathname), query, anchor }

}


export function buildPath(params: UrlPathParts): string {
  const { pathname, query, anchor } = params
  const anchorString = anchor ? ensureLeadingHash(anchor) : ''
  const queryString  = query  ? queryToString(query)      : ''
  return `${pathname}${queryString}${anchorString}`
}

export function newURL(s: string): URL {
  try {
    return new URL(s)
  } catch {
    throw new Error(`Invalid URL: ${s}`)
  }
}

function ensureLeadingHash(s: string): string { return s.startsWith('#') ? s : `#${s}` }

const hierarchicalSchemas = new Set([ 'http:', 'https:', 'ftp:', 'ftps:', 'ws:', 'wss:', 'file:' ])

function getSchema(s: string): string | null {
  try {
    const u = new URL(s + '/x') // append dummy path to avoid errors on origin-only strings
    return u.protocol
  } catch {
    return null
  }
}

export function isHierarchicalUrl(s: string): boolean {
  if (s.startsWith('//')) {
    return true
  }
  const schema = getSchema(s)
  return schema != null && hierarchicalSchemas.has(schema)
}

export function isNonHierarchicalUrl(s: string): boolean {
  const schema = getSchema(s)
  return schema != null && !hierarchicalSchemas.has(schema)
}
