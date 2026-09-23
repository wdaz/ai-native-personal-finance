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

const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

/**
 * ADR-0006: `bcrypt.compare` against a mangled or missing hash never throws — it just always
 * returns `false`, so a config mistake here shows up as every login silently failing rather
 * than a clear startup error. This throws instead, on both "unset" and "not a real bcrypt
 * hash" (the shape a `\$`-escaped value produces when it reaches the app un-un-escaped —
 * README, "Demo credentials").
 */
export function demoPasswordHash(env: Env = process.env): string {
  const hash = env.DEMO_PASSWORD_HASH;
  if (!hash) {
    throw new Error(
      "DEMO_PASSWORD_HASH is not set: copy .env.example to .env.local (README, Demo credentials)",
    );
  }
  if (!BCRYPT_HASH.test(hash)) {
    throw new Error(
      "DEMO_PASSWORD_HASH is not a $2[aby]$NN$... bcrypt hash — check it wasn't \\$-escaped " +
        "where it shouldn't have been (README, Demo credentials)",
    );
  }
  return hash;
}

export type DemoCredentials = Readonly<{ email: string; password: string }>;

/**
 * ADR-0006, SPEC-auth §2.2, §2.6: the demo account the login page shows and the sign-up
 * notice repeats — `DEMO_EMAIL` and the plain-text `DEMO_PASSWORD_DISPLAY`. Like
 * `demoPasswordHash`, a missing value throws instead of rendering an empty demo box.
 */
export function demoCredentials(env: Env = process.env): DemoCredentials {
  const email = env.DEMO_EMAIL;
  const password = env.DEMO_PASSWORD_DISPLAY;
  if (!email || !password) {
    throw new Error(
      "DEMO_EMAIL and DEMO_PASSWORD_DISPLAY must both be set: copy .env.example to .env.local " +
        "(README, Demo credentials)",
    );
  }
  return { email, password };
}

/**
 * SPEC-app-shell §2.1, ADR-0007: Chrome's WebMCP origin-trial token, registered for the
 * production hostname only. Unset, empty or blank → none, and the layout renders no tag.
 */
export function webmcpOriginTrialToken(env: Env = process.env): string | null {
  const token = env.WEBMCP_ORIGIN_TRIAL_TOKEN?.trim();
  return token ? token : null;
}
