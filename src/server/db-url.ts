// `prefer`, `require` and `verify-ca` as one `sslmode` query parameter — case-sensitive and whole
// (`required` is not one), the way `pg-connection-string` switches on it — with the `?` or `&`
// that opens it, so text in the userinfo or in another parameter's value is not read as one.
const WEAK_SSLMODE = /([?&])sslmode=(?:prefer|require|verify-ca)(?=&|#|$)/g;

// A URL that asks for libpq semantics has chosen them; it is left as its owner wrote it.
const LIBPQ_COMPAT = /[?&]uselibpqcompat=/;

/**
 * The connection string `pg` gets, with `sslmode` naming what `pg` 8 already does (TD-20).
 *
 * `pg` 8 (`pg-connection-string` 2.14.0) reads `sslmode=prefer`, `require` and `verify-ca` as
 * `verify-full` — the server's certificate is verified — and prints a warning that `pg` 9 will read
 * them the libpq way: encrypted, certificate not verified. The Neon–Vercel integration writes
 * `sslmode=require`, so a move to `pg` 9 (through `@prisma/adapter-pg`, an override, or a Dependabot
 * pull request) would drop verification on the path to Neon and nothing would fail. Writing
 * `verify-full` keeps today's behaviour on both, silences the warning, and is what the warning itself
 * recommends. Only those three values change, as text: the rest of the URL — userinfo, host, the
 * other parameters — is byte for byte what was given.
 *
 * Not covered: the schema engine that `prisma migrate deploy` runs at build time reads the URL
 * itself (`prisma.config.ts`), and whether it verifies the certificate under `sslmode=require` was
 * not checked.
 */
export function withVerifiedSsl(connectionString: string): string {
  if (LIBPQ_COMPAT.test(connectionString)) return connectionString;
  return connectionString.replace(WEAK_SSLMODE, "$1sslmode=verify-full");
}
