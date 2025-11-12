import { describe, it, expect } from 'vitest'
import { RootUrlPath } from '$src'

describe('RootUrlPath', () => {
  describe('constructor', () => {
    it('requires leading slash', () => {
      expect(() => new RootUrlPath('foo')).toThrow()
      expect(() => new RootUrlPath('/foo')).not.toThrow()
    })

    it('accepts query and anchor', () => {
      const u = new RootUrlPath('/foo?a=1#frag')
      expect(u.query).toEqual({ a: '1' })
      expect(u.anchor).toBe('frag')
    })
  })

  it('pathName has leading slash', () => {
    const u = new RootUrlPath('/foo/bar')
    expect(u.pathname).toBe('/foo/bar')
  })


  it('toString includes query and anchor', () => {
    const u = new RootUrlPath('/foo/bar').replaceQuery({ a: '1' }).replaceAnchor('frag')
    expect(String(u)).toBe('/foo/bar?a=1#frag')
  })

  it('join() merges query and replaces anchor', () => {
    const u = new RootUrlPath('/foo?a=a1#old')
    const v = u.join('bar?b=b1#new')
    expect(String(v)).toBe('/foo/bar?a=a1&b=b1#new')
  })

  it('resolve() appends relative path', () => {
    const u = new RootUrlPath('/foo/bar?a=1#old')
    const v = u.resolve('baz?b=2#new')
    expect(String(v)).toBe('/foo/bar/baz?a=1&b=2#new')
  })

  it('resolve() resets on rooted path', () => {
    const u = new RootUrlPath('/foo/bar?a=1#old')
    const v = u.resolve('/reset?b=2#new')
    expect(String(v)).toBe('/reset?b=2#new')
  })
})

