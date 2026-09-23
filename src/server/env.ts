import { WEBMCP_MODES } from "@/src/shared/env";

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

/**
 * A documented default when the variable is unset or empty (.env.example: "Default 10",
 * "Defaults 2000 rows / 50 MB"); a value that is set but is not a positive whole number is a
 * configuration mistake and throws, like the accessors above (T-08 plan D10).
 */
function positiveInt(name: string, raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive whole number (.env.example), not "${raw}"`);
  }
  return value;
}

/** SPEC-app-shell §5: the banner's "every {days} days". */
export function resetIntervalDays(env: Env = process.env): number {
  return positiveInt("RESET_INTERVAL_DAYS", env.RESET_INTERVAL_DAYS, 10);
}

/** SPEC-reset-and-test-support §2.4: user-created rows before a threshold reset. */
export function resetRowThreshold(env: Env = process.env): number {
  return positiveInt("RESET_ROW_THRESHOLD", env.RESET_ROW_THRESHOLD, 2000);
}

/** SPEC-reset-and-test-support §2.4: database size in bytes before a threshold reset. */
export function resetBytesThreshold(env: Env = process.env): number {
  return positiveInt("RESET_BYTES_THRESHOLD", env.RESET_BYTES_THRESHOLD, 52_428_800);
}

/** SPEC-reset-and-test-support §2.2: the admin reset's Bearer secret. No default. */
export function resetSecret(env: Env = process.env): string {
  const secret = env.RESET_SECRET;
  if (!secret) {
    throw new Error("RESET_SECRET is not set: copy .env.example to .env.local (README)");
  }
  return secret;
}

/**
 * SPEC-reset-and-test-support §2.3: the secret Vercel sends on a scheduled call. Unset outside
 * a Vercel deployment, so it is optional — and `null`, never `""`, so that an empty value can
 * never be what a missing Authorization header matches (T-08 plan D7).
 */
export function cronSecret(env: Env = process.env): string | null {
  const secret = env.CRON_SECRET;
  return secret ? secret : null;
}

export type WebMcpMode = (typeof WEBMCP_MODES)[number];

/** SPEC-app-shell §5 `webmcp.configuredMode`; .env.example: "Default polyfill". */
export function configuredWebmcpMode(env: Env = process.env): WebMcpMode {
  const mode = env.WEBMCP_MODE;
  if (!mode) return "polyfill";
  const known = WEBMCP_MODES.find((m) => m === mode);
  if (!known) {
    throw new Error(`WEBMCP_MODE must be one of ${WEBMCP_MODES.join(", ")}, not "${mode}"`);
  }
  return known;
}
