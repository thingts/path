import * as urt from './url-tools'
import type { FilenameBase } from './filename-base'
import { FullPathUrl } from './full-path-url'
import { RelativePathUrl } from './relative-path-url'
import { RootPathUrl } from './root-path-url'
import { UrlBase } from './url-base'

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
export function pathUrl(path: string | FilenameBase | UrlBase): FullPathUrl | RootPathUrl | RelativePathUrl {

  if (path instanceof UrlBase) {
    return path
  }

  const s = String(path)

  if (FullPathUrl.isFullPathUrlString(s)) {
    return new FullPathUrl(s)
  }

  if (urt.isNonHierarchicalUrl(s)) {
    throw new Error(`Cannot create path URL from non-hierarchical URL: ${s}`)
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
