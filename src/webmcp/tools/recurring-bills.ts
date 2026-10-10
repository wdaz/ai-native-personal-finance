import { z } from "zod";
import { apiGet } from "@/src/shared/api-client";
import {
  BILL_SORTS,
  BILL_STATUSES,
  RECURRING_BILLS_Q_MAX,
} from "@/src/shared/recurring-bills-query";
import { RecurringBillsDtoSchema } from "@/src/shared/schemas";
import { VIA_HEADER, VIA_WEBMCP } from "@/src/shared/via";
import { defineTool } from "../defineTool";
import { fromApiOutcome, toolSuccess } from "../tool-result";
import type { ToolDefinition } from "../types";

/**
 * SPEC-recurring-bills 2.12: the tool's input — the URL contract's three values under the tool's
 * own names (`search` for `q`). `z.enum` reads `BILL_STATUSES` and the shared sort slugs, so an
 * agent sees the allowed values before its first call; a value outside them is refused before
 * any request (2.3).
 */
const ListRecurringBillsInput = z.object({
  search: z.string().max(RECURRING_BILLS_Q_MAX).optional(),
  status: z.enum(BILL_STATUSES).optional(),
  sort: z.enum(BILL_SORTS).optional(),
});

/** 2.12: `GET /api/recurring-bills` with `q` ← `search`, in the contract's order. */
export function listRecurringBillsPath(input: z.infer<typeof ListRecurringBillsInput>): string {
  const params = new URLSearchParams();
  if (input.search !== undefined) params.set("q", input.search);
  if (input.sort !== undefined) params.set("sort", input.sort);
  if (input.status !== undefined) params.set("status", input.status);
  const search = params.toString();
  return search ? `/api/recurring-bills?${search}` : "/api/recurring-bills";
}

export const listRecurringBills = defineTool({
  name: "list_recurring_bills",
  title: "List recurring bills",
  description:
    "Lists the demo account's recurring bills, one per vendor, with status (paid, dueSoon, upcoming) and the totals. Optional name search, status and sort. Money in USD cents. Recurring Bills page.",
  input: ListRecurringBillsInput,
  // R-24, §9 RB-Q5 (a): it returns transaction names. A read tool carries no consequentialHint (H3).
  annotations: { readOnlyHint: true, untrustedContentHint: true },
  async execute({ input }) {
    const outcome = await apiGet(listRecurringBillsPath(input), RecurringBillsDtoSchema, {
      headers: { [VIA_HEADER]: VIA_WEBMCP },
    });
    return fromApiOutcome(outcome, (dto) => toolSuccess(dto));
  },
});

export const recurringBillsTools: ToolDefinition[] = [listRecurringBills];
