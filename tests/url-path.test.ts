import { describe, it, expect } from 'vitest'
import { urlPath } from '$src'


describe('urlPath', () => {
  it('creates HostUrlPath for full URLs', () => {
    const u = urlPath('https://example.com/foo/bar?a=1#frag')
    expect(u.constructor.name).toBe('HostUrlPath')
    expect(String(u)).toBe('https://example.com/foo/bar?a=1#frag')
  })

  it('creates RootUrlPath for rooted paths', () => {
    const u = urlPath('/foo/bar?a=1#frag')
    expect(u.constructor.name).toBe('RootUrlPath')
    expect(String(u)).toBe('/foo/bar?a=1#frag')
  })

  it('creates RelativeUrlPath for relative paths', () => {
    const u = urlPath('foo/bar?a=1#frag')
    expect(u.constructor.name).toBe('RelativeUrlPath')
    expect(String(u)).toBe('foo/bar?a=1#frag')
  })

  it('throws error for non-hierarchical URLs', () => {
    expect(() => urlPath('mailto:user@example.com')).toThrowError(/non-hierarchical/i)
  })
})
