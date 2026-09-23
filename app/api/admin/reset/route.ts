import { handleAdminReset } from "@/src/server/admin-reset";

/** SPEC-reset-and-test-support §2.2: an operator's reset, `reason` from the body. */
export async function POST(request: Request): Promise<Response> {
  return handleAdminReset("POST", request, new Date());
}

/**
 * SPEC-reset-and-test-support §2.3 (v1.4): Vercel's daily cron invokes its path with a bodyless
 * GET and the `CRON_SECRET` as a Bearer token (vercel.com/docs/cron-jobs, read 2026-09-23; T-08
 * plan Q1); the handler resets only when the interval has passed. System time comes from here:
 * src/server reads no clock (ADR-0005).
 */
export async function GET(request: Request): Promise<Response> {
  return handleAdminReset("GET", request, new Date());
}
