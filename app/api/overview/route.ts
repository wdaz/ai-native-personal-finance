import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";
import { getDb } from "@/src/server/db";
import { errorResponse } from "@/src/server/http";
import { getOverview } from "@/src/server/overview";

/**
 * SPEC-overview §6: public shape is the session's, not this route's — `proxy.ts` already
 * 401s an unauthenticated request before Next resolves this handler (`/api/overview` is not in
 * `PUBLIC_API`/`TEST_API`/`ADMIN_API`). `no-store` is set here because `proxy.ts` only sets
 * it for non-API responses (T-08 plan D11 named this route as `/api/meta`'s counterpart). The
 * `catch` below only ever sees a per-request failure (`getOverview` throwing, e.g. no `Balance`
 * row) — `overview.ts`'s module-level `CATEGORY_LABEL`/`THEME_LABEL` construction runs once, at
 * import time, outside this `try`, so a `CATEGORIES`/Prisma enum drift fails the build or the
 * cold start, not a request, and never reaches this 500 (code review, PR #21).
 */
export async function GET(): Promise<Response> {
  try {
    const overview = await getOverview(getDb(), fixedClock(BUSINESS_TODAY));
    return Response.json(overview, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/overview failed", error);
    return errorResponse(500, "server_error", "The overview is unavailable");
  }
}
