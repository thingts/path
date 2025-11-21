import { PathBase } from '../src/path/path-base'
import { describe, it, expect } from 'vitest'

class TestPath extends PathBase<TestPath> {
}

describe('PathBase', () => {
  describe('constructor', () => {
    it('normalizes path slashes', () => {
      const p = new TestPath('/foo///bar////./baz')
      expect(p.toString()).toBe('/foo/bar/baz')
    })

    describe('dot-segment normalization', () => {
      it('preserves .. at beginning', () => {
        const p = new TestPath('../../x')
        expect(String(p)).toBe('../../x')
      })

      it('normalizes /./', () => {
        const p = new TestPath('/a/./b')
        expect(String(p)).toBe('/a/b')
      })

      it('normalizes /../ inside path', () => {
        const p = new TestPath('a/b/../c')
        expect(String(p)).toBe('a/c')
      })
    })

    describe('trailing slash', () => {
      it('removes trailing slash', () => {
        const p = new TestPath('/foo/bar/')
        expect(String(p)).toBe('/foo/bar')
      })

      it('preserves sole /', () => {
        const p = new TestPath('/')
        expect(String(p)).toBe('/')
      })

      it('normalizes multiple trailing slashes', () => {
        const p = new TestPath('/foo/bar/////')
        expect(String(p)).toBe('/foo/bar')
      })

    })


    describe('edge cases', () => {

      describe('without pathname', () => {
        it('handles empty string', () => {
          const p = new TestPath('')
          expect(String(p)).toBe('.')
        })
      })

      describe('leading dot', () => {
        it('removes leading ./', () => {
          const p = new TestPath('./foo/bar')
          expect(String(p)).toBe('foo/bar')
        })

        it('maintains sole .', () => {
          const p = new TestPath('.')
          expect(String(p)).toBe('.')
        })

        it('preserves leading ../', () => {
          const p = new TestPath('../foo/bar')
          expect(String(p)).toBe('../foo/bar')
        })
      })
    })

  })


  describe('pathname manipulation', () => {

    it('extracts filename', () => {
      const p = new TestPath('/path/to/file.txt')
      expect(p.filename.toString()).toBe('file.txt')
    })

    it('modifies filename', () => {
      const p = new TestPath('/path/to/file.txt')
      const v = p.replaceExtension('.jpg')
      expect(v.toString()).toBe('/path/to/file.jpg')
    })

    it('gets parent path', () => {
      const p = new TestPath('/path/to/file.txt')
      const parent = p.parent
      expect(parent.toString()).toBe('/path/to')
    })

    it('join ignores empty segments', () => {
      const p = new TestPath('/path/to')
      const v = p.join('', null, undefined, 'file.txt')
      expect(v.toString()).toBe('/path/to/file.txt')
    })
  })

  describe('replaceParent', () => {

    it('replaces parent', () => {
      const p = new TestPath('/path/to/file.txt')
      const v = p.replaceParent('/new/path')
      expect(v.toString()).toBe('/new/path/file.txt')
    })

    it('works on root directory', () => {
      const p = new TestPath('/')
      const v = p.replaceParent('/newpath')
      expect(String(v)).toBe('/newpath')
    })

    it('maintains relative path', () => {
      const p = new TestPath('path/to/file.txt')
      const v = p.replaceParent('/newpath')
      expect(String(v)).toBe('newpath/file.txt')
    })

    it('maintains absolute path', () => {
      const p = new TestPath('/path/to/file.txt')
      const v = p.replaceParent('newpath')
      expect(String(v)).toBe('/newpath/file.txt')
    })
  })


})
