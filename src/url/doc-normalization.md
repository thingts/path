On construction, URL path classes normalize the path:
 * As with plain paths, repeated slashes are merged, and `.` and `..` components are resolved.
 * Unlike plain paths, trailing slashes are preserved to indicate directory paths (see {@link isDirectory `.isDirectory`}).
 * Percent-encoded characters in the pathname (nor other parts) are *not* decoded, they are preserved as-is.
