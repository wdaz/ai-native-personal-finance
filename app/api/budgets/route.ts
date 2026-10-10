import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";
import { createBudget, getBudgets } from "@/src/server/budgets";
import { getDb } from "@/src/server/db";
import { errorResponse } from "@/src/server/http";
import { guardedWrite } from "@/src/server/write";
import { BudgetCreateSchema } from "@/src/shared/schemas";

/**
 * SPEC-budgets 2.11: a read route (SPEC-write-path 2.1). The proxy answers 401 before this
 * handler runs; any query is ignored. Every answer is `no-store`: set here on the 200, by the
 * helper on the 500.
 */
export async function GET(): Promise<Response> {
  try {
    const budgets = await getBudgets(getDb(), fixedClock(BUSINESS_TODAY));
    return Response.json(budgets, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/budgets failed", error);
    return errorResponse(500, "server_error", "The budgets are unavailable");
  }
}

/** SPEC-budgets 2.10: a budget is created through the write pipeline (SPEC-write-path 2.2). */
export async function POST(request: Request): Promise<Response> {
  return guardedWrite(request, {
    now: new Date(),
    schema: BudgetCreateSchema,
    run: createBudget(fixedClock(BUSINESS_TODAY)),
  });
}
