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

})

