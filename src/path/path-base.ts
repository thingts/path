import type { FilenameOps, PathOps, JoinableBasic } from '../core'
import { Filename } from '../filename'
import { fnt, pth } from '../tools'

export abstract class PathBase<TJoinable> implements PathOps<TJoinable> {
  get #filename(): string { return fnt.basename(this.path_) }
  get #isAbsolute(): boolean { return pth.isAbsolute(this.path_) }

  /** @hidden Implemented by subclasses to hold the normalized path string. */
  protected readonly path_: string

  constructor(path: string) {
    this.path_ = pth.normalize(path)
  }

  /**
   * Protected factory to construct a new instance of the current class, with
   * the given path.
   * 
   * Used by path mutation-like methods to return a new instance of the same
   * class, allowing derived classes that inherit those methods to return
   * new instances of themselves without needing to override them.
   *
   * The default implementation assumes the derived class's constructor takes
   * a single string argument (the path).  Derived classes with different
   * constructor siguatures should override {@link cloneWithPath}.
   */
  protected cloneWithPath(path: string | FilenameOps): this {
    const ctor = this.constructor as new(path: string) => this
    return new ctor(pth.conformAbsolute(path.toString(), this.#isAbsolute))
  }

  /**
   * Protected factory to construct a new instance of the current class,
   * with the given filename.
   *
   * Useed by filename mutation-like methods to return a new instance of
   * the same class, allowing derived classes that inherit those methods to
   * return new instances of themselves without needing to override them.
   */
  protected cloneWithFilename(filename: string|Filename): this { return this.parent.join(filename) }

  /////////////////////////////////////////////////////////////////////////////
  //
  //  --- PathOps implementation ---
  //
  /////////////////////////////////////////////////////////////////////////////

  get stem(): string       { return this.filename.stem }
  get extension(): string  { return this.filename.extension }
  get filename(): Filename { return new Filename(this.#filename) }
  get parent(): this       { return this.cloneWithPath(pth.dirname(this.path_)) }
  get segments(): string[] { return this.path_.split(pth.sep).filter(Boolean) }

  replaceStem(newStem: string): this                                     { return this.cloneWithFilename(this.filename.replaceStem(newStem)) }
  replaceExtension(newExt: string): this                                 { return this.cloneWithFilename(this.filename.replaceExtension(newExt)) }
  replaceFilename(newFilename: string | Filename): this                  { return this.cloneWithFilename(String(newFilename)) }
  transformFilename(fn: (filename: Filename) => string | Filename): this { return this.cloneWithFilename(fn(this.filename)) }
  replaceParent(newParent: string | this): this                          { return this.cloneWithPath(pth.join(String(newParent), this.#filename)) }

  join(...segments: readonly (JoinableBasic | TJoinable)[]): this { return this.cloneWithPath((pth.join(this.path_, ...segments.filter(Boolean).map(String)))) }

  toString(): string                    { return this.path_ }
  equals(other: string | this): boolean { return this.path_ === this.cloneWithPath(String(other)).path_ }
}
