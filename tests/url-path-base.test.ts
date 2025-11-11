import { describe, it, expect } from 'vitest'
import { UrlPathBase } from '../src/url-path-base'

class TestUrlPath extends UrlPathBase {
}

describe('UrlPathBase', () => {
  describe('constructor', () => {
    it('normalizes paths slashes', () => {
      const u = new TestUrlPath('/foo//bad/../bar////baz')
      expect(u.pathname).toBe('/foo/bar/baz')
    })

    it('stores and exposes query and anchor cleanly', () => {
      const u = new TestUrlPath('/a?a=1&b=x&b=y#frag')
      expect(u.query).toEqual({ a: '1', b: ['x', 'y'] })
      expect(u.anchor).toBe('frag')
    })
  })

  it('toString yields normalized URL string', () => {
    const u = new TestUrlPath('../foo//bar?b=x&a=1&b=y#frag')
    expect(String(u)).toBe('../foo/bar?a=1&b=x&b=y#frag')
  })

  it('replaceQuery replaces entire query', () => {
    const u = new TestUrlPath('/foo?a=1')
    const v = u.replaceQuery({ b: '2' })
    expect(v.query).toEqual({ b: '2' })
    expect(String(v)).toBe('/foo?b=2')
  })

  it('mergeQuery merges keys', () => {
    const u = new TestUrlPath('/foo').replaceQuery({ a: '1', b: 'x' })
    const v = u.mergeQuery({ b: '2', c: '3' })
    expect(v.query).toEqual({ a: '1', b: '2', c: '3' })
    expect(String(v)).toBe('/foo?a=1&b=2&c=3')
  })

  it('replaceAnchor strips leading #', () => {
    const u = new TestUrlPath('/foo#a')
    const v = u.replaceAnchor('#b')
    expect(v.anchor).toBe('b')
    expect(String(v)).toBe('/foo#b')
  })
})

