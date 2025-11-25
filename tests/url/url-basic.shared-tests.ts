import type { FullPathUrl, RootPathUrl, RelativePathUrl } from '$src'
import { describe, it, expect } from 'vitest'
import { pathOpsTests } from '../path-ops.shared-tests'

function isAbsolute(url: FullPathUrl | RootPathUrl | RelativePathUrl): boolean {
  return url.pathname.startsWith('/')
}
function ignoreAbsolute(url: FullPathUrl | RootPathUrl | RelativePathUrl): string {
  return isAbsolute(url) ? url.pathname.slice(1) : url.pathname
}

type Kind = 'full' | 'root' | 'relative'

export function urlBasicTests(params: { make: (s: string) => FullPathUrl | RootPathUrl | RelativePathUrl, kind: Kind }): void {
  const { make, kind } = params
  function pathify(s: string): string {
    if (kind === 'relative') {
      return s.startsWith('/') ? s.slice(1) : s
    } else {
      return s.startsWith('/') ? s : '/' + s
    }
  }
  function stringify(s: string): string {
    return (kind == 'full' ? 'http://example.com' : '') + pathify(s)
  }

  function makeUrl(s: string): FullPathUrl | RootPathUrl | RelativePathUrl {
    return make(stringify(s))
  }

  const nilPath = kind === 'relative' ? '.' : '/'

  describe('basic behavior', () => {

    pathOpsTests({ make: makeUrl, stringify })

    describe('constructor', () => {
      it('normalizes path slashes', () => {
        const u = makeUrl('foo///bar////./baz')
        expect(u.pathname).toBe(pathify('/foo/bar/baz'))
      })

      it('stores and exposes query and fragment cleanly', () => {
        const u = makeUrl('a?a=1&b=x&b=y#frag')
        expect(u.query).toEqual({ a: '1', b: ['x', 'y'] })
        expect(u.fragment).toBe('frag')
      })


      describe('percent-encoding', () => {

        it('encodes reserved characters in pathname', () => {
          const u = makeUrl('f oo/#bar?/b%z')
          expect(u.pathname).toBe(pathify('f oo/#bar?/b%z'))
          expect(u.toString()).toBe(stringify('f%20oo/%23bar%3F/b%25z'))
        })

        it('does not double-encode', () => {
          const u = makeUrl('foo%25/bar')
          expect(String(u)).toBe(stringify('/foo%25/bar'))
        })

        it('does not encode unreserved characters', () => {
          const u = makeUrl('abc-._~xyz')
          expect(String(u)).toBe(stringify('/abc-._~xyz'))
        })

        it('encodes reserved characters in query', () => {
          const u = makeUrl('a').replaceQuery({ x: '1 2', y: '#z%' })
          expect(u.query).toEqual({ x: '1 2', y: '#z%' })
          expect(String(u)).toBe(stringify('/a?x=1%202&y=%23z%25'))
        })

        it('encodes reserved characters in fragment', () => {
          const u = makeUrl('a').replaceFragment('frag 1/#%')
          expect(u.fragment).toBe('frag 1/#%')
          expect(String(u)).toBe(stringify('/a#frag%201%2F%23%25'))
        })

        it('retains unencoded input in field values, encodes on stringify', () => {
          const u = makeUrl('a/baz.txt').
            replaceParent('/foo bar/').
            replaceQuery({ 'a b': 'c d??' }).
            replaceFragment('my fragment #1') 
          expect(u.pathname).toBe(pathify('/foo bar/baz.txt'))
          expect(u.query).toEqual({ 'a b': 'c d??' })
          expect(u.fragment).toBe('my fragment #1')
          expect(String(u)).toBe(stringify('/foo%20bar/baz.txt?a%20b=c%20d%3F%3F#my%20fragment%20%231'))
          const v = make(String(u))
          expect(String(v)).toBe(String(u))
        })
      })

      describe('dot-segment normalization', () => {
        it('preserves .. at beginning', () => {
          const u = makeUrl('../../x')
          expect(u.pathname).toBe(pathify('../../x'))
        })

        it('normalizes /./', () => {
          const u = makeUrl('a/./b')
          expect(u.pathname).toBe(pathify('/a/b'))
        })

        it('normalizes /../ inside path', () => {
          const u = makeUrl('a/b/../c')
          expect(u.pathname).toBe(pathify('a/c'))
        })
      })

      describe('trailing slash', () => {
        it('preserves trailing slash', () => {
          const u = makeUrl('foo/bar/')
          expect(u.pathname).toBe(pathify('/foo/bar/'))
          expect(String(u)).toBe(stringify('/foo/bar/'))
        })

        it('preserves non-trailing slash', () => {
          const u = makeUrl('foo/bar')
          expect(u.pathname).toBe(pathify('/foo/bar'))
          expect(String(u)).toBe(stringify('/foo/bar'))
        })

        it('normalizes multiple trailing slashes', () => {
          const u = makeUrl('foo/bar/////')
          expect(u.pathname).toBe(pathify('/foo/bar/'))
        })

      })

      describe('fragment', () => {
        it('strips leading # from fragment', () => {
          const u = makeUrl('a#frag')
          expect(u.fragment).toBe('frag')
        })

        it('handles empty fragment', () => {
          const u = makeUrl('a#')
          expect(u.fragment).toBe('')
        })

        it('handles missing fragment', () => {
          const u = makeUrl('a')
          expect(u.fragment).toBe(undefined)
        })
      })

      describe('query', () => {
        it('parses single key-value pair', () => {
          const u = makeUrl('a?b=2')
          expect(u.query).toEqual({ b: '2' })
        })

        it('parses multiple key-value pairs', () => {
          const u = makeUrl('a?b=2&c=3')
          expect(u.query).toEqual({ b: '2', c: '3' })
        })

        it('parses repeated keys as arrays', () => {
          const u = makeUrl('a?b=2&b=3&b=4')
          expect(u.query).toEqual({ b: ['2', '3', '4'] })
        })

        it('handles empty query', () => {
          const u = makeUrl('a?')
          expect(u.query).toEqual({})
        })

        it('handles missing query', () => {
          const u = makeUrl('a')
          expect(u.query).toBeUndefined()
        })
      })

      describe('edge cases', () => {
        it('handles fragment without query', () => {
          const u = makeUrl('a#frag')
          expect(u.query).toBeUndefined()
          expect(u.fragment).toBe('frag')
        })

        it('handles query without fragment', () => {
          const u = makeUrl('a?b=2')
          expect(u.query).toEqual({ b: '2' })
          expect(u.fragment).toBeUndefined()
        })

        describe('without path', () => {
          it('handles no modifiers', () => {
            const u = makeUrl('')
            expect(u.pathname).toBe(nilPath)
            expect(u.query).toBeUndefined()
            expect(u.fragment).toBeUndefined()
          })

          it('handles only query and fragment', () => {
            const u = makeUrl('?b=2#frag')
            expect(u.pathname).toBe(nilPath)
            expect(u.query).toEqual({ b: '2' })
            expect(u.fragment).toBe('frag')
          })

          it('handles query alone', () => {
            const u = makeUrl('?b=2')
            expect(u.pathname).toBe(nilPath)
            expect(u.query).toEqual({ b: '2' })
            expect(u.fragment).toBeUndefined()
          })

          it('handles fragment alone', () => {
            const u = makeUrl('#frag')
            expect(u.pathname).toBe(nilPath)
            expect(u.query).toBeUndefined()
            expect(u.fragment).toBe('frag')
          })
        })


        describe('leading dot', () => {
          it('removes leading ./', () => {
            const u = makeUrl('./foo/bar')
            expect(u.pathname).toBe(pathify('foo/bar'))
          })

          it('handles sole .', () => {
            const u = makeUrl('.')
            expect(u.pathname).toBe(nilPath)
          })

          it('preserves leading ../', () => {
            const u = makeUrl('../foo/bar')
            expect(u.pathname).toBe(pathify('../foo/bar'))
          })
        })
      })

    })

    describe('replaceQuery', () => {
      it('replaces entire query', () => {
        const u = makeUrl('foo?a=1')
        const v = u.replaceQuery({ b: '2' })
        expect(v.query).toEqual({ b: '2' })
        expect(String(v)).toBe(stringify('/foo?b=2'))
      })

      it('replaces with empty query', () => {
        const u = makeUrl('foo?a=1&b=2')
        const v = u.replaceQuery({})
        expect(v.query).toEqual({})
        expect(String(v)).toBe(stringify('/foo?'))
      })

      it('preserves fragment', () => {
        const u = makeUrl('foo?a=1#frag')
        const v = u.replaceQuery({ b: '2' })
        expect(v.toString()).toBe(stringify('/foo?b=2#frag'))
      })
    })

    describe('mergeQuery', () => {

      it('merges keys', () => {
        const u = makeUrl('foo').replaceQuery({ a: '1', b: 'x' })
        const v = u.mergeQuery({ b: ['y', 'z'], c: '3' })
        expect(v.query).toEqual({ a: '1', b: ['y', 'z'], c: '3' })
        expect(String(v)).toBe(stringify('/foo?a=1&b=y&b=z&c=3'))
      })

      it('mergeQuery scalar replaces scalar', () => {
        const u = makeUrl('foo?a=1')
        const v = u.mergeQuery({ a: '2' })
        expect(v.query).toEqual({ a: '2' })
      })

      it('mergeQuery replaces scalar with array', () => {
        const u = makeUrl('foo?a=1')
        const v = u.mergeQuery({ a: ['x', 'y'] })
        expect(v.query).toEqual({ a: ['x', 'y'] })
      })

      it('mergeQuery replaces array with scalar', () => {
        const u = makeUrl('foo?a=1&a=2')
        const v = u.mergeQuery({ a: 'x' })
        expect(v.query).toEqual({ a: 'x' })
      })

    })

    describe('removeQuery', () => {
      it('removes query', () => {
        const u = makeUrl('foo?a=1&b=2')
        const v = u.removeQuery()
        expect(v.query).toBeUndefined()
        expect(String(v)).toBe(stringify('/foo'))
      })

      it('preserves fragment', () => {
        const u = makeUrl('foo?a=1#frag')
        const v = u.removeQuery()
        expect(v.query).toBeUndefined()
        expect(v.fragment).toBe('frag')
        expect(String(v)).toBe(stringify('/foo#frag'))
      })
    })


    describe('replaceFragment', () => {
      it('accepts fragment string', () => {
        const u = makeUrl('foo#a')
        const v = u.replaceFragment('b')
        expect(v.fragment).toBe('b')
        expect(String(v)).toBe(stringify('/foo#b'))
      })

      it('strips leading #', () => {
        const u = makeUrl('foo#a')
        const v = u.replaceFragment('#b')
        expect(v.fragment).toBe('b')
        expect(String(v)).toBe(stringify('/foo#b'))
      })

      it('accepts empty string', () => {
        const u = makeUrl('foo#a')
        const v = u.replaceFragment('')
        expect(v.fragment).toBe('')
        expect(String(v)).toBe(stringify('/foo#'))
      })

      it('accepts #', () => {
        const u = makeUrl('foo#a')
        const v = u.replaceFragment('#')
        expect(v.fragment).toBe('')
        expect(String(v)).toBe(stringify('/foo#'))
      })

      it('percent-encodes special characters', () => {
        const u = makeUrl('foo#a')
        const v = u.replaceFragment('b c/#%')
        expect(String(v)).toBe(stringify('/foo#b%20c%2F%23%25'))
      })
    })

    it('removeFragment removes fragment', () => {
      const u = makeUrl('foo#a')
      const v = u.removeFragment()
      expect(v.fragment).toBe(undefined)
      expect(String(v)).toBe(stringify('/foo'))
    })


    describe('replaceParent', () => {

      it('maintains decoration', () => {
        const u = makeUrl('path/to/file.txt?a=1#frag')
        const v = u.replaceParent('/new/path')
        expect(v.toString()).toBe(stringify('/new/path/file.txt?a=1#frag'))
      })

      it('maintains directory', () => {
        const u = makeUrl('path/to/directory/')
        const v = u.replaceParent('/new/path')
        expect(v.pathname).toBe(pathify('/new/path/directory/'))
      })

      it('works on root directory', () => {
        const u = makeUrl('')
        const v = u.replaceParent('/newpath')
        expect(v.pathname).toBe(pathify('/newpath/'))
      })

      it('maintains relative vs.absolute path', () => {
        const u = makeUrl('path/to/file.txt')
        const v = u.replaceParent('/newpath')
        expect(isAbsolute(v)).toBe(isAbsolute(u))
      })

    })


    describe('directories', () => {
      it('handles directory path', () => {
        const u = makeUrl('path/to/directory/')
        expect(u.isDirectory).toBe(true)
        expect(u.filename).toBeUndefined()
      })

      it('handles non-directory path', () => {
        const u = makeUrl('path/to/file.txt')
        expect(u.isDirectory).toBe(false)
        expect(u.filename?.toString()).toBe('file.txt')
      })

      it('unDirectory removes trailing slash', () => {
        const u = makeUrl('path/to/directory/')
        const v = u.unDirectory()
        expect(v.isDirectory).toBe(false)
        expect(ignoreAbsolute(v)).toBe('path/to/directory')
      })

      it('unDirectory is idempotent', () => {
        const u = makeUrl('path/to/file.txt')
        const v = u.unDirectory()
        expect(v.isDirectory).toBe(false)
        expect(v.pathname).toBe(pathify('/path/to/file.txt'))
      })

      it('join with slash creates directory', () => {
        const u = makeUrl('path/to/directory')
        const v = u.join('/')
        expect(v.isDirectory).toBe(true)
        expect(v.pathname).toBe(pathify('/path/to/directory/'))
      })

      it('join with slash on directory is no-op', () => {
        const u = makeUrl('path/to/directory/')
        const v = u.join('/')
        expect(v.isDirectory).toBe(true)
        expect(v.pathname).toBe(pathify('/path/to/directory/'))
      })

      it('join with empty string on directory is no-op', () => {
        const u = makeUrl('path/to/directory/')
        const v = u.join('')
        expect(v.isDirectory).toBe(true)
        expect(v.pathname).toBe(pathify('/path/to/directory/'))
      })

      it('join with trailing slash creates directory', () => {
        const u = makeUrl('path/to/directory')
        const v = u.join('subdir/')
        expect(v.isDirectory).toBe(true)
        expect(v.pathname).toBe(pathify('/path/to/directory/subdir/'))
      })

      it('join without trailing slash creates file', () => {
        const u = makeUrl('path/to/directory/')
        const v = u.join('file.txt')
        expect(v.isDirectory).toBe(false)
        expect(v.pathname).toBe(pathify('/path/to/directory/file.txt'))
      })

      it('filename operations on directory throw', () => {
        const u = makeUrl('path/to/directory/')
        expect(() => u.replaceExtension('.jpg')).toThrow(/directory/i)
        expect(() => u.replaceStem('newname')).toThrow(/directory/i)
        expect(() => u.replaceFilename('newname.txt')).toThrow(/directory/i)
        expect(() => u.transformFilename(() => 'newname.txt')).toThrow(/directory/i)
      })


    })

  })

}
