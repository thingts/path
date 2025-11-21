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
  const slashIndex = s.lastIndexOf('/')

  const hashIndex = s.lastIndexOf('#')
  const fragment = (hashIndex > slashIndex) ? s.slice(hashIndex+1) : undefined
  if (fragment !== undefined) {
    s = s.slice(0, hashIndex)
  }

  const queryIndex = s.lastIndexOf('?')
  const queryStr = (queryIndex > slashIndex) ? s.slice(queryIndex+1) : undefined
  if (queryStr !== undefined) {
    s = s.slice(0, queryIndex)
  }

  return {
    pathname: normalizePathname(s),
    query:    queryStr ? parseQuery(queryStr) : {},
    fragment
  }
}


// Converts a query object back to a query string.
function queryToString(q: QueryParams): string {
  const entries = Object.entries(q).flatMap(([k, v]) =>
    Array.isArray(v) ? v.map(x => [k, x]) : [[k, v]]
  )
  if (!entries.length) return ''
  return '?' + entries.map(([k, v]) => `${normalizeComponent(k)}=${normalizeComponent(v)}`).join('&')
}

export function mergeQueries(base: QueryParams, override: QueryParams): QueryParams {
  const result: QueryParams = { ...base }
  for (const [k, v] of Object.entries(override)) {
    result[k] = (k in result) ? ([] as string[]).concat(result[k], v) : v
  }
  return result
}

function normalizePathname(path: string): string {
  const trailingSlash = path.endsWith('/') && path !== '/'
  const pathNormalized = pth.normalize(path) 
  if (pathNormalized === '.') return ''
  return unDoubleEncode(encodeURI(pathNormalized + (trailingSlash ? '/' : '')).replace(/[?#]/g, encodeURIComponent))
}

function normalizeComponent(s: string): string {
  return unDoubleEncode(encodeURIComponent(s))
}

function unDoubleEncode(s: string): string {
  return s.replace(/%25([0-9a-f]{2})/gi, '%$1')
}

function joinOrResolve(cur: UrlPathParts, segments: readonly (string | null | undefined)[], opts: { mode: 'join' | 'resolve' }): UrlPathParts
function joinOrResolve(cur: UrlPathParts, segments: readonly (string | null | undefined)[], opts: { mode: 'join' | 'resolve', baseOrigin: string}): UrlPathParts & { origin: string }
function joinOrResolve(cur: UrlPathParts, segments: readonly (string | null | undefined)[], opts: { mode: 'join' | 'resolve', baseOrigin?: string}): UrlPathParts & { origin?: string } {
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

export function join(cur: UrlPathParts, segments: readonly (string | null | undefined)[]): UrlPathParts {
  return joinOrResolve(cur, segments, { mode: 'join' })
}

export function resolve(cur: UrlPathParts, segments: readonly (string | null | undefined)[]): UrlPathParts
export function resolve(cur: UrlPathParts, segments: readonly (string | null | undefined)[], opts: { baseOrigin: string}): UrlPathParts & { origin: string }
export function resolve(cur: UrlPathParts, segments: readonly (string | null | undefined)[], opts?: { baseOrigin: string }): UrlPathParts {
  return joinOrResolve(cur, segments, { mode: 'resolve', ...opts })
}

export function buildPath(params: UrlPathParts): string {
  const { pathname, query, fragment } = params
  const fragmentString = fragment === undefined ? '' : '#' + normalizeComponent(stripLeadingHash(fragment))
  const queryString  = queryToString(query)
  return `${pathname}${queryString}${fragmentString}`
}

function stripLeadingHash(s: string): string { return s.startsWith('#') ? s.slice(1) : s }

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
  const { scheme, authority, origin: rawOrigin, path } = m.groups!
  const origin = rawOrigin.toLowerCase()
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
