export type UrlQueryParams = Record<string, string | string[]>

export type UrlPathParts = {
  pathname:  string,
  query?:    UrlQueryParams,
  fragment?: string
}

export const RemovePart = Symbol('url-base.RemovePart')

type Override<T, R> = Omit<T, keyof R> & R

export type RemovablePathParts = Override<UrlPathParts, { fragment: string | typeof RemovePart, query: UrlQueryParams | typeof RemovePart }>

export function isUrlPathParts(obj: unknown): obj is UrlPathParts {
  if (typeof obj !== 'object' || obj === null) {
    return false
  }
  if (obj instanceof URL) { return false } // don't be fooled!  looks similar but has different semantics
  const cast = obj as UrlPathParts
  if (typeof cast.pathname !== 'string') { return false }
  if (cast.query !== undefined && typeof cast.query !== 'object') { return false }
  if (cast.fragment !== undefined && typeof cast.fragment !== 'string') { return false }
  return true
}

export type UrlFullParts = UrlPathParts & { origin: string }
export type RemovableFullParts = RemovablePathParts & { origin: string }

export function isUrlFullParts(obj: unknown): obj is UrlFullParts {
  if (!isUrlPathParts(obj)) {
    return false
  } 
  const cast = obj as UrlFullParts
  if (typeof cast.origin !== 'string') { return false }
  return true
}
