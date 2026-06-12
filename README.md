# @thingts/path

[![npm version](https://img.shields.io/npm/v/@thingts/path.svg)](https://www.npmjs.com/package/@thingts/path)
[![docs](https://img.shields.io/badge/docs-typedoc-blue)](https://thingts.github.io/path/)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/thingts/path/ci.yml)](https://github.com/thingts/path/actions/workflows/ci.yml)
[![GitHub License](https://img.shields.io/github/license/thingts/path)](LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@thingts/path)](https://bundlephobia.com/package/@thingts/path)


Type-safe, ergonomic package for working with paths and filenames, both plain and in URLs, in pure TypeScript (browser-safe, no dependencies).

## Why?

Working with raw path strings (`indexOf()`, `slice()`, regexes, or `node:path`) is tedious, brittle, and hard to read.  This package provides type‑safe, expressive objects that support concepts like filenames, extensions, parents, joins, and URL semantics.

## Features

- Pure TypeScript — no Node.js dependencies  
- Immutable, chainable path objects  
- POSIX-style normalization (`.`, `..`, repeated slashes) on construction
- Rich filename operations (stem, extension, transforms)  
- Type‑safe path navigation (`join`, `resolve`, `relativeTo`, `descendsFrom`)  
- Robust URL support with query/fragment manipulation and percent‑encoding  

For complete docs, see the [API Reference](https://thingts.github.io/path)

> 💡 This package does not do any filesystem access, it is only for manipulating path strings.  For filesystem access, see [`@thingts/fs-path`](https://github.com/thingts/fs-path) which builds on this package.

---

## Installation

```bash
npm install @thingts/path
```

---

## Classes Overview

| Class | Path Type | Notes |
|-------|-----------|-------|
| `Filename` | *filename* | plain |
| `RelativePath` | *relative* | plain |
| `AbsolutePath` | *absolute* | plain |
| `RelativePathUrl` | *relative* | URL |
| `RootPathUrl` | *absolute* | URL |
| `FullPathUrl` | *absolute* | URL |

All classes:

- Are **immutable**  
- Expose `.toString()` and `.equals()`  

All path classes:

- Normalize appropriately on construction  
- Provide `.filename`, `.stem`, `.extension`, `.parent`, `.join()`, etc.

All absolute path classes:

- Provide `.resolve()`, `.relativeTo()`, `.descendsFrom()`, etc.

URL classes add:

- URL-safe normalization
- Query and fragment support
- Percent‑encoding on stringification
- Directory-awareness via trailing slash  
- Origin (`scheme://host:port`) support & conversion to/from native URL objects (in `FullPathUrl`)

> 💡 This package provides support only for URLs that have paths — specifically the ["special schemes"](https://url.spec.whatwg.org/#special-scheme): `http://`, `https://`, `ftp://`, `ftps://`, `ws://`, `wss://`, and `file://`.  Other schemes (e.g. `mailto:`, `data:`, `javascript:`) are not supported and will throw an error.  (See also [RFC 3986 Section 3.3](https://www.rfc-editor.org/rfc/rfc3986#section-3.3))

---

## Examples

Some examples illustrating common accessors and methods.  For complete docs, see the [API Reference](https://thingts.github.io/path/)


### Working with filenames

All classes have filename features, e.g.:

```ts
const p = new AbsolutePath('/foo/bar/baz.txt')

p.filename.toString()       // → 'baz.txt'
p.stem                      // → 'baz'
p.extension                 // → '.txt'
p.replaceStem('report')     // → AbsolutePath('/foo/bar/report.txt')
p.replaceExtension('.md')   // → AbsolutePath('/foo/bar/baz.md')
```

### Relative Paths

Relative paths don't start with a slash.  They have all the filename
features plus path navigation and manipulation methods, e.g.:

```ts
const p = new RelativePath('foo/bar/baz.txt')

p.segments                  // → ['foo', 'bar', 'baz.txt']
p.parent                    // → RelativePath('foo/bar')
p.join('more/files')        // → RelativePath('foo/bar/baz.txt/more/files')
```

### Absolute Paths

Absolute paths start with a slash.  They have all the features of relative
paths, plus extra methods for working with absolute paths, e.g.:

```ts
const p = new AbsolutePath('/foo/bar/baz.txt')
const r = new AbsolutePath('/foo')

p.resolve('more')      // → AbsolutePath('/foo/bar/baz.txt/more')
p.resolve('/other/x')  // → AbsolutePath('/other/x')
p.relativeTo(r)        // → RelativePath('bar/baz.txt')
p.descendsFrom(r)      // → true
```

### Constructing URL paths from strings or components

All URL path classes can be constructed from a URL string or from components:

```ts
const u1 = new RelativePathUrl('foo/bar?a=1#frag')
u1.pathname               // → '/foo/bar'

const u2 = new RootPathUrl('/foo/bar?a=1#frag')
u2.pathname               // → '/foo/bar'

const u3 = new FullPathUrl({
  origin: 'https://example.com',
  pathname: '/foo/bar',
  query: { a: '1' },
  fragment: 'frag'
})
u3.pathname               // → '/foo/bar'
```

### URL pathname handling

```ts
new RootPathUrl('/foo/bar/').isDirectory   // → true
new RootPathUrl('/foo/bar').filename       // → Filename('bar')
new RootPathUrl('/foo/bar/').unDirectory() // → RootPathUrl('/foo/bar')
```

### Queries

```ts
const u = new RootPathUrl('/foo?a=1&b=2')

u.query                     // → { a: '1', b: '2' }
u.mergeQuery({ a: '9' })    // → RootPathUrl('/foo?a=9&b=2')
u.replaceQuery({ q: 'x' })  // → RootPathUrl('/foo?q=x')
u.removeQuery()             // → RootPathUrl('/foo')
```

### Fragments

```ts
const u = new RootPathUrl('/foo#frag')

u.fragment                  // → 'frag'
u.replaceFragment('x')      // → RootPathUrl('/foo#x')
u.replaceFragment('#x')     // → RootPathUrl('/foo#x')
u.removeFragment()          // → RootPathUrl('/foo')
```

### join() and resolve() with query and fragment support

```ts
const u = new RootPathUrl('/foo?a=1#x')

u.join('bar?b=2#y')     // → RootPathUrl('/foo/bar?a=1&b=2#y')
u.resolve('/reset?z=3') // → RootPathUrl('/reset?z=3')
```

### FullPathUrl — full URL with origin

```ts
const u = new FullPathUrl('https://EXAMPLE.com:8080/foo?a=1#frag')

u.origin                     // → 'https://example.com:8080'
u.replaceOrigin('http://x')  // → FullPathUrl('http://x/foo')

u.toUrl()       // → URL('https://example.com:8080/foo?a=1#frag')
u.href          // → 'https://example.com:8080/foo?a=1#frag'
u.join('bar')   // → FullPathUrl('https://example.com:8080/foo/bar?a=1#frag')
u.rootPath      // → RootPathUrl('/foo?a=1#frag')

const r = new RootPathUrl('/bar')
new FullPathUrl('https://example.com').join(r) // → FullPathUrl('https://example.com/bar')
```

---


## Related

* [@thingts/fs-path](https://github.com/thingts/fs-path) – Adds filesystem access on top of **@thingts/path**, for Node.js environments.


## Contributing

Contributions are welcome!

As usual: fork the repo, create a feature branch, and open a
pull request, with tests and docs for any new functionality.  Thanks!

