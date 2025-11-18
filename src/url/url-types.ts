export type QueryParams = Record<string, string | string[]>

export type UrlPathParts = {
  pathname:  string,
  query:     QueryParams,
  fragment?: string
}
