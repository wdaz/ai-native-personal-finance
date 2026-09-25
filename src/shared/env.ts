export const WEBMCP_MODES = ["native", "polyfill", "off"] as const;

type EnvVars = Readonly<Record<string, string | undefined>>;

/**
 * TD-10: the hosts a database URL may name for a run that resets or seeds the database. The
 * whole 127.0.0.0/8 range and Unix sockets are not listed — nothing here uses them, and a
 * value that is not listed is refused, which is the safe way to be wrong.
 */
const LOCAL_DATABASE_HOSTS: readonly string[] = ["localhost", "127.0.0.1", "[::1]"];

/**
 * Is `url` a database URL whose host is this machine? Fails closed: the guard must read the URL
 * the way node-postgres (pg-connection-string) does, so a value is not local when
 * - it holds whitespace, or a `%` that is not followed by two hex digits. pg re-encodes the whole
 *   value with `encodeURI` when it holds a space or a malformed escape, and parses the result
 *   against the base `postgres://base` (measured 2026-09-25), so the string parsed here would not
 *   be the one the driver parses — `http://localhost\@evil.example.com/db` plus a trailing space
 *   connects to `evil.example.com` while `new URL(...).hostname` says `localhost`, and a leading
 *   space gives the host `base`. The guard refuses any whitespace, not only the space pg
 *   re-encodes on, and a `%` that ends the value: stricter than pg, on purpose, since the
 *   only cost of refusing more is a refused local URL;
 * - its scheme is not `postgres:` or `postgresql:`: both are non-special schemes, where a
 *   backslash never separates the host from the path, and a special one (`http:`) reads it as `/`;
 * - it does not parse, names no host (`postgresql:///db`), or carries a `host` or `hostaddr`
 *   query parameter. `?host=` matters: pg reads it over the URL's own host (measured 2026-09-24),
 *   so `postgresql://localhost/db?host=prod.example.com` connects to `prod.example.com` while
 *   `new URL(...).hostname` still says `localhost`.
 */
export function isLocalDatabaseUrl(url: string): boolean {
  if (/\s|%(?![0-9a-f]{2})/i.test(url)) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") return false;
  if (parsed.searchParams.has("host") || parsed.searchParams.has("hostaddr")) return false;
  return LOCAL_DATABASE_HOSTS.includes(parsed.hostname.toLowerCase());
}

/**
 * TD-10: why a run that resets or seeds the database named by `DATABASE_URL` must stop, or
 * `null` when it may go on. An unset `DATABASE_URL` is not refused here: there is nothing to
 * reset, and the first database call names the missing variable (`databaseUrl()`). The message
 * never contains the URL — it holds a password, and CI logs of a public repository are public —
 * so it is a static string that names every reason `isLocalDatabaseUrl` has, not the one that
 * applied: a URL that does name localhost is refused too when it holds whitespace or a malformed
 * escape, or has another scheme. Callers: `prisma.config.ts` (for `npm run db:reset`, before
 * `prisma migrate deploy` applies any migration; a direct `prisma migrate deploy` is not
 * guarded), `prisma/seed.ts`, `playwright.config.ts` and `testEnvRefusal` below, through which
 * `next.config.ts` and `isTestEnv` reach the check.
 */
export function localDatabaseRefusal(env: EnvVars): string | null {
  const url = env.DATABASE_URL;
  if (!url || isLocalDatabaseUrl(url)) return null;
  return (
    "Refusing to run: DATABASE_URL does not name this machine (localhost, 127.0.0.1 or [::1]) " +
    "or is not a plain postgres:// or postgresql:// URL (no whitespace, no host= or hostaddr= " +
    "query, no malformed % escape), and this step resets or seeds that database. Point " +
    "DATABASE_URL at the local database from compose.yaml (README, Run locally) — TD-10"
  );
}

/**
 * TD-10: why `APP_ENV=test` must not run here, or `null` when it may. The test-support routes
 * reset and seed the database without a session (SPEC-reset-and-test-support §2.7), so the
 * value is refused wherever a real database could be behind it:
 * - on a Vercel deployment — `VERCEL` and `VERCEL_ENV` exist at build and at runtime, but only
 *   while the project's "system environment variables" setting is on (vercel.com/docs, read
 *   2026-09-24), so this line alone would not be enough;
 * - with a `DATABASE_URL` that `localDatabaseRefusal` refuses — another machine, or a value the
 *   guard cannot read as local — the line that does not depend on any platform.
 * Deliberately not keyed on `NODE_ENV`: CI and every local API/E2E run start a production
 * build with `APP_ENV=test` (ADR-0003).
 */
export function testEnvRefusal(env: EnvVars): string | null {
  if (env.APP_ENV !== "test") return null;
  if (env.VERCEL || env.VERCEL_ENV) {
    return (
      "Refusing to run: APP_ENV=test on a Vercel deployment (VERCEL or VERCEL_ENV is set) would " +
      "expose the unauthenticated /api/test/* reset and seed routes — unset APP_ENV there — TD-10"
    );
  }
  if (localDatabaseRefusal(env) !== null) {
    return (
      "Refusing to run: APP_ENV=test with a DATABASE_URL that does not name this machine " +
      "(localhost, 127.0.0.1 or [::1]) or is not a plain postgres:// or postgresql:// URL (no " +
      "whitespace, no host= or hostaddr= query, no malformed % escape) would expose the " +
      "unauthenticated /api/test/* reset and seed routes on that database — TD-10"
    );
  }
  return null;
}
