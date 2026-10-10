/**
 * The key both rate limiters count against (SPEC-auth §4, SPEC-write-path 2.10): the first
 * `x-forwarded-for` entry. Vercel overwrites this header rather than trusting an inbound one, so
 * it's safe to read there (a self-hosted deployment behind a different proxy would need the same
 * guarantee — review finding M4). Locally, next start supplies a loopback address, not undefined,
 * so the "local" fallback below only fires when the header is genuinely absent (e.g. a direct,
 * non-proxied connection this project doesn't otherwise exercise).
 */
export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}
