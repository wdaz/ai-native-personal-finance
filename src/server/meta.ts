import type { MetaDto } from "@/src/shared/schemas";
import type { Db } from "./db";
import { configuredWebmcpMode, resetIntervalDays, webmcpOriginTrialToken, type Env } from "./env";
import { latestReset } from "./reset";

/**
 * SPEC-app-shell §2.1, §5: the one place the meta DTO is assembled. The `(app)` layout calls it
 * directly (no HTTP self-call) and `GET /api/meta` answers with it. Throws when there is no
 * reset to report (`latestReset`) or the configuration is invalid.
 */
export async function getMeta(db: Db, env: Env = process.env): Promise<MetaDto> {
  const lastResetAt = await latestReset(db);
  return {
    lastResetAt: lastResetAt.toISOString(),
    resetIntervalDays: resetIntervalDays(env),
    webmcp: {
      configuredMode: configuredWebmcpMode(env),
      originTrial: webmcpOriginTrialToken(env) !== null,
    },
  };
}
