import { AbsolutePath, RelativePath } from '$src'
import { describe, it, expect } from 'vitest'
import { pathBasicTests } from './path-basic.shared-tests'


describe('AbsolutePath', () => {

  pathBasicTests({ make: (s: string) => new AbsolutePath(s), kind: 'absolute' })

  describe('constructor', () => {
    it('throws if given a relative path', () => {
      expect(() => new AbsolutePath('foo/bar/baz.txt')).toThrow()
      expect(() => new AbsolutePath('./foo/bar')).toThrow()
      expect(() => new AbsolutePath('../foo/bar')).toThrow()
    })

  })

  describe('path properties and manipulation', () => {

    it('tests equality', () => {
      const p1 = new AbsolutePath('/foo/bar/A.txt')
      const p2 = new AbsolutePath('/foo/bar/A.txt')
      const p3 = new AbsolutePath('/foo/bar/B.txt')
      expect(p1.equals(p2)).toBe(true)
      expect(p1.equals(p3)).toBe(false)
      expect(p1.equals('/foo/bar/A.txt/')).toBe(true)
    })

    it('can extract relative path', () => {
      const base = new AbsolutePath('/foo/bar')
      const child = new AbsolutePath('/foo/bar/baz/qux.txt')
      const relpath = child.relativeTo(base)
      expect(relpath).toBeInstanceOf(RelativePath)
      expect(String(relpath)).toBe('baz/qux.txt')
    })

    describe('descendsFrom()', () => {
      const base = new AbsolutePath('/foo/bar')
      const child = new AbsolutePath('/foo/bar/baz/qux.txt')
      const sibling = new AbsolutePath('/foo/bar2')
      const self = new AbsolutePath('/foo/bar')

      it('returns true if path descends from another', () => {
        expect(child.descendsFrom(base)).toBe(true)
      })

      it('returns false if not a descendant', () => {
        expect(sibling.descendsFrom(base)).toBe(false)
      })

      it('returns false if path is equal and includeSelf is false', () => {
        expect(self.descendsFrom(base)).toBe(false)
      })

      it('returns true if path is equal and includeSelf is true', () => {
        expect(self.descendsFrom(base, { includeSelf: true })).toBe(true)
      })
    })

    describe('resolve()', () => {
      it('resolves a relative segment against the base path', () => {
        const base = new AbsolutePath('/foo/bar')
        const result = base.resolve('baz')
        expect(result).toBeInstanceOf(AbsolutePath)
        expect(String(result)).toBe('/foo/bar/baz')
      })

      it('resets to absolute if the segment starts with a slash', () => {
        const base = new AbsolutePath('/foo/bar')
        const result = base.resolve('/absolute/path')
        expect(result).toBeInstanceOf(AbsolutePath)
        expect(String(result)).toBe('/absolute/path')
      })

      it('resolves upward navigation segments correctly', () => {
        const base = new AbsolutePath('/foo/bar')
        const result = base.resolve('../baz')
        expect(result).toBeInstanceOf(AbsolutePath)
        expect(String(result)).toBe('/foo/baz')
      })

      it('resolves multiple segments including an absolute reset', () => {
        const base = new AbsolutePath('/foo/bar')
        const result = base.resolve('a', '/b', 'c')
        expect(result).toBeInstanceOf(AbsolutePath)
        expect(String(result)).toBe('/b/c')
      })

      it('ignores null and undefined segments', () => {
        const base = new AbsolutePath('/foo/bar')
        const result = base.resolve(null, 'baz', undefined)
        expect(result).toBeInstanceOf(AbsolutePath)
        expect(String(result)).toBe('/foo/bar/baz')
      })
    })

  })

  it('toString yields the path string', () => {
    const p = new AbsolutePath('/tmp/example.txt')
    expect(p.toString()).toBe('/tmp/example.txt')
  })

  describe('AbsolutePath.isAbsolutePathString', () => {
    it('returns true for absolute paths', () => {
      expect(AbsolutePath.isAbsolutePathString('/foo/bar/baz.txt')).toBe(true)
    })

    it('returns false for relative paths', () => {
      expect(AbsolutePath.isAbsolutePathString('foo/bar/baz.txt')).toBe(false)
      expect(AbsolutePath.isAbsolutePathString('./foo/bar/baz.txt')).toBe(false)
      expect(AbsolutePath.isAbsolutePathString('../foo/bar/baz.txt')).toBe(false)
      expect(AbsolutePath.isAbsolutePathString('plain')).toBe(false)
    })
  })

})
