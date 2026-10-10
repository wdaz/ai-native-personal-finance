import type { ToolDefinition } from "../types";
import { budgetsTools } from "./budgets";
import { overviewTools } from "./overview";
import { recurringBillsTools } from "./recurring-bills";
import { transactionsTools } from "./transactions";

/**
 * SPEC-webmcp-tools §3–§4: one registry per page (ADR-0004). Release 2 adds a key per page;
 * `tests/unit/webmcp/registry.test.ts` iterates this object, so a new tool is checked
 * against NFR-W3 without being listed anywhere else.
 */
export const PAGE_TOOLS = {
  overview: overviewTools,
  transactions: transactionsTools,
  recurringBills: recurringBillsTools,
  budgets: budgetsTools,
} as const satisfies Record<string, ToolDefinition[]>;
