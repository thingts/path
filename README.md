# @thingts/path

[![npm version](https://img.shields.io/npm/v/@thingts/path.svg)](https://www.npmjs.com/package/@thingts/path)
[![docs](https://img.shields.io/badge/docs-typedoc-blue)](https://thingts.github.io/path/)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/thingts/path/ci.yml)](https://github.com/thingts/path/actions/workflows/ci.yml)
[![GitHub License](https://img.shields.io/github/license/thingts/path)](LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@thingts/path)](https://bundlephobia.com/package/@thingts/path)


Type-safe, ergonomic package for working with paths and filenames, both plain and in URLs, in pure TypeScript (browser-safe, no dependencies).

## Why?

Instead of tedious and error-prone juggling raw strings with `indexOf()`, `slice()`,
regexes, or [node:path](https://nodejs.org/api/path.html), this package
provides ergonomic, semantically meaningful types for file paths and
URL paths.

## Features

* Pure typescript, no dependencies on node.js or other runtimes
* Immutable, chainable path objects with type-safe operations
* All paths are normalized on construction
* Easy access to path parts (filename, stem, extension, parent)
* Path transformations (replace stem/extension/parent, transform filename, etc)
* Path navigation (join, resolve, relativeTo, descendsFrom, etc)

Together these features give you a safer, more expressive way to work with file, directory, and URL paths.

> ⚠️ Currently only POSIX-style paths are supported (e.g. `/foo/bar`).

> 💡 This package does not do any filesystem access, it is only for manipulating path strings.  For filesystem access, see [`@thingts/fs-path`](https://github.com/thingts/fs-path) which builds on this package.

## Installation

```bash
npm install @thingts/path
```

## Overview

A path is essentially a collection of segments separated by slashes.  Paths
can be either:

* *absolute* - beginning with a slash, e.g. `/foo/bar`
* *relative* - not beginning with a slash, e.g. `foo/bar`

The last component of a path is referred to as its *filename* (e.g. `baz.txt` in
`/foo/bar/baz.txt`), which can be further separated into a *stem* and
optional *extension* (e.g. `baz` and `.txt`).

**@thingts/path** provides the following classes:


| Class Name  | Path Behavior | Type
|--|--|--
| `Filename` | *filename* | plain
| `RelativePath` | *relative* |  plain
| `RelativePathUrl` | *relative* | URL 
| `AbsolutePath` | *absolute* | plain
| `RootPathUrl` | *absolute* | URL
| `FullPathUrl` | *absolute* | URL with origin

All classes are immutable.  All classes are automatically normalized on
construction: repeated slashes are merged, and `.` and `..` components are
resolved.  All classes have a `.toString()` method that returns the string
representation of the path in canonical form, and a `.equals()` method for
comparing against another path of the same type or a string.

See the sections below for discussion of each behavior, and see
[PathURLs](#pathurls) below for discussion of URL paths.

For complete docs, see the [API Reference](https://thingts.github.io/path).

Note, the non-URL path classes are normalized according to POSIX rules, with
trailing slashes removed.  See below for discussion of URL paths.

### Filename

All the path classes have a `.filename` property that returns a `Filename`
object.  The filename class has properties for accessing the `stem` and
`extension`, and methods for transforming them.

```ts
// Example using `AbsolutePath` but same API for all path classes
const path = new AbsolutePath('/foo/bar/baz.txt')

path.filename                // → Filename('baz.txt')
path.stem                    // → 'baz'  -- shorthand for path.filename.stem
path.extension               // → '.txt' -- shorthand for path.filename.extension
path.replaceStem('report')   // → AbsolutePath('/foo/bar/report.txt')
path.replaceExtension('.md') // → AbsolutePath('/foo/bar/report.md')
```

### Relative Paths

There are two kinds of relative paths:  `RelativePath` and
`RelativePathUrl`.  In addition to the filename methods, they support path
manipulation and navigation methods:

```ts
// Example using `RelativePath` but same API for `RelativePathUrl`
const path = new RelativePath('foo/bar/baz.txt')

path.segments                // → ['foo', 'bar', 'baz.txt']
path.parent                  // → RelativePath('foo/bar')
path.replaceParent('other')  // → RelativePath('other/baz.txt')
path.join('more', 'files')   // → RelativePath('foo/bar/baz.txt/more/files')
```

Note that the `.join()` method accepts Filename or relative path arguments
for type safety, but you can also pass strings for convenience.  In the
case of strings, they are interpreted as relative paths or filenames
regardless of whether they start with leading slashes or url schemes, with
the results being normalized.  e.g.

```ts
const path = new RelativePath('foo/bar')
const abs  = new AbsolutePath('/more/files')

path.join(abs)           // ❌ Typescript error
path.join('/more/files') // → RelativePath('foo/bar/more/files')
```

### AbsolutePaths

There are three kinds of absolute paths:  `AbsolutePath`, `RootPathUrl`,
and `FullPathUrl`.  In addition to the filename and relative path methods,
they provide a `.resolve()` method which is similar to `.join()`, but
accepts absolute paths as overrides, plus some additional methods specific
to absolute paths:

```ts
// Absolute paths
const path = new AbsolutePath('/foo/bar/baz.txt')

path.resolve('more', 'files')                // → AbsolutePath('/foo/bar/baz.txt/more/files') same as .join()
path.resolve('more', '/other/path', 'files') // → AbsolutePath('/other/path/files')
path.descendsFrom('/foo')                    // → true
path.relativeTo('/foo')                      // → RelativePath('bar/baz.txt')
```

---

### Path URLs<a name="pathurls"></a>


In addition to plain paths, **@thingts/path** also provides classes
for working with the kinds of URLs that have paths, also known as [URIs with hierarchical
schemes](https://www.rfc-editor.org/rfc/rfc3986#section-1.2.3)): `http://`,
`https://`, `ftp://`, `ftps://`, `ws://`, `wss://`, and `file://`

* `FullPathUrl` - A complete URL having origin, pathname, and optional query parameters and fragment, e.g. `https://example.com/foo/bar?query=1#fragment`
* `RootPathUrl` - A root-relative URL having pathname beginning with '/', and optional query parameters and fragment, e.g.  `/foo/bar?query=1#fragment`
* `RelativePathUrl` - A relative URL having pathname not beginning with '/', and optional query parameters and fragment, e.g.  `foo/bar?query=1#fragment`

URL path classes can be constructed from strings (which will be parsed to
extract the components), or from components directly:

```ts
const url1 = new FullPathUrl('https://example.com:8080/foo/bar/baz.txt?query=1#frag')
const url2 = new FullPathUrl({
  origin: 'https://example.com:8080',
  pathname: '/foo/bar/baz.txt',
  query: { query: '1' },
  fragment: 'frag'
})
```

The URL path classes inherit all the same path manipulation methods
described above, but with URL-specific normalization, and added support for
origins, queries, fragments, directory paths, and URL-specific join/resolve
behavior.  See discussions below, and complete details at the [API
Reference](https://thingts.github.io/path).


#### URL Normalization & Percent-Encoding

On construction, URL path classes normalize the path and origin:

* As with plain paths, repeated slashes are merged, and `.` and `..` components are resolved.
* Unlike plain paths, trailing slashes are preserved to indicate directory paths (see below).
* In `FullPathUrl`, the origin is normalized to lowercase scheme and host.
* Percent-encoded characters in the origin and pathname are *not* decoded, they are preserved as-is.

When converting to a string, the result is encoded as needed:
* Illegal characters in the pathname, query, or fragment are percent-encoded.
* Existing percent-encoded characters in the pathname, query, or fragment are preserved as-is (not double-encoded).

```ts
// Example using FullPathUrl.  Same API for RootPathUrl and RelativePathUrl, but without origin
const url = new FullPathUrl({
    origin: 'HTTPS://Example.com:8080',
    pathname: '/foo bar/baz.txt',
    query: { 'a b': 'c d??' },
    fragment: 'my fragment #1'
    })

url.origin   // → 'https://example.com:8080'
url.pathname // → '/foo bar/baz.txt'
url.query    // → { 'a b': 'c d??' }
url.fragment // → 'my fragment #1'
url.toString() // → 'https://example.com:8080/foo%20bar/baz.txt?a%20b=c%20d%3F%3F#my%20fragment%20%231'
```

#### URL pathname -- directory vs non-directory paths

Unlike the plain path classes, URL path classes do not automatically remove
trailing slashes from pathnames, since in URLs a trailing slash is
significant -- it nominally signifies a directory (e.g.
`http://example.com/foo/bar/`) vs a file or resource.

If a URL path's pathname ends with a slash, it is considered a *directory*,
and its filename is undefined.  If it does not end with a slash, its final
segment is considered the filename, same as for plain paths.

URL paths have the following extra properties and behaviors for working
with directory paths:

```ts
// Example using RootPathUrl, same API for all other PathUrl classes

const url1 = new RootPathUrl('/foo/bar/') // directory path
url1.isDirectory   // → true
url1.filename      // → undefined
url1.stem          // → undefined
url1.extension     // → undefined
url1.segments      // → ['foo', 'bar']
url1.parent        // → RootPathUrl('/foo/')
url1.unDirectory() // → RootPathUrl('/foo/bar')
url1.join('baz/')  // → RootPathUrl('/foo/bar/baz/')
url1.join('baz')   // → RootPathUrl('/foo/bar/baz')

const url2 = new RootPathUrl('/foo/bar')  // file path
url2.isDirectory         // → false
url2.filename            // → Filename('bar')
url2.stem                // → 'bar'
url2.extension           // → ''
url2.segments            // → ['foo', 'bar']
url2.parent              // → RootPathUrl('/foo/')
url2.join('/')           // → RootPathUrl('/foo/bar/')
```

Note that `.parent` always returns a directory path, and that joining with
a trailing slash creates a directory path.   `.unDirectory()` can be used
to convert a directory path to a file path by removing the trailing slash.

#### URL Queries

In a URL string, the query string is the part after the `?`, used to specify a set of key-value parameters.
PathURL classes provide access to the query parameters via the `.query`
property, and methods for modifying them immutably.  

Note there is a distinction between an *empty query* (the URL string has a
`?` but no parameters) and *no query* (the URL string has no `?`):

```ts
// Example using RelativePathUrl, API is the same for all Path URl classes
const url1 = new RelativePathUrl('foo/bar?key=value1&key=value2&other=val')
url1.query // → { key: ['value1', 'value2'], other: 'val' }

const url2 = new RelativePathUrl('foo/bar?')
url2.query // → {}

const url3 = new RelativePathUrl('foo/bar')
url3.query // → undefined
```

There are three operations for modifying the query, each as usual returns a
new immutable PathURL object:

* `.replaceQuery(obj)` - removes all existing query parameters and replaces them with `obj`

* `.mergeQuery(obj)` - overwrites the values of the existing query for whichever keys are given in `obj`.

    If there is no current query, or if the current query is empty,
    `.mergeQuery(obj)` has the same effect as `.replaceQuery(obj)`

    Merging new values by combining them with existing values in an array-valued key must be
    done manually, e.g.: `url.mergeQuery({ key: [...url.query.key, 'newvalue'] })`

* `.removeQuery()` - removes the query entirely (sets it to `undefined`)

e.g.:

```ts
// Example using `RootPathUrl`, API is the same for all other Path URL classes
const url = new RootPathUrl('/foo/bar?query=1#frag')

url.query                       // → { query: '1' }
url.mergeQuery({ query: '2' })  // → RootPathUrl('/foo/bar?query=2')
url.mergeQuery({ page: '3' })   // → RootPathUrl('/foo/bar?query=1&page=3')
url.replaceQuery({ page: '3' }) // → RootPathUrl('/foo/bar?page=3')
url.replaceQuery({})            // → RootPathUrl('/foo/bar?')
url.removeQuery()               // → RootPathUrl('/foo/bar')
```


#### URL Fragments

In a URL string, the fragment is the trailing part of the string, after the '#'.

Note there is a distinction between an *empty fragment* (i.e. URL ends with '#') and *no fragment* (i.e. URL has no '#' after the path):

```ts
// Example using RelativePathUrl, API is the same for all Path URl classes
const url1 = new RelativePathUrl('foo/bar#frag')
url1.fragment // → 'frag'

const url2 = new RelativePathUrl('foo/bar#')
url2.fragment // → ''

const url3 = new RelativePathUrl('foo/bar')
url3.fragment // → undefined
```

There are two operations for modifying the fragment, each as usual returning a
new immutable PathURL object:

* `.replaceFragment(str)` - sets the fragment to the given string (can be
  an empty string).  As a convenience, `.replaceFragment(str)` will strip off a
  single leading `#` from the string.  If you actually want to have a
  fragment that starts with a `#`, put an additional `#` in front.

* `.removeFragment()` - removes the fragment entirely (sets it to `undefined`)

```ts
// Example using `RootPathUrl`, API is the same for all other Path URL classes
const url = new RootPathUrl('/foo/bar#frag')

url.replaceFragment('newFrag')     // → RootPathUrl('/foo/bar#newFrag')
url.replaceFragment('#newFrag')    // → RootPathUrl('/foo/bar#newFrag')
url.replaceFragment('##extraHash') // → RootPathUrl('/foo/bar##extraHash')
url.replaceFragment('')            // → RootPathUrl('/foo/bar#')
url.replaceFragment('#')           // → RootPathUrl('/foo/bar#')
url.removeFragment()               // → RootPathUrl('/foo/bar')
```

#### URL `join()` & `resolve()`

The `.join()` and `.resolve()` methods on URL path classes work the same as
for plain paths, but they additionally handle queries and fragments
alongside the path segments.

* `join(args)` - 

    As the args are processed, any query parameters encountered are merged
    into the resulting URL's query using the semantics of `.mergeQuery()`,
    and any fragment replaces the current fragment.  For example:

    ```ts
    const url    = new RootPathUrl('/foo/bar?x=1#frag')
    const result = url.join('more', '/other/path?x=2&y=2#fragB', 'final.txt#fragC')
            // → RootPathUrl('/foo/bar/more/other/path/final.txt?x=2&y=2#fragC')
    ```

    It's not possible to remove an existing query parameter or the entire query or an existing framgent using `.join()`.

* `resolve(args)` (only for RootPathUrl and FullPathUrl)

    As the args are processed, if a root-relative path is encountered, the
    current query and fragment are discarded and replaced by those of the
    new path (if it has any).

    In the case of `FullPathUrl`, if an arg is a full URL it will replace
    the entire current URL.  For example:

    ```ts
    const url    = new RootPathUrl('/foo/bar?x=1#frag')
    const result = url.resolve('more', '/other/path?x=2&y=2#frag', 'final.txt#newfrag')
            // → RootPathUrl('/other/path/final.txt?x=2&y=2#newfrag')

    const fullUrl = new FullPathUrl('https://example.com/foo/bar?x=1#frag')
    const result2 = fullUrl.resolve('more', 'https://other.com/other/path?z=3', 'again')
            // → FullPathUrl('https://other.com/other/path/again?z=3')
    ```

#### FullPathUrl

`FullPathUrl` has a few extra features:

* The constructor verifies that the given scheme is one of the hierarchical schemes 
  (`http://`,
  `https://`, `ftp://`, `ftps://`, `ws://`, `wss://`, and `file://`); it
  will throw an error if given any other scheme (e.g.  `mailto:`,`data:`,
  etc).

  ```ts
  const url = new FullPathUrl('mailto:user@example.com') // ❌ throws Error: Invalid URL scheme 'mailto:'
  ```

* The constructor accepts native URL objects in addition to as strings and component

  ```ts
  const url = new FullPathUrl(new URL("https://example.com/foo/bar")) // → FullPathUrl('https://example.com/foo/bar')
  ```

* `origin` - access and modify:

    ```ts
    const url = new FullPathUrl('https://example.com:8080/foo/bar/baz.txt')
    url.origin                           // → 'https://example.com:8080'
    url.replaceOrigin('wss://other.com') // → FullPathUrl('wss://other.com/foo/bar/baz.txt')
    ```

* `toURL()` - returns a native URL object:

    ```ts
    const url = new FullPathUrl('https://example.com:8080/foo/bar/baz.txt?query=1#frag')
    url.toUrl() // → URL object: new URL('https://example.com:8080/foo/bar/baz.txt?query=1#frag')
    ```

* `.href` - As a convenience, an alias for `toString()`

    ```ts
    const url = new FullPathUrl('https://example.com:8080/foo/bar/baz.txt?query=1#frag')
    url.href // -> 'https://example.com:8080/foo/bar/baz.txt?query=1#frag'
    ```

* `.rootPathUrl` - return a `RootPathUrl` instance that is the same as this
   but without the origin:

    ```ts
    const url = new FullPathUrl('https://example.com:8080/foo/bar/baz.txt?query=1#frag')
    url.rootPathUrl // → RootPathUrl('/foo/bar/baz.txt?query=1#frag')
    ```


---



## Related

* [@thingts/fs-path](https://github.com/thingts/fs-path) – Adds filesystem access on top of **@thingts/path**, for Node.js environments.


## Contributing

Contributions are welcome!

As usual: fork the repo, create a feature branch, and open a
pull request, with tests and docs for any new functionality.  Thanks!
