import { RelativePath } from '$src'
import { describe, it, expect } from 'vitest'
import { pathBasicTests } from './path-basic.shared-tests'

describe('RelativePath', () => {

  pathBasicTests({ make: (s: string) => new RelativePath(s), kind: 'relative' })

  describe('constructor', () => {

    it('throws if given an absolute path', () => {
      expect(() => new RelativePath('/absolute/path.txt')).toThrow(/absolute/)
    })

    it('normalizes empty paths to "."', () => {
      expect(String(new RelativePath(''))).toBe('.')
      expect(String(new RelativePath('.'))).toBe('.')
      expect(String(new RelativePath('./'))).toBe('.')
      expect(String(new RelativePath('./foo/../'))).toBe('.')
      expect(String(new RelativePath('./foo/..'))).toBe('.')
    })


  })

  it('tests equality', () => {
    const p1 = new RelativePath('foo/bar/A.txt')
    const p2 = new RelativePath('foo/bar/A.txt')
    const p3 = new RelativePath('foo/bar/B.txt')
    expect(p1.equals(p2)).toBe(true)
    expect(p1.equals(p3)).toBe(false)
    expect(p1.equals('./foo/bar/A.txt/')).toBe(true)
  })

  describe('RelativePath.isRelativePathString', () => {
    it('returns true for valid relative paths', () => {
      expect(RelativePath.isRelativePathString('foo/bar/file.txt')).toBe(true)
      expect(RelativePath.isRelativePathString('./relative/path')).toBe(true)
      expect(RelativePath.isRelativePathString('..')).toBe(true)
      expect(RelativePath.isRelativePathString('plain')).toBe(true)
    })

    it('returns false for absolute paths', () => {
      expect(RelativePath.isRelativePathString('/absolute/path.txt')).toBe(false)
    })
  })

})
