import type { UrlFullParts, UrlPathParts, UrlQueryParams } from '../url'
import { pth } from '../tools'

function parseQuery(q: string): UrlQueryParams {
  const result: UrlQueryParams = {}
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
  let remainder = s.slice(slashIndex+1)

  const hashIndex = remainder.indexOf('#')
  const fragment = (hashIndex == -1) ? undefined : remainder.slice(hashIndex+1)
  if (fragment !== undefined) {
    remainder = remainder.slice(0, hashIndex)
  }

  const queryIndex = remainder.indexOf('?')
  const queryStr = (queryIndex == -1) ? undefined : remainder.slice(queryIndex+1)
  if (queryStr !== undefined) {
    remainder = remainder.slice(0, queryIndex)
  }

  return {
    pathname: normalizePathname(s.slice(0, slashIndex + 1) + remainder),
    query:    (queryStr === undefined) ? undefined : parseQuery(queryStr),
    fragment,
  }
}


// Converts a query object back to a query string.
function queryToString(q?: UrlQueryParams): string {
  if (!q) return ''
  const entries = Object.entries(q).flatMap(([k, v]) =>
    Array.isArray(v) ? v.map(x => [k, x]) : [[k, v]]
  )
  return '?' + entries.map(([k, v]) => `${encodeComponent(k)}=${encodeComponent(v)}`).join('&')
}

function fragmentToString(f: string | undefined): string {
  return f === undefined ? '' : `#${encodeComponent(f)}`
}

export function mergeQueries(base: UrlQueryParams, override: UrlQueryParams): UrlQueryParams {
  const result: UrlQueryParams = { ...base }
  for (const [k, v] of Object.entries(override)) {
    result[k] = (k in result) ? ([] as string[]).concat(result[k], v) : v
  }
  return result
}

export function normalizePathname(path: string): string {
  const trailingSlash = path.endsWith('/') && path !== '/'
  const pathNormalized = pth.normalize(path) 
  return pathNormalized === '' ? '.' : pathNormalized + (trailingSlash ? '/' : '')
}

function encodeComponent(s: string): string {
  return unDoubleEncode(encodeURIComponent(s))
}

function encodePathname(s: string): string {
  return unDoubleEncode(encodeURI(s).replace(/[?#]/g, encodeURIComponent))
}

function unDoubleEncode(s: string): string {
  return s.replace(/%25([0-9a-f]{2})/gi, '%$1')
}

function joinOrResolve(cur: UrlPathParts, segments: readonly (string | null | undefined)[], opts: { mode: 'join' | 'resolve' }): UrlPathParts
function joinOrResolve(cur: UrlFullParts, segments: readonly (string | null | undefined)[], opts: { mode: 'join' | 'resolve' }): UrlFullParts
function joinOrResolve(cur: UrlPathParts | UrlFullParts, segments: readonly (string | null | undefined)[], opts: { mode: 'join' | 'resolve' }): UrlPathParts | UrlFullParts {
  const { mode } = opts
  const baseOrigin = 'origin' in cur ? cur.origin : undefined
  const isResolve = mode === 'resolve'
  const detectOrigin = isResolve && (baseOrigin !== undefined)
  let origin   = baseOrigin
  let pathname = cur.pathname
  let query    = cur.query &&  { ...cur.query }
  let fragment   = cur.fragment
  for (let str of segments) {

    if (!str) { continue }

    const analyzed = analyzeUrl(str)
    if (isResolve && detectOrigin) {
      const { kind } = analyzed
      switch (kind) {
        case 'opaque':
        case 'invalid-origin': {
          throw urlParseError(analyzed, str)
        }
        case 'hierarchical': {
          const { origin: segOrigin, path: segPath } = analyzed
          origin = segOrigin
          str    = segPath
          break
        }
      }
    }
    const { pathname: relPathname, query: relQuery, fragment: relFragment } = parsePath(str)

    if (isResolve && relPathname.startsWith('/')) {
      pathname = relPathname
      query = { ...relQuery }
      fragment = relFragment
      continue
    }
    pathname = `${pathname}/${relPathname}`
    if (relQuery) { query = { ...query, ...relQuery } }
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

export function partsToString(params: UrlPathParts): string {
  const { pathname, query, fragment } = params
  return `${encodePathname(pathname)}${queryToString(query)}${fragmentToString(fragment)}`
}

export function stripLeadingHash(s: string): string { return s.startsWith('#') ? s.slice(1) : s }

const hierarchicalSchemes = new Set(['http:', 'https:', 'ftp:', 'ftps:', 'ws:', 'wss:', 'file:'])

const HierarchicalUrlRe = /^(?<origin>(?<scheme>[a-zA-Z][a-zA-Z0-9+\-.]*:)?\/\/(?<authority>[^/?#]*))(?<path>.*)$/
const OpaqueUrlRe      = /^[a-zA-Z][a-zA-Z0-9+\-.]*:/

type UrlAnalyzeResult = { kind: 'invalid' } | { kind: 'opaque' } | { kind: 'hierarchical', origin: string, path: string } | { kind: 'invalid-origin', origin: string }

export function analyzeUrl(s: string): UrlAnalyzeResult {
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

export function parseFullUrl(s: string): UrlFullParts {
  const analyzeResult = analyzeUrl(s)
  switch (analyzeResult.kind) {
    case 'hierarchical': {
      const { origin, path } = analyzeResult
      const pathParts = parsePath(path)
      return {
        origin,
        ...pathParts,
      }
    }
    case 'opaque':
    case 'invalid-origin':
    case 'invalid':
    default:
      throw urlParseError(analyzeResult, s)
  }
}

export function urlParseError(analyzeResult: UrlAnalyzeResult, s: string): Error {
  switch (analyzeResult.kind) {
    case 'opaque':
      return new Error(`URL is non-hierarchical: ${s}`)
    case 'invalid-origin':
      return new Error(`Invalid origin '${analyzeResult.origin}' in URL: ${s}`)
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
