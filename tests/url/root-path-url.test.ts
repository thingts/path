import { describe, it, expect } from 'vitest'
import { RootPathUrl } from '$src'
import { urlBasicTests } from './url-basic.shared-tests'

describe('RootPathUrl', () => {
  urlBasicTests({ make: s => new RootPathUrl(s), kind: 'root' })

  describe('constructor', () => {
    it('requires leading slash', () => {
      expect(() => new RootPathUrl('foo')).toThrow()
      expect(() => new RootPathUrl('/foo')).not.toThrow()
    })

  })

  describe('resolve()', () => {
    it('appends relative path', () => {
      const u = new RootPathUrl('/foo/bar?a=1#old')
      const v = u.resolve('baz?b=2#new')
      expect(String(v)).toBe('/foo/bar/baz?a=1&b=2#new')
    })

    it('resets on rooted path', () => {
      const u = new RootPathUrl('/foo/bar?a=1#old')
      const v = u.resolve('/reset?b=2#new')
      expect(String(v)).toBe('/reset?b=2#new')
    })
  })
})

