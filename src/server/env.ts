/**
 * Server-side environment. Read on every call rather than captured at import, so a route
 * handler sees the environment of the process it runs in and a test can pass its own.
 */
export type Env = Readonly<Record<string, string | undefined>>;

/**
 * SPEC-reset-and-test-support §2.7: the test-support routes exist only when
 * `APP_ENV=test`. An exact match — `Test`, `test ` and an unset variable are not test.
 */
export function isTestEnv(env: Env = process.env): boolean {
  return env.APP_ENV === "test";
}

/** ADR-0005: Postgres through Prisma. `.env.example` documents the variable. */
export function databaseUrl(env: Env = process.env): string {
  const url = env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set: copy .env.example to .env.local (README, Run locally)",
    );
  }
  return url;
}
