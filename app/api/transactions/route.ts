import { getDb } from "@/src/server/db";
import { errorResponse, validationErrorResponse } from "@/src/server/http";
import { getTransactions } from "@/src/server/transactions";
import { parseTransactionsQuery } from "@/src/shared/transactions-query";

/**
 * SPEC-transactions 2.13: a read route (SPEC-write-path 2.1). The proxy answers 401 before
 * this handler runs. The query is read strictly (2.3): a bad `sort`, `category` or a `q` over
 * 60 characters is a 400 whose `message` names the allowed values; `page` is clamped, never an
 * error. Every answer is `no-store`: set here on the 200, by the helpers on the 400 and 500.
 */
export async function GET(request: Request): Promise<Response> {
  const { query, issues, message } = parseTransactionsQuery(new URL(request.url).searchParams, {
    strict: true,
  });
  if (issues.length > 0) return validationErrorResponse(issues, 400, message);
  try {
    const transactions = await getTransactions(getDb(), query);
    return Response.json(transactions, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/transactions failed", error);
    return errorResponse(500, "server_error", "The transactions are unavailable");
  }
}
