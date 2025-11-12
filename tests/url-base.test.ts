import { describe, it, expect } from 'vitest'
import { UrlBase } from '../src/url-base'

class TestUrlPath extends UrlBase {
}

describe('UrlBase', () => {
  describe('constructor', () => {
    it('normalizes path slashes', () => {
      const u = new TestUrlPath('/foo//bad/../bar////./baz')
      expect(u.pathname).toBe('/foo/bar/baz')
    })

    it('percent-encodes special characters', () => {
      const u = new TestUrlPath('/a b/c#d?e=f&g=h')
      expect(u.pathname).toBe('/a%20b/c%23d')
      expect(String(u)).toBe('/a%20b/c%23d?e=f&g=h')
    })

    it('stores and exposes query and anchor cleanly', () => {
      const u = new TestUrlPath('/a?a=1&b=x&b=y#frag')
      expect(u.query).toEqual({ a: '1', b: ['x', 'y'] })
      expect(u.anchor).toBe('frag')
    })

    describe('edge cases', () => {
      it('handles anchor without query', () => {
        const u = new TestUrlPath('/a#frag')
        expect(u.query).toEqual({})
        expect(u.anchor).toBe('frag')
      })

      it('handles query without anchor', () => {
        const u = new TestUrlPath('/a?b=2')
        expect(u.query).toEqual({ b: '2' })
        expect(u.anchor).toBe(undefined)
      })

      describe('with root', () => {
        it('handles no modifiers', () => {
          const u = new TestUrlPath('/')
          expect(u.pathname).toBe('/')
          expect(u.query).toEqual({})
          expect(u.anchor).toBe(undefined)
        })

        it('handles query and anchor', () => {
          const u = new TestUrlPath('/?b=2#frag')
          expect(u.pathname).toBe('/')
          expect(u.query).toEqual({ b: '2' })
          expect(u.anchor).toBe('frag')
        })

        it('handles query alone', () => {
          const u = new TestUrlPath('/?b=2')
          expect(u.pathname).toBe('/')
          expect(u.query).toEqual({ b: '2' })
          expect(u.anchor).toBe(undefined)
        })

        it('handles anchor alone', () => {
          const u = new TestUrlPath('/#frag')
          expect(u.pathname).toBe('/')
          expect(u.query).toEqual({})
          expect(u.anchor).toBe('frag')
        })
      })

      describe('without pathname', () => {
        it('handles empty string', () => {
          const u = new TestUrlPath('')
          expect(u.pathname).toBe('')
          expect(u.query).toEqual({})
          expect(u.anchor).toBe(undefined)
        })

        it('handles query and anchor', () => {
          const u = new TestUrlPath('?b=2#frag')
          expect(u.pathname).toBe('')
          expect(u.query).toEqual({ b: '2' })
          expect(u.anchor).toBe('frag')
        })

        it('handles query alone', () => {
          const u = new TestUrlPath('?b=2')
          expect(u.pathname).toBe('')
          expect(u.query).toEqual({ b: '2' })
          expect(u.anchor).toBe(undefined)
        })

        it('handles anchor alone', () => {
          const u = new TestUrlPath('#frag')
          expect(u.pathname).toBe('')
          expect(u.query).toEqual({})
          expect(u.anchor).toBe('frag')
        })
      })

      describe('leading dot', () => {
        it('removes leading ./', () => {
          const u = new TestUrlPath('./foo/bar')
          expect(u.pathname).toBe('foo/bar')
        })

        it('removes sole .', () => {
          const u = new TestUrlPath('.')
          expect(u.pathname).toBe('')
        })

        it('preserves leading ../', () => {
          const u = new TestUrlPath('../foo/bar')
          expect(u.pathname).toBe('../foo/bar')
        })
      })

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
