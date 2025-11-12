import * as urt from './url-tools'
import type { FilenameBase } from './filename-base'
import { HostUrlPath } from './host-url-path'
import { RelativeUrlPath } from './relative-url-path'
import { RootUrlPath } from './root-url-path'

/**
 * Generic constructor for URL path objects.
 *
 * Returns a {@link HostUrlPath}, {@link RootUrlPath}, or {@link RelativeUrlPath}
 * depending on the input string.
 *
 * @example
 * ```
 * urlPath('https://x.com/foo') → HostUrlPath
 * urlPath('/foo/bar')          → RootUrlPath
 * urlPath('foo/bar')           → RelativeUrlPath
 * ```
 */
export function urlPath(path: string | FilenameBase): HostUrlPath | RootUrlPath | RelativeUrlPath {

  const s = String(path)

  if (HostUrlPath.isHostUrlPathString(s)) {
    return new HostUrlPath(s)
  }

  if (urt.isNonHierarchicalUrl(s)) {
    throw new Error(`Cannot create path URL from non-hierarchical URL: ${s}`)
  }

  if (RootUrlPath.isRootUrlPathString(s)) {
    return new RootUrlPath(s)
  }

  if (RelativeUrlPath.isRelativeUrlPathString(s)) {
    return new RelativeUrlPath(s)
  }

  // Should never happen
  throw new Error(`Cannot determine URL path type: ${s}`)
}
