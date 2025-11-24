import { describe, it, expect } from 'vitest'
import { RelativePathUrl } from '$src'
import { urlBasicTests } from './url-basic.shared-tests'

describe('RelativePathUrl', () => {
  urlBasicTests({ make: s => new RelativePathUrl(s), kind: 'relative' })

  describe('constructor', () => {
    it('requires no leading slash', () => {
      expect(() => new RelativePathUrl('/foo')).toThrow()
      expect(() => new RelativePathUrl('foo')).not.toThrow()
    })

  })


  it('toString includes query and fragment', () => {
    const u = new RelativePathUrl('foo/bar').replaceQuery({ a: '1' }).replaceFragment('frag')
    expect(String(u)).toBe('foo/bar?a=1#frag')
  })

  it('join() merges query and replaces fragment', () => {
    const u = new RelativePathUrl('foo?a=a1#old')
    const v = u.join('bar?b=b1#new')
    expect(String(v)).toBe('foo/bar?a=a1&b=b1#new')
  })

})

