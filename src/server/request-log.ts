import { VIA_WEBMCP } from "@/src/shared/via";
import { isTestEnv, type Env } from "./env";

/** SPEC-webmcp-tools §5: a ring buffer of 200 in test mode; structured stdout otherwise. */
export const REQUEST_LOG_CAPACITY = 200;

export type ViaLogEntry = { requestId: string; via: typeof VIA_WEBMCP; route: string };

// middleware.ts and the route handlers are compiled as separate bundles, so a module-level
// buffer written by one would not be the one the other reads. Like the Prisma client
// (src/server/db.ts), the buffer lives on globalThis. A Map keeps insertion order, so its
// first key is always the oldest entry.
const holder = globalThis as typeof globalThis & { __pfViaLog?: Map<string, ViaLogEntry> };

/**
 * SPEC-webmcp-tools §2.8: an API request a WebMCP tool made is recorded under the response's
 * `X-Request-Id`. Only the exact marker is recorded — never an arbitrary header value.
 */
export function recordViaRequest(
  via: string | null,
  requestId: string,
  route: string,
  env: Env = process.env,
  write: (line: string) => void = console.log,
): void {
  if (via !== VIA_WEBMCP) return;
  const entry: ViaLogEntry = { requestId, via: VIA_WEBMCP, route };
  if (!isTestEnv(env)) {
    write(JSON.stringify(entry));
    return;
  }
  const log = (holder.__pfViaLog ??= new Map());
  log.set(requestId, entry);
  if (log.size > REQUEST_LOG_CAPACITY) {
    const oldest = log.keys().next().value;
    if (oldest !== undefined) log.delete(oldest);
  }
}

export function findViaRequest(requestId: string): ViaLogEntry | undefined {
  return holder.__pfViaLog?.get(requestId);
}
