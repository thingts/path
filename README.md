# @thingts/filepath

Type-safe, ergonomic package for working with paths, in any javascript environment (node.js, deno, browser, etc)

[![npm version](https://img.shields.io/npm/v/@thingts/filepath.svg)](https://www.npmjs.com/package/@thingts/filepath)
[![CI](https://github.com/thingts/filepath/actions/workflows/ci.yml/badge.svg)](https://github.com/thingts/filepath/actions/workflows/ci.yml)
[![docs](https://img.shields.io/badge/docs-typedoc-blue)](https://thingts.github.io/filepath/)
[![license](https://img.shields.io/npm/l/@thingts/filepath.svg)](LICENSE)


Instead of juggling raw strings with
[node:path](https://nodejs.org/api/path.html), `@thingts/filepath` provides
TypeScript classes that make paths **first-class citizens** in your code.

* Pure typescript, no dependencies on node.js
* Immutable, chainable path objects with type-safe operations
* Path normalization and resolution on construction
* Easy access to path parts (filename, stem, extension, parent)
* Path transformations (replace stem/extension/parent, transform filename, etc)
* Path navigation (join, resolve, relativeTo, descendsFrom, etc)

Together these features give you a safer, more expressive way to work with file, directory, and URL.pathname paths.

#### Notes:

⚠️ Currently only POSIX-style paths are supported (e.g. `/foo/bar`).

💡 This package does not do any filesystem access, it is only for manipulating path strings.  For filesystem access, see [`@thingts/fs-path`](https://www.npmjs.com/package/@thingts/fs-path) which builds on this package.



## Overview

The package provides a set of classes to represent and manipulate
filesystem paths.  All classes are immutable; any path or filename
manipulation operation returns a new instance.

There are three exported classes:

* `AbsolutePath` - Absolute path object with path manipulation
* `RelativePath` - Relative path object with path manipulation
* `Filename` - Immutable filename with file part manipulation (no path separators)

The classes work together to maintain type safety and ergonomics.  For
example, the `.relativeTo()` method of `AbsolutePath` returns a `RelativePath`
object.

`AbsolutePath` and `RelativePath` are similar, except:

* The `AbsolutePath` constructor requires an absolute path, e.g. `/foo/bar`,
  throwing an error if given a relative path.

* The `RelativePath` constructor requires a relative path, e.g. `foo/bar`,
  throwing an error if given an absolute path.

* `AbsolutePath` has methods that only make sense for absolute paths:
  `path.descendsFrom(other)`, `path.relativeTo(other)`,
  `path.resolve(parts...)`


## Usage examples

This is a quick overview of some common operations, using AbsolutePath.

For complete docs, see the [API Reference](https://thingts.github.io/filepath).

```typescript
import { AbsolutePath } from '@thingts/filepath'
``` 

#### Normalize & resolve on construction

```typescript
const a = new AbsolutePath('/foo/../bar/file.txt')
a.equals('/bar/file.txt') // true
```

#### Path parts & transforms

```typescript
const a = new AbsolutePath('/bar/file.txt')
a.filename                // Filename: 'file.txt'
a.filename.toString()     // string: 'file.txt'
a.stem                    // string: 'file'
a.extension               // string: '.txt'
a.parent                  // AbsolutePath: '/bar'
const b = a.replaceStem('report')         // AbsolutePath: '/bar/report.txt'
const c = b.replaceExtension('.md')       // AbsolutePath: '/bar/report.md'
const d = c.replaceParent('/other')        // AbsolutePath: '/other/report.md'
const e = d.transformFilename(fn => fn.toUpperCase()) // AbsolutePath: '/other/REPORT.MD'
```

#### Navigation

```typescript
const base = new AbsolutePath('/projects/demos')
const file = base.join('demo1', 'src/index.ts') // AbsolutePath: '/projects/demos/demo1/src/index.ts'
file.parent.equals('/projects/demos/demo1/src')       // true

// Operations specific to absolute paths:
base.descendsFrom('/projects')    // true

const rel = file.relativeTo(base) // RelativePath: 'demo1/src/index.ts'

// Resolve against an absolute base: like .join() but can be overriden by absolute paths:
base.resolve('demo1', 'src/index.ts')         // AbsolutePath: '/project/demos/demo1/src/index.ts'
base.resolve('/shared-demos', 'src/index.ts') // AbsolutePath: '/shared-demos/src/index.ts'

```

## Contributing

Contributions are welcome!

As usual: fork the repo, create a feature branch, and open a
pull request, with tests and docs for any new functionality.  Thanks!
