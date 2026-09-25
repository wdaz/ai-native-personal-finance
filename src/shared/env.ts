export const WEBMCP_MODES = ["native", "polyfill", "off"] as const;

type EnvVars = Readonly<Record<string, string | undefined>>;

/**
 * TD-10: the hosts a database URL may name for a run that resets or seeds the database. The
 * whole 127.0.0.0/8 range and Unix sockets are not listed — nothing here uses them, and a
 * value that is not listed is refused, which is the safe way to be wrong.
 */
const LOCAL_DATABASE_HOSTS: readonly string[] = ["localhost", "127.0.0.1", "[::1]"];

/**
 * Is `url` a database URL whose host is this machine? Fails closed: a value that does not
 * parse, names no host (`postgresql:///db`), or carries a `host` or `hostaddr` query parameter
 * is not local. `?host=` matters: node-postgres reads it over the URL's own host (measured
 * 2026-09-24 with pg-connection-string), so `postgresql://localhost/db?host=prod.example.com`
 * connects to `prod.example.com` while `new URL(...).hostname` still says `localhost`.
 */
export function isLocalDatabaseUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.searchParams.has("host") || parsed.searchParams.has("hostaddr")) return false;
  return LOCAL_DATABASE_HOSTS.includes(parsed.hostname.toLowerCase());
}

/**
 * TD-10: why a run that resets or seeds the database named by `DATABASE_URL` must stop, or
 * `null` when it may go on. An unset `DATABASE_URL` is not refused here: there is nothing to
 * reset, and the first database call names the missing variable (`databaseUrl()`). The message
 * never contains the URL — it holds a password, and CI logs of a public repository are public.
 */
export function localDatabaseRefusal(env: EnvVars): string | null {
  const url = env.DATABASE_URL;
  if (!url || isLocalDatabaseUrl(url)) return null;
  return (
    "Refusing to run: DATABASE_URL does not name this machine (localhost, 127.0.0.1 or [::1]), " +
    "and this command resets or seeds that database. Point DATABASE_URL at the local " +
    "database from compose.yaml (README, Run locally) — TD-10"
  );
}

/**
 * TD-10: why `APP_ENV=test` must not run here, or `null` when it may. The test-support routes
 * reset and seed the database without a session (SPEC-reset-and-test-support §2.7), so the
 * value is refused wherever a real database could be behind it:
 * - on a Vercel deployment — `VERCEL` and `VERCEL_ENV` exist at build and at runtime, but only
 *   while the project's "system environment variables" setting is on (vercel.com/docs, read
 *   2026-09-24), so this line alone would not be enough;
 * - with a `DATABASE_URL` that names another machine (`localDatabaseRefusal`) — the line that
 *   does not depend on any platform.
 * Deliberately not keyed on `NODE_ENV`: CI and every local API/E2E run start a production
 * build with `APP_ENV=test` (ADR-0003).
 */
export function testEnvRefusal(env: EnvVars): string | null {
  if (env.APP_ENV !== "test") return null;
  if (env.VERCEL || env.VERCEL_ENV) {
    return (
      "Refusing to run: APP_ENV=test on a Vercel deployment (VERCEL is set) would expose the " +
      "unauthenticated /api/test/* reset and seed routes — unset APP_ENV there — TD-10"
    );
  }
  if (localDatabaseRefusal(env) !== null) {
    return (
      "Refusing to run: APP_ENV=test with a DATABASE_URL that does not name this machine " +
      "(localhost, 127.0.0.1 or [::1]) would expose the unauthenticated /api/test/* reset and " +
      "seed routes on that database — TD-10"
    );
  }
  return null;
}
