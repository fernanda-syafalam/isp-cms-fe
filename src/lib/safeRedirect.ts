// Resolve a post-login redirect target from an attacker-controllable `?from=`
// search param (A6-M2). Only an internal, same-origin path is honored: it must
// start with a single `/` and not `//` (protocol-relative, e.g. `//evil.com`)
// nor be an absolute URL (`http://evil`). Anything else falls back to `/`.
export function safeInternalPath(from: string | undefined | null): string {
  if (from?.startsWith('/') && !from.startsWith('//')) return from
  return '/'
}
