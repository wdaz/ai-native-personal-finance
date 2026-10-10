import { z } from "zod";
import { apiGet } from "@/src/shared/api-client";
import { CATEGORIES } from "@/src/shared/enums";
import { TransactionsDtoSchema } from "@/src/shared/schemas";
import { TRANSACTION_SORTS, TRANSACTIONS_Q_MAX } from "@/src/shared/transactions-query";
import { VIA_HEADER, VIA_WEBMCP } from "@/src/shared/via";
import { defineTool } from "../defineTool";
import { fromApiOutcome, toolSuccess } from "../tool-result";
import type { ToolDefinition } from "../types";

/**
 * SPEC-transactions 2.14: the tool's input, the URL contract's four values under the tool's own
 * names (`search` for `q`). `z.enum` lists the allowed values in the published schema, so an
 * agent sees them before its first call; a value outside them is refused before any request.
 */
const ListTransactionsInput = z.object({
  search: z.string().max(TRANSACTIONS_Q_MAX).optional(),
  category: z.enum(CATEGORIES).optional(),
  sort: z.enum(TRANSACTION_SORTS).optional(),
  page: z.number().int().min(1).optional(),
});

/** 2.14: `GET /api/transactions` with `q` ← `search`; `apiGet` has no query builder. */
export function listTransactionsPath(input: z.infer<typeof ListTransactionsInput>): string {
  const params = new URLSearchParams();
  if (input.search !== undefined) params.set("q", input.search);
  if (input.category !== undefined) params.set("category", input.category);
  if (input.sort !== undefined) params.set("sort", input.sort);
  if (input.page !== undefined) params.set("page", String(input.page));
  const search = params.toString();
  return search ? `/api/transactions?${search}` : "/api/transactions";
}

export const listTransactions = defineTool({
  name: "list_transactions",
  title: "List transactions",
  description:
    "Lists the demo account's transactions, ten per page, newest first unless sorted. Optional name search, category, sort and page. Money in USD cents. Available on the Transactions page.",
  input: ListTransactionsInput,
  // R-24: it returns user-entered names. A read tool carries no consequentialHint (H3).
  annotations: { readOnlyHint: true, untrustedContentHint: true },
  async execute({ input }) {
    const outcome = await apiGet(listTransactionsPath(input), TransactionsDtoSchema, {
      headers: { [VIA_HEADER]: VIA_WEBMCP },
    });
    return fromApiOutcome(outcome, (dto) => toolSuccess(dto));
  },
});

export const transactionsTools: ToolDefinition[] = [listTransactions];
