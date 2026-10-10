import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";
import { getDb } from "@/src/server/db";
import { errorResponse, validationErrorResponse } from "@/src/server/http";
import { getRecurringBills } from "@/src/server/recurring-bills";
import { parseRecurringBillsQuery } from "@/src/shared/recurring-bills-query";

/**
 * SPEC-recurring-bills 2.11: a read route (SPEC-write-path 2.1). The proxy answers 401 before
 * this handler runs. The query is read strictly (2.3): a bad `sort` or `status`, or a `q` over
 * 60 characters, is a 400 whose `message` names the allowed values. The bills are built on the
 * fixed business day (ADR-0005, NFR-D1). Every answer is `no-store`: set here on the 200, by
 * the helpers on the 400 and 500.
 */
export async function GET(request: Request): Promise<Response> {
  const { query, issues, message } = parseRecurringBillsQuery(new URL(request.url).searchParams, {
    strict: true,
  });
  if (issues.length > 0) return validationErrorResponse(issues, 400, message);
  try {
    const bills = await getRecurringBills(getDb(), fixedClock(BUSINESS_TODAY), query);
    return Response.json(bills, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/recurring-bills failed", error);
    return errorResponse(500, "server_error", "The recurring bills are unavailable");
  }
}
