import { describe, it, expect } from 'vitest'
import { pathUrl } from '$src'


describe('pathUrl', () => {
  it('creates FullPathUrl for full URLs', () => {
    const u = pathUrl('https://example.com/foo/bar?a=1#frag')
    expect(u.constructor.name).toBe('FullPathUrl')
    expect(String(u)).toBe('https://example.com/foo/bar?a=1#frag')
  })

  it('creates RootPathUrl for rooted paths', () => {
    const u = pathUrl('/foo/bar?a=1#frag')
    expect(u.constructor.name).toBe('RootPathUrl')
    expect(String(u)).toBe('/foo/bar?a=1#frag')
  })

  it('creates RelativePathUrl for relative paths', () => {
    const u = pathUrl('foo/bar?a=1#frag')
    expect(u.constructor.name).toBe('RelativePathUrl')
    expect(String(u)).toBe('foo/bar?a=1#frag')
  })

  it('throws error for non-hierarchical URLs', () => {
    expect(() => pathUrl('mailto:user@example.com')).toThrowError(/non-hierarchical/i)
  })
})
