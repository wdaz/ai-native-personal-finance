import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";
import { deleteBudget, updateBudget } from "@/src/server/budgets";
import { guardedWrite } from "@/src/server/write";
import { BudgetEditSchema } from "@/src/shared/schemas";

type Context = { params: Promise<{ id: string }> };

/** SPEC-budgets 2.10: all three fields; 404 for no such budget (SPEC-write-path 2.2). */
export async function PATCH(request: Request, { params }: Context): Promise<Response> {
  const { id } = await params;
  return guardedWrite(request, {
    now: new Date(),
    schema: BudgetEditSchema,
    id,
    run: updateBudget(fixedClock(BUSINESS_TODAY)),
  });
}

/** SPEC-budgets 2.8, 2.10: 204, or 404 for no such budget; no body is read. */
export async function DELETE(request: Request, { params }: Context): Promise<Response> {
  const { id } = await params;
  return guardedWrite(request, { now: new Date(), id, run: deleteBudget });
}
