import type { AbsolutePath, RelativePath } from '$src'
import { describe, it, expect } from 'vitest'
import { pathOpsTests } from '../path-ops.shared-tests'

type Kind = 'absolute' | 'relative'

export function pathBasicTests(params: { make: (path: string) => AbsolutePath | RelativePath, kind: Kind }): void {
  const { make, kind } = params
  function stringify(s: string): string {
    if (kind === 'relative') {
      return s.startsWith('/') ? s.slice(1) : s
    } else {
      return s.startsWith('/') ? s : '/' + s
    }
  }
  function makePath(s: string): AbsolutePath | RelativePath {
    return make(stringify(s))
  }

  describe('basic behavior', () => {

    pathOpsTests({ make: makePath, stringify })

    describe('constructor', () => {
      it('normalizes path slashes', () => {
        const p = makePath('/foo///bar////./baz')
        expect(p.toString()).toBe(stringify('/foo/bar/baz'))
      })

      describe('dot-segment normalization', () => {
        it('preserves .. at beginning', () => {
          const p = makePath('../../x')
          expect(String(p)).toBe(stringify('../../x'))
        })

        it('normalizes /./', () => {
          const p = makePath('/a/./b')
          expect(String(p)).toBe(stringify('/a/b'))
        })

        it('normalizes /../ inside path', () => {
          const p = makePath('a/b/../c')
          expect(String(p)).toBe(stringify('a/c'))
        })
      })

      describe('trailing slash', () => {
        it('removes trailing slash', () => {
          const p = makePath('/foo/bar/')
          expect(String(p)).toBe(stringify('/foo/bar'))
        })

        it('normalizes multiple trailing slashes', () => {
          const p = makePath('/foo/bar/////')
          expect(String(p)).toBe(stringify('/foo/bar'))
        })

      })


      describe('edge cases', () => {

        describe('leading dot', () => {
          it('removes leading ./', () => {
            const p = makePath('./foo/bar')
            expect(String(p)).toBe(stringify('foo/bar'))
          })

          it('preserves leading ../', () => {
            const p = makePath('../foo/bar')
            expect(String(p)).toBe(stringify('../foo/bar'))
          })
        })
      })

    })


  })
}
