import type { FilenameOps } from '../core'
import { FullPathUrl } from './full-path-url'
import { RelativePathUrl } from './relative-path-url'
import { RootPathUrl } from './root-path-url'
import { UrlBase } from './url-base'
import { urt } from '../tools'

/**
 * Generic constructor for URL path objects.
 *
 * Returns a {@link FullPathUrl}, {@link RootPathUrl}, or {@link RelativePathUrl}
 * depending on the input string.
 *
 * @example
 * ```
 * pathUrl('https://x.com/foo') → FullPathUrl
 * pathUrl('/foo/bar')          → RootPathUrl
 * pathUrl('foo/bar')           → RelativePathUrl
 * ```
 */
export function pathUrl(path: string | URL | FilenameOps | UrlBase<unknown>): FullPathUrl | RootPathUrl | RelativePathUrl {

  if (path instanceof UrlBase) {
    return path
  }

  if (path instanceof URL) {
    return pathUrl(path.href)
  }

  const s = String(path)

  const analyzed = urt.analyzeUrl(s)

  if (analyzed.kind !== 'invalid') {
    return new FullPathUrl(s)
  }

  if (RootPathUrl.isRootPathUrlString(s)) {
    return new RootPathUrl(s)
  }

  if (RelativePathUrl.isRelativePathUrlString(s)) {
    return new RelativePathUrl(s)
  }

  // Should never happen
  throw new Error(`Cannot determine URL path type: ${s}`)
}
