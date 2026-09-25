import type { MetaDto } from "@/src/shared/schemas";
import type { Db } from "./db";
import { configuredWebmcpMode, resetIntervalDays, webmcpOriginTrialToken, type Env } from "./env";
import { latestReset } from "./reset";

/**
 * The request header through which `proxy.ts` hands the `(app)` layout the latest
 * `ResetLog.at` it has already read for the session check, so a page render makes no second
 * read (PR #20 review). The proxy always deletes a client-sent copy first.
 */
export const LAST_RESET_AT_HEADER = "x-last-reset-at";

const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

/** The forwarded value, only in `Date#toISOString()` form; anything else is `null`. */
export function parseForwardedResetAt(value: string | null): Date | null {
  if (value === null || !ISO_INSTANT.test(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) || date.toISOString() !== value ? null : date;
}

/**
 * SPEC-app-shell §2.1, §5: the one place the meta DTO is assembled. The `(app)` layout calls it
 * directly (no HTTP self-call), passing the reset time the proxy forwarded. `GET /api/meta`
 * passes none, so it reads the database. Throws when there is no reset to report
 * (`latestReset`) or the configuration is invalid.
 */
export async function getMeta(
  db: Db,
  env: Env = process.env,
  knownLastResetAt: Date | null = null,
): Promise<MetaDto> {
  const lastResetAt = knownLastResetAt ?? (await latestReset(db));
  return {
    lastResetAt: lastResetAt.toISOString(),
    resetIntervalDays: resetIntervalDays(env),
    webmcp: {
      configuredMode: configuredWebmcpMode(env),
      originTrial: webmcpOriginTrialToken(env) !== null,
    },
  };
}
