import type { PathOps } from '../src/core'
import { describe, it, expect } from 'vitest'

export function pathOpsTests(params: { make: (s: string) => PathOps, stringify: (s: string) => string }): void  {

  const { make, stringify } = params

  describe('path ops', () => {

    it('extracts filename', () => {
      const p = make('/path/to/file.txt')
      expect(p.filename?.toString()).toBe('file.txt')
    })

    it('extracts stem', () => {
      const p = make('/path/to/file.txt')
      expect(p.stem).toBe('file')
    })

    it('extracts extension', () => {
      const p = make('/path/to/file.txt')
      expect(p.extension).toBe('.txt')
    })

    it('extracts segments', () => {
      const p = make('/path/to/file.txt')
      expect(p.segments).toEqual(['path', 'to', 'file.txt'])
    })

    it('replacesFilename', () => {
      const p = make('/path/to/file.txt')
      const v = p.replaceFilename('newfile.jpg')
      expect(v.toString()).toBe(stringify('/path/to/newfile.jpg'))
      expect(v.constructor).toBe(p.constructor)
    })

    it('replacesStem', () => {
      const p = make('/path/to/file.txt')
      const v = p.replaceStem('newfile')
      expect(v.toString()).toBe(stringify('/path/to/newfile.txt'))
      expect(v.constructor).toBe(p.constructor)
    })

    it('replacexExtension', () => {
      const p = make('/path/to/file.txt')
      const v = p.replaceExtension('.jpg')
      expect(v.toString()).toBe(stringify('/path/to/file.jpg'))
      expect(v.constructor).toBe(p.constructor)
    })

    it('transformsFilename', () => {
      const p = make('/path/to/file.txt')
      const v = p.transformFilename(fn => 'PREFIX_' + fn.toString().toUpperCase())
      expect(v.toString()).toBe(stringify('/path/to/PREFIX_FILE.TXT'))
      expect(v.constructor).toBe(p.constructor)
    })

    it('gets parent path', () => {
      const p = make('/path/to/file.txt')
      const parent = p.parent
      expect(parent.toString()).toBe(stringify('/path/to'))
      expect(parent.constructor).toBe(p.constructor)
    })

    it('join appends segments', () => {
      const p = make('/path/to')
      const v = p.join('subdir', 'file.txt')
      expect(v.toString()).toBe(stringify('/path/to/subdir/file.txt'))
      expect(v.constructor).toBe(p.constructor)
    })

    it('join ignores empty segments', () => {
      const p = make('/path/to')
      const v = p.join('', null, undefined, 'file.txt')
      expect(v.toString()).toBe(stringify('/path/to/file.txt'))
      expect(v.constructor).toBe(p.constructor)
    })

    it('replaces parent', () => {
      const p = make('/path/to/file.txt')
      const v = p.replaceParent('/new/path')
      expect(v.toString()).toBe(stringify('/new/path/file.txt'))
      expect(v.constructor).toBe(p.constructor)
    })

  })
}
