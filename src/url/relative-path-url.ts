import type { RelativePath } from '../path'
import type { UrlPathParts } from './url-types'
import { UrlBase } from './url-base'
import { isUrlPathParts } from './url-types'
import { urt } from '../tools'

type Joinable = RelativePathUrl | RelativePath

/**
 * A URL instance with a relative pathname, i.e. the pathname does not start with '/'
 *
 * Analogous to {@link RelativePath}, but for URLs; i.e. it may have query
 * parameters and a fragment, and has methods to work with them.
 *
 * RelativePathUrls can be joined with other RelativePathUrls or onto
 * {@link RootPathUrl}s or {@link FullPathUrl}s to form complete URLs
 * (see {@link join `join()`}).
 *
 * {@include ./doc-normalization.md}
 *
 * {@include ./doc-encoding.md}
 *
 * @example
 * ```ts
 * const url1 = new RelativePathUrl('foo/bar/baz.txt?query=1#frag')
 * const url2 = new RelativePathUrl({
 *   pathname: 'foo/bar/baz.txt',
 *   query: { query: '1' },
 *   fragment: 'frag'
 * })
 * url1.equals(url2) // → true
 * ```
 */
export class RelativePathUrl extends UrlBase<Joinable> {
  /**
   * Creates a new RelativePathUrl instance from the given string or parts.
   *
   * @throws Throws an error if the given pathname is absolute (starts with
   * a '/')
   *
   * @example
   * ```ts
   * const url1 = new FullPathUrl('https://example.com:8080/foo/bar/baz.txt?query=1#frag')
   * const url2 = new FullPathUrl({
   *   origin: 'https://example.com:8080',
   *   pathname: '/foo/bar/baz.txt',
   *   query: { query: '1' },
   *   fragment: 'frag'
   * })
   * ```
   */
  constructor(url: string | RelativePathUrl | RelativePath | UrlPathParts) {
    const parts = (url instanceof RelativePathUrl) ? url.parts : isUrlPathParts(url) ? url : urt.parsePath(String(url))
    if (!RelativePathUrl.isRelativePathUrlString(parts.pathname)) {
      throw new Error(`RelativePathUrl must not start with '/': ${parts.pathname}`)
    }
    super(parts)
  }

  static isRelativePathUrlString(s: string): boolean {
    return !s.startsWith('/')
  }
}
