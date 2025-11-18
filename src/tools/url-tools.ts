import type { QueryParams, UrlPathParts } from '../url'
import { pth } from '../tools'

function parseQuery(q: string): QueryParams {
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

export function parsePath(s: string): UrlPathParts {
  const endify       = (x: number): number => (x === -1) ? s.length : x
  const hashIndex    = endify(s.lastIndexOf('#'))
  const queryIndex   = endify(s.lastIndexOf('?'))
  const fragmentIndex  = (queryIndex === s.length || queryIndex < hashIndex) ? hashIndex : s.length
  const pathEndIndex = Math.min(fragmentIndex, queryIndex)

  const pathname = s.slice(0, pathEndIndex)
  const queryStr = queryIndex < fragmentIndex ? s.slice(queryIndex + 1, fragmentIndex) : undefined
  const fragment = fragmentIndex < s.length-1 ? s.slice(fragmentIndex + 1) : undefined
  return {
    pathname: normalizePathname(pathname),
    query:    queryStr ? parseQuery(queryStr) : {},
    fragment
  }
}


// Converts a query object back to a query string.  Canonicalizes by sorting keys.
function queryToString(q: QueryParams): string {
  const entries = Object.entries(q).flatMap(([k, v]) =>
    Array.isArray(v) ? v.map(x => [k, x]) : [[k, v]]
  )
  entries.sort((a, b) => a[0].localeCompare(b[0]))
  if (!entries.length) return ''
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
}

function normalizePathname(path: string): string {
  const pathNormalized = pth.normalize(path)
  if (pathNormalized === '.') return ''
  return(encodeURI(pathNormalized).replace(/[?#]/g, encodeURIComponent)).replace(/%25/g, '%') // double-encoded % -> single-encoded
}

export function joinOrResolve(cur: UrlPathParts, segments: readonly (string | null | undefined)[], opts: { mode: 'join' | 'resolve' }): UrlPathParts
export function joinOrResolve(cur: UrlPathParts, segments: readonly (string | null | undefined)[], opts: { mode: 'join' | 'resolve', baseOrigin: string}): UrlPathParts & { origin: string }
export function joinOrResolve(cur: UrlPathParts, segments: readonly (string | null | undefined)[], opts: { mode: 'join' | 'resolve', baseOrigin?: string}): UrlPathParts & { origin?: string } {
  const { mode, baseOrigin } = opts
  const isResolve = mode === 'resolve'
  const detectOrigin = isResolve && (baseOrigin !== undefined)
  let origin   = baseOrigin
  let pathname = cur.pathname
  let query    = { ...cur.query }
  let fragment   = cur.fragment
  for (let str of segments) {

    if (!str) { continue }

    const parsed = parseUrl(str)
    if (isResolve && detectOrigin) {
      const { kind } = parsed
      switch (kind) {
        case 'opaque':
        case 'invalid-origin': {
          throw urlParseError(parsed, str)
        }
        case 'hierarchical': {
          const { origin: segOrigin, path: segPath } = parsed
          origin = segOrigin
          str    = segPath
          break
        }
      }
    }
    const { pathname: relPathname, query: relQuery, fragment: relFragment } = parsePath(str)

    if (isResolve) {
      if (relPathname.startsWith('/')) {
        pathname = relPathname
        query = { ...relQuery }
        fragment = relFragment
        continue
      }
    }
    pathname = `${pathname}/${relPathname}`
    query = { ...query, ...relQuery }
    if (relFragment) { fragment = relFragment }
  }
  return { origin, pathname: normalizePathname(pathname), query, fragment }

}

export function buildPath(params: UrlPathParts): string {
  const { pathname, query, fragment } = params
  const fragmentString = fragment ? ensureLeadingHash(fragment) : ''
  const queryString  = queryToString(query)
  return `${pathname}${queryString}${fragmentString}`
}

function ensureLeadingHash(s: string): string { return s.startsWith('#') ? s : `#${s}` }

const hierarchicalSchemes = new Set(['http:', 'https:', 'ftp:', 'ftps:', 'ws:', 'wss:', 'file:'])

const HierarchicalUrlRe = /^(?<origin>(?<scheme>[a-zA-Z][a-zA-Z0-9+\-.]*:)?\/\/(?<authority>[^/?#]*))(?<path>.*)$/
const OpaqueUrlRe      = /^[a-zA-Z][a-zA-Z0-9+\-.]*:/

type UrlParseResult = { kind: 'invalid' } | { kind: 'opaque' } | { kind: 'hierarchical', origin: string, path: string } | { kind: 'invalid-origin', origin: string }

export function parseUrl(s: string): UrlParseResult {
  const m = s.match(HierarchicalUrlRe)
  if (!m) {
    return {
      kind: s.match(OpaqueUrlRe) ? 'opaque' : 'invalid',
    }
  }
  const { scheme, authority, origin, path } = m.groups!
  if (!isValidOrigin({ scheme, authority })) {
    return {
      kind: 'invalid-origin',
      origin,
    }
  }
  if (scheme && !hierarchicalSchemes.has(scheme.toLowerCase())) {
    return {
      kind: 'opaque',
    }
  }
  return {
    kind: 'hierarchical',
    origin,
    path,
  }
}

export function urlParseError(parseResult: UrlParseResult, s: string): Error {
  switch (parseResult.kind) {
    case 'opaque':
      return new Error(`URL is non-hierarchical: ${s}`)
    case 'invalid-origin':
      return new Error(`Invalid origin '${parseResult.origin}' in URL: ${s}`)
    case 'invalid':
    default:
      return new Error(`Invalid URL: ${s}`)
  }
}

function isValidOrigin(params: { scheme?: string, authority: string }): boolean {
  const { scheme, authority } = params
  try {
    new URL(`${scheme || 'http:'}//${authority}/`)
    return true
  } catch {
    return false
  }
}
