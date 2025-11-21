// A minimal implementation of Node.js path module for non-node
// environments.  
import { PATH_SEPARATOR } from '../core'

export const sep = PATH_SEPARATOR

export function dirname(p: string): string {
  if (p.length === 0) { return '.' }

  // Strip trailing slashes (but not if the entire string is '/')
  while (p.length > 1 && p.endsWith(PATH_SEPARATOR)) {
    p = p.slice(0, -1)
  }

  const idx = p.lastIndexOf(PATH_SEPARATOR)

  if (idx === -1) return '.'        // No slash = current directory
  if (idx === 0)  return PATH_SEPARATOR  // Slash is at the start = root
  return p.slice(0, idx)
}


function joinOrResolve(segments: readonly (string | null | undefined)[], mode: 'join' | 'resolve' ): string {
  const filtered = segments.filter((s): s is string => !!s)
  const resolvedParts: string[] = []

  let firstSegment = segments[0]

  for (let i = filtered.length - 1; i >= 0; i--) {
    const segment = filtered[i]
    resolvedParts.unshift(...segment.split(PATH_SEPARATOR))
    if (mode === 'resolve' && segment.startsWith(PATH_SEPARATOR)) {
      firstSegment = segment
      break
    }
  }

  return (firstSegment?.startsWith(PATH_SEPARATOR) ? PATH_SEPARATOR : '') + normalizeSegments(resolvedParts)
}

function normalizeSegments(segments: readonly string[]): string {
  const normalized: string[] = []
  for (const segment of segments) {
    if (!segment || segment === '.') continue
    if (segment === '..' && normalized.length > 0 && normalized.at(-1) !== '..') {
      normalized.pop()
    } else {
      normalized.push(segment)
    }
  }
  return normalized.join(PATH_SEPARATOR)
}


// Like node:path.resolve(), except that it does not use process.cwd() as a
// base, it only resolves the given segments.
//
export function resolve(...segments: readonly (string | null | undefined)[]): string {
  return joinOrResolve(segments, 'resolve')
}

export function join(...segments: readonly (string | null | undefined)[]): string {
  return joinOrResolve(segments, 'join')
}


// Like node:path.normalize(), with these additional canonicalization features:
//
// * preserve leading '/' if present
// * remove leading './'
// * remove trailing '/' unless the path is root '/'
// * Empty path is normalized to '.'
//
export function normalize(p: string): string {
  const leadingDot = '.' + PATH_SEPARATOR
  let normalized = normalizeSegments(p.split(PATH_SEPARATOR))
  if (isAbsolute(p)) { normalized = PATH_SEPARATOR + normalized }
  if (normalized.startsWith(leadingDot)) { normalized = normalized.slice(leadingDot.length) }
  if (normalized === PATH_SEPARATOR) { return normalized } // root
  if (normalized.endsWith(PATH_SEPARATOR)) { normalized = normalized.slice(0, -PATH_SEPARATOR.length) }
  if (normalized === '') { normalized = '.' }
  return normalized
}


export function relative(from: string, to: string): string {
  const fromParts = resolve(from).split(PATH_SEPARATOR).filter(Boolean)
  const toParts   = resolve(to).split(PATH_SEPARATOR).filter(Boolean)

  // Find common path prefix
  let i = 0
  while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) {
    i++
  }

  const upLevels = fromParts.length - i
  const downParts = toParts.slice(i)

  return [
    ...Array(upLevels).fill('..') as string[],
    ...downParts
  ].join('/') || '.'
}

export function descendsFrom(ancestor: string, target: string, opts?: { includeSelf?: boolean }): boolean {
  const { includeSelf = false } = opts ?? {}
  const relativePath = relative(ancestor, target)
  if (relativePath === '.' ) {
    return includeSelf
  }
  return !relativePath.startsWith('..')
}

export function isAbsolute(p: string): boolean {
  return p.startsWith(PATH_SEPARATOR)
}

export function conformAbsolute(p: string, absolute: boolean): string {
  const isAbs = isAbsolute(p)
  if (absolute) {
    return isAbs ? p : PATH_SEPARATOR + p
  } else {
    return isAbs ? p.replace(/^\/+/, '') : p
  }
}
