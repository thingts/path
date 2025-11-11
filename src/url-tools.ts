import * as pathTools from './path-tools'

export function parse(s: string): { pathname: string, query: Record<string, string | string[]>, anchor: string } {
  const match = s.match(/^([^?#]*)?(\?[^#]*)?(#.*)?$/)
  if (!match) {
    return { pathname: s, query: {}, anchor: '' }
  }
  return {
    pathname: match[1] || '',
    query:    match[2] ? parseQuery(match[2]) : {},
    anchor:   match[3] ? match[3].slice(1) : ''
  }
}

export function parseQuery(q: string): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {}
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

// Converts a query object back to a query string.  Canonicalizes by sorting keys.
export function queryToString(q: Record<string, string | string[]>): string {
  const entries = Object.entries(q).flatMap(([k, v]) =>
    Array.isArray(v) ? v.map(x => [k, x]) : [[k, v]]
  )
  entries.sort((a, b) => a[0].localeCompare(b[0]))
  if (!entries.length) return ''
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
}

export function normalize(path: string): string {
  return pathTools.normalize(path)
}

export function join(cur: { pathname: string, query: Record<string, string | string[]>, anchor: string }, segments: readonly ({ toString: () => string } | null | undefined)[]): { pathname: string, query: Record<string, string | string[]>, anchor: string } {
  let path = cur.pathname
  let query = { ...cur.query }
  let anchor = cur.anchor
  for (const s of segments) {
    if (!s) continue
    const { pathname, query: relQuery, anchor: a } = parse(s.toString())
    path = [removeTrailingSlash(path), removeLeadingSlash(pathname)].filter(Boolean).join('/')
    query = { ...query, ...relQuery }
    if (a) anchor = a
  }
  return { pathname: path, query, anchor }
}

export function buildPath(params: { pathname: string, query: Record<string, string | string[]>, anchor: string }): string {
  const { pathname, query, anchor } = params
  const anchorString = anchor ? ensureLeadingHash(anchor) : ''
  const queryString = queryToString(query)
  return `${pathname}${queryString}${anchorString}`
}

export function validatePath(s: string): void {
  try {
    new URL(s, 'http://example.com')
  } catch {
    throw new Error(`Invalid URL path: ${s}`)
  }
}

export function newURL(s: string): URL {
  try {
    return new URL(s)
  } catch {
    throw new Error(`Invalid URL: ${s}`)
  }
}

function ensureLeadingHash(s: string): string { return s.startsWith('#') ? s : `#${s}` }
function removeTrailingSlash(s: string): string { return s.endsWith('/') ? s.slice(0, -1) : s }
function removeLeadingSlash(s: string): string { return s.startsWith('/') ? s.slice(1) : s }
