// `prefer`, `require` and `verify-ca` as one `sslmode` query parameter — case-sensitive and whole
// (`required` is not one) — with the `?` or `&` that opens it. It is matched against the query
// only (see `rewriteQuery`), so text in the userinfo or the fragment is not read as one.
const WEAK_SSLMODE = /([?&])sslmode=(?:prefer|require|verify-ca)(?=&|$)/g;
const WEAK_SSLMODES: ReadonlySet<string> = new Set(["prefer", "require", "verify-ca"]);

/**
 * The last value of a query parameter as `pg-connection-string` reads it — percent-decoded, with
 * the tabs and newlines the URL parser strips gone, the last occurrence winning — or `undefined`
 * when the string is not a URL this parser reads (`pg` has fallbacks of its own for those; they
 * are not repeated here).
 */
function lastParam(connectionString: string, name: string): string | undefined {
  try {
    return new URL(connectionString, "postgres://base").searchParams.getAll(name).at(-1);
  } catch {
    return undefined;
  }
}

/** The weak modes rewritten in the query, and nothing before `?` or after `#`. */
function rewriteQuery(connectionString: string): string {
  const start = connectionString.indexOf("?");
  if (start === -1) return connectionString;
  const hash = connectionString.indexOf("#", start);
  const end = hash === -1 ? connectionString.length : hash;
  return (
    connectionString.slice(0, start) +
    connectionString.slice(start, end).replace(WEAK_SSLMODE, "$1sslmode=verify-full") +
    connectionString.slice(end)
  );
}

/**
 * The connection string `pg` gets, with `sslmode` naming what `pg` 8 already does (TD-20).
 *
 * `pg` 8 (`pg-connection-string` 2.14.0) reads `sslmode=prefer`, `require` and `verify-ca` as
 * `verify-full` — the server's certificate is verified — and prints a warning that `pg` 9 will read
 * them the libpq way: encrypted, certificate not verified. The Neon–Vercel integration writes
 * `sslmode=require`, so a move to `pg` 9 — which reaches the app through an adapter release or an
 * override, `pg` itself being a devDependency here — would drop verification on the path to Neon and
 * nothing would fail. Writing `verify-full` keeps today's behaviour on both (pg 9's is inferred from
 * `pg-connection-string`'s `useLibpqCompat` emulation, not run), silences the warning, and is what the
 * warning itself recommends.
 *
 * Only those three values change, and as text in the query: the userinfo, the host, the other
 * parameters and the fragment are what was given. A URL that asks for libpq semantics with
 * `uselibpqcompat=true` — the only value `pg` honours — has chosen them and is left as written.
 * `pg` reads the *decoded* parameters, though, and this rewrite reads the raw text: after it, a weak
 * mode that is still there (percent-encoded, or split by a tab or a newline) is refused with an
 * error instead of being passed on, since passing it on is the regression this guards against.
 *
 * Not covered: the schema engine that `prisma migrate deploy` runs at build time reads the URL
 * itself (`prisma.config.ts`), and whether it verifies the certificate under `sslmode=require` was
 * not checked.
 */
export function withVerifiedSsl(connectionString: string): string {
  if (lastParam(connectionString, "uselibpqcompat") === "true") return connectionString;
  const rewritten = rewriteQuery(connectionString);
  const mode = lastParam(rewritten, "sslmode");
  if (mode !== undefined && WEAK_SSLMODES.has(mode)) {
    // No part of the URL in the message: it carries the password.
    throw new Error(
      "DATABASE_URL names an sslmode (prefer, require or verify-ca) in a form that cannot be " +
        "rewritten safely: write it as sslmode=verify-full (TD-20)",
    );
  }
  return rewritten;
}
