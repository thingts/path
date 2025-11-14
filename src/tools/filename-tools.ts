import { PATH_SEPARATOR } from '../core'

export function extname(filename: string): string {
  const dot = filename.lastIndexOf('.')
  const sep = filename.lastIndexOf(PATH_SEPARATOR)
  return (dot > 0 && dot > sep) ? filename.slice(dot) : ''
}

export function basename(filename: string, ext?: string): string {
  const base = filename.slice(filename.lastIndexOf(PATH_SEPARATOR) + 1)
  if (ext && base.endsWith(ext)) {
    return base.slice(0, base.length - ext.length)
  }
  return base
}
