import { UrlBase } from '../src/url/url-base'
import { describe, it, expect } from 'vitest'

class TestUrlPath extends UrlBase<TestUrlPath> {
  protected construct(url: string): TestUrlPath {
    return new TestUrlPath(url)
  }
}

describe('UrlBase', () => {
  describe('constructor', () => {
    it('normalizes path slashes', () => {
      const u = new TestUrlPath('/foo///bar////./baz')
      expect(u.pathname).toBe('/foo/bar/baz')
    })

    it('stores and exposes query and fragment cleanly', () => {
      const u = new TestUrlPath('/a?a=1&b=x&b=y#frag')
      expect(u.query).toEqual({ a: '1', b: ['x', 'y'] })
      expect(u.fragment).toBe('frag')
    })


    describe('percent-encoding', () => {

      it('encodes reserved characters in pathname', () => {
        const u = new TestUrlPath('/f oo/#bar?/b%z')
        expect(u.pathname).toBe('/f%20oo/%23bar%3F/b%25z')
      })

      it('does not double-encode', () => {
        const u = new TestUrlPath('/foo%25/bar')
        expect(String(u)).toBe('/foo%25/bar')
      })

      it('does not encode unreserved characters', () => {
        const u = new TestUrlPath('/abc-._~xyz')
        expect(u.pathname).toBe('/abc-._~xyz')
      })

    })

    describe('dot-segment normalization', () => {
      it('preserves .. at beginning', () => {
        const u = new TestUrlPath('../../x')
        expect(u.pathname).toBe('../../x')
      })

      it('normalizes /./', () => {
        const u = new TestUrlPath('/a/./b')
        expect(u.pathname).toBe('/a/b')
      })

      it('normalizes /../ inside path', () => {
        const u = new TestUrlPath('a/b/../c')
        expect(u.pathname).toBe('a/c')
      })
    })

    describe('trailing slash', () => {
      it('preserves trailing slash', () => {
        const u = new TestUrlPath('/foo/bar/')
        expect(u.pathname).toBe('/foo/bar/')
        expect(String(u)).toBe('/foo/bar/')
      })

      it('preserves non-trailing slash', () => {
        const u = new TestUrlPath('/foo/bar')
        expect(u.pathname).toBe('/foo/bar')
        expect(String(u)).toBe('/foo/bar')
      })

      it('preserves sole /', () => {
        const u = new TestUrlPath('/')
        expect(u.pathname).toBe('/')
      })

      it('normalizes multiple trailing slashes', () => {
        const u = new TestUrlPath('/foo/bar/////')
        expect(u.pathname).toBe('/foo/bar/')
      })

    })

    describe('fragment', () => {
      it('strips leading # from fragment', () => {
        const u = new TestUrlPath('/a#frag')
        expect(u.fragment).toBe('frag')
      })

      it('handles empty fragment', () => {
        const u = new TestUrlPath('/a#')
        expect(u.fragment).toBe('')
      })

      it('handles missing fragment', () => {
        const u = new TestUrlPath('/a')
        expect(u.fragment).toBe(undefined)
      })
    })


    describe('edge cases', () => {
      it('handles fragment without query', () => {
        const u = new TestUrlPath('/a#frag')
        expect(u.query).toEqual({})
        expect(u.fragment).toBe('frag')
      })

      it('handles query without fragment', () => {
        const u = new TestUrlPath('/a?b=2')
        expect(u.query).toEqual({ b: '2' })
        expect(u.fragment).toBe(undefined)
      })

      describe('with root', () => {
        it('handles no modifiers', () => {
          const u = new TestUrlPath('/')
          expect(u.pathname).toBe('/')
          expect(u.query).toEqual({})
          expect(u.fragment).toBe(undefined)
        })

        it('handles query and fragment', () => {
          const u = new TestUrlPath('/?b=2#frag')
          expect(u.pathname).toBe('/')
          expect(u.query).toEqual({ b: '2' })
          expect(u.fragment).toBe('frag')
        })

        it('handles query alone', () => {
          const u = new TestUrlPath('/?b=2')
          expect(u.pathname).toBe('/')
          expect(u.query).toEqual({ b: '2' })
          expect(u.fragment).toBe(undefined)
        })

        it('handles fragment alone', () => {
          const u = new TestUrlPath('/#frag')
          expect(u.pathname).toBe('/')
          expect(u.query).toEqual({})
          expect(u.fragment).toBe('frag')
        })
      })

      describe('without pathname', () => {
        it('handles empty string', () => {
          const u = new TestUrlPath('')
          expect(u.pathname).toBe('')
          expect(u.query).toEqual({})
          expect(u.fragment).toBe(undefined)
        })

        it('handles query and fragment', () => {
          const u = new TestUrlPath('?b=2#frag')
          expect(u.pathname).toBe('')
          expect(u.query).toEqual({ b: '2' })
          expect(u.fragment).toBe('frag')
        })

        it('handles query alone', () => {
          const u = new TestUrlPath('?b=2')
          expect(u.pathname).toBe('')
          expect(u.query).toEqual({ b: '2' })
          expect(u.fragment).toBe(undefined)
        })

        it('handles fragment alone', () => {
          const u = new TestUrlPath('#frag')
          expect(u.pathname).toBe('')
          expect(u.query).toEqual({})
          expect(u.fragment).toBe('frag')
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

  describe('replaceQuery', () => {
    it('replaces entire query', () => {
      const u = new TestUrlPath('/foo?a=1')
      const v = u.replaceQuery({ b: '2' })
      expect(v.query).toEqual({ b: '2' })
      expect(String(v)).toBe('/foo?b=2')
    })
    it('preserves fragment', () => {
      const u = new TestUrlPath('/foo?a=1#frag')
      const v = u.replaceQuery({ b: '2' })
      expect(v.toString()).toBe('/foo?b=2#frag')
    })
  })

  describe('mergeQuery', () => {

    it('merges keys', () => {
      const u = new TestUrlPath('/foo').replaceQuery({ a: '1', b: 'x' })
      const v = u.mergeQuery({ b: ['y', 'z'], c: '3' })
      expect(v.query).toEqual({ a: '1', b: ['y', 'z'], c: '3' })
      expect(String(v)).toBe('/foo?a=1&b=y&b=z&c=3')
    })

    it('mergeQuery scalar replaces scalar', () => {
      const u = new TestUrlPath('/foo?a=1')
      const v = u.mergeQuery({ a: '2' })
      expect(v.query).toEqual({ a: '2' })
    })

    it('mergeQuery replaces scalar with array', () => {
      const u = new TestUrlPath('/foo?a=1')
      const v = u.mergeQuery({ a: ['x', 'y'] })
      expect(v.query).toEqual({ a: ['x', 'y'] })
    })

    it('mergeQuery replaces array with scalar', () => {
      const u = new TestUrlPath('/foo?a=1&a=2')
      const v = u.mergeQuery({ a: 'x' })
      expect(v.query).toEqual({ a: 'x' })
    })

  })


  describe('replaceFragment', () => {
    it('accepts fragment string', () => {
      const u = new TestUrlPath('/foo#a')
      const v = u.replaceFragment('b')
      expect(v.fragment).toBe('b')
      expect(String(v)).toBe('/foo#b')
    })

    it('strips leading #', () => {
      const u = new TestUrlPath('/foo#a')
      const v = u.replaceFragment('#b')
      expect(v.fragment).toBe('b')
      expect(String(v)).toBe('/foo#b')
    })

    it('accepts empty string', () => {
      const u = new TestUrlPath('/foo#a')
      const v = u.replaceFragment('')
      expect(v.fragment).toBe('')
      expect(String(v)).toBe('/foo#')
    })

    it('accepts #', () => {
      const u = new TestUrlPath('/foo#a')
      const v = u.replaceFragment('#')
      expect(v.fragment).toBe('')
      expect(String(v)).toBe('/foo#')
    })

    it('percent-encodes special characters', () => {
      const u = new TestUrlPath('/foo#a')
      const v = u.replaceFragment('b c/#%')
      expect(String(v)).toBe('/foo#b%20c%2F%23%25')
    })
  })

  it('removeFragment removes fragment', () => {
    const u = new TestUrlPath('/foo#a')
    const v = u.removeFragment()
    expect(v.fragment).toBe(undefined)
    expect(String(v)).toBe('/foo')
  })

  describe('pathname manipulation', () => {

    it('extracts filename', () => {
      const u = new TestUrlPath('/path/to/file.txt')
      expect(u.filename?.toString()).toBe('file.txt')
    })

    it('modifies filename, maintains decoration', () => {
      const u = new TestUrlPath('/path/to/file.txt?a=1#frag')
      const v = u.replaceExtension('.jpg')
      expect(v.toString()).toBe('/path/to/file.jpg?a=1#frag')
    })

    it('gets parent path, maintains decoration', () => {
      const u = new TestUrlPath('/path/to/file.txt?a=1#frag')
      const parent = u.parent
      expect(parent.toString()).toBe('/path/to?a=1#frag')
    })

    it('join ignores empty segments', () => {
      const u = new TestUrlPath('/path/to')
      const v = u.join('', null, undefined, 'file.txt')
      expect(v.toString()).toBe('/path/to/file.txt')
    })
  })

  describe('replaceParent', () => {

    it('maintains decoration', () => {
      const u = new TestUrlPath('/path/to/file.txt?a=1#frag')
      const v = u.replaceParent('/new/path')
      expect(v.toString()).toBe('/new/path/file.txt?a=1#frag')
    })

    it('maintains directory', () => {
      const u = new TestUrlPath('/path/to/directory/')
      const v = u.replaceParent('/new/path')
      expect(v.pathname).toBe('/new/path/directory/')
    })

    it('works on root directory', () => {
      const u = new TestUrlPath('/')
      const v = u.replaceParent('/newpath')
      expect(v.pathname).toBe('/newpath/')
    })

    it('maintains relative path', () => {
      const u = new TestUrlPath('path/to/file.txt')
      const v = u.replaceParent('/newpath')
      expect(v.pathname).toBe('newpath/file.txt')
    })

    it('maintains absolute path', () => {
      const u = new TestUrlPath('/path/to/file.txt')
      const v = u.replaceParent('newpath')
      expect(v.pathname).toBe('/newpath/file.txt')
    })
  })


  describe('directories', () => {
    it('handles directory path', () => {
      const u = new TestUrlPath('/path/to/directory/')
      expect(u.isDirectory).toBe(true)
      expect(u.filename).toBeUndefined()
    })

    it('handles non-directory path', () => {
      const u = new TestUrlPath('/path/to/file.txt')
      expect(u.isDirectory).toBe(false)
      expect(u.filename?.toString()).toBe('file.txt')
    })

    it('unDirectory removes trailing slash', () => {
      const u = new TestUrlPath('/path/to/directory/')
      const v = u.unDirectory()
      expect(v.isDirectory).toBe(false)
      expect(v.pathname).toBe('/path/to/directory')
    })

    it('unDirectory is idempotent', () => {
      const u = new TestUrlPath('/path/to/file.txt')
      const v = u.unDirectory()
      expect(v.isDirectory).toBe(false)
      expect(v.pathname).toBe('/path/to/file.txt')
    })

    it('join with slash creates directory', () => {
      const u = new TestUrlPath('/path/to/directory')
      const v = u.join('/')
      expect(v.isDirectory).toBe(true)
      expect(v.pathname).toBe('/path/to/directory/')
    })

    it('join with slash on directory is no-op', () => {
      const u = new TestUrlPath('/path/to/directory/')
      const v = u.join('/')
      expect(v.isDirectory).toBe(true)
      expect(v.pathname).toBe('/path/to/directory/')
    })

    it('join with empty string on directory is no-op', () => {
      const u = new TestUrlPath('/path/to/directory/')
      const v = u.join('')
      expect(v.isDirectory).toBe(true)
      expect(v.pathname).toBe('/path/to/directory/')
    })

    it('join with trailing slash creates directory', () => {
      const u = new TestUrlPath('/path/to/directory')
      const v = u.join('subdir/')
      expect(v.isDirectory).toBe(true)
      expect(v.pathname).toBe('/path/to/directory/subdir/')
    })

    it('join without trailing slash creates file', () => {
      const u = new TestUrlPath('/path/to/directory/')
      const v = u.join('file.txt')
      expect(v.isDirectory).toBe(false)
      expect(v.pathname).toBe('/path/to/directory/file.txt')
    })

    it('filename operations on directory throw', () => {
      const u = new TestUrlPath('/path/to/directory/')
      expect(() => u.replaceExtension('.jpg')).toThrow(/directory/i)
      expect(() => u.replaceStem('newname')).toThrow(/directory/i)
      expect(() => u.replaceFilename('newname.txt')).toThrow(/directory/i)
      expect(() => u.transformFilename(() => 'newname.txt')).toThrow(/directory/i)
    })


  })

})
