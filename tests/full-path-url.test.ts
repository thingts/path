import { describe, it, expect } from 'vitest'
import { FullPathUrl } from '$src'


describe('FullPathUrl', () => {
  it('parses and exposes origin, pathname, query, anchor', () => {
    const u = new FullPathUrl('https://x.com/foo/bar?a=1#frag')
    expect(u.origin).toBe('https://x.com')
    expect(u.pathname).toBe('/foo/bar')
    expect(u.query).toEqual({ a: '1' })
    expect(u.anchor).toBe('frag')
  })

  it('throws on invalid URL', () => {
    expect(() => new FullPathUrl('not-a-url')).toThrow(/Invalid URL.*not-a-url/)
    expect(() => new FullPathUrl('http://badc[aracter.com')).toThrow(/Invalid URL/)
  })

  it('join() merges query params and replaces anchor', () => {
    const u = new FullPathUrl('https://x.com/foo?a=a1&b=b1#old')
    const v = u.join('bar?b=b2&c=c2#new')
    expect(v.toString()).toBe('https://x.com/foo/bar?a=a1&b=b2&c=c2#new')
  })

  describe('resolve()', () => {

    it('appends relative paths', () => {
      const u = new FullPathUrl('https://x.com/a/b?x=1#x')
      const v = u.resolve('c/d?y=2#y')
      expect(v.href).toBe('https://x.com/a/b/c/d?x=1&y=2#y')
    })

    it('resets on rooted paths', () => {
      const u = new FullPathUrl('https://x.com/a/b?x=1#x')
      const v = u.resolve('/reset?y=2#y')
      expect(v.href).toBe('https://x.com/reset?y=2#y')
    })

    it('resets everything on new host', () => {
      const u = new FullPathUrl('https://a.com/a/b?x=1#x')
      const v = u.resolve('https://b.com/c?y=2#z')
      expect(v.href).toBe('https://b.com/c?y=2#z')
    })
  })

  it('replaceOrigin replaces the base host', () => {
    const u = new FullPathUrl('https://a.com/foo')
    const v = u.replaceOrigin('https://b.com')
    expect(v.origin).toBe('https://b.com')
    expect(v.href).toBe('https://b.com/foo')
  })
})

