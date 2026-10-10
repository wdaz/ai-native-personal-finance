import { z } from "zod";
import { apiGet, apiSend } from "@/src/shared/api-client";
import {
  BudgetCreateSchema,
  BudgetEditSchema,
  BudgetsDtoSchema,
  BudgetWriteDtoSchema,
} from "@/src/shared/schemas";
import { VIA_HEADER, VIA_WEBMCP } from "@/src/shared/via";
import { runDeleteTool } from "../bus";
import { defineTool } from "../defineTool";
import { fromApiOutcome, toolSuccess } from "../tool-result";
import type { ToolDefinition } from "../types";

/**
 * SPEC-budgets 2.13: the Budgets page's four tools, through the same routes as the page and with
 * the same shared schemas, validated before any request (US-40 AC1). Every call carries
 * `X-Via: webmcp`, so it is on record with its method (`write-path.md` 2.12). `delete_budget`
 * goes through the page's own dialog (SPEC-ui-kit 2.3): nothing reaches the server before the
 * person confirms (R-16, NFR-W5).
 */
const VIA = { [VIA_HEADER]: VIA_WEBMCP };
const BudgetId = z.object({ id: z.uuid().max(36) });

export const listBudgets = defineTool({
  name: "list_budgets",
  title: "List budgets",
  description:
    "Lists the demo account's budgets in creation order: category, theme, maximum, August spent, remaining, three latest transactions, and totals. Money in USD cents. Available on the Budgets page.",
  input: z.object({}),
  // US-39 AC3: it returns transaction names, user-entered text (R-24).
  annotations: { readOnlyHint: true, untrustedContentHint: true },
  async execute() {
    const outcome = await apiGet("/api/budgets", BudgetsDtoSchema, { headers: VIA });
    return fromApiOutcome(outcome, (dto) => toolSuccess(dto));
  },
});

export const addBudget = defineTool({
  name: "add_budget",
  title: "Add budget",
  description:
    "Creates a budget: a category with no budget yet, a maximum in USD cents (1 to 99999999999) and a theme no other budget uses. Returns the budget as the page shows it. Available on the Budgets page.",
  input: BudgetCreateSchema,
  // Its reply holds the latest transactions' names (`write-path.md` 2.11 (1)).
  annotations: { consequentialHint: true, untrustedContentHint: true },
  async execute({ input }) {
    const outcome = await apiSend("POST", "/api/budgets", BudgetWriteDtoSchema, {
      body: input,
      headers: VIA,
    });
    return fromApiOutcome(outcome, (dto) => toolSuccess(dto ?? {}));
  },
});

export const editBudget = defineTool({
  name: "edit_budget",
  title: "Edit budget",
  description:
    "Changes a budget by id; send all three: its category, maximum (USD cents) and theme. A category or theme another budget uses is refused. Available on the Budgets page.",
  input: BudgetEditSchema.extend(BudgetId.shape),
  annotations: { consequentialHint: true, untrustedContentHint: true },
  async execute({ input: { id, ...body } }) {
    const outcome = await apiSend(
      "PATCH",
      `/api/budgets/${encodeURIComponent(id)}`,
      BudgetWriteDtoSchema,
      { body, headers: VIA },
    );
    return fromApiOutcome(outcome, (dto) => toolSuccess(dto ?? {}));
  },
});

export const deleteBudget = defineTool({
  name: "delete_budget",
  title: "Delete budget",
  description:
    "Deletes a budget by id, only after the person confirms in the page's dialog; returns cancelled if they decline, busy if a dialog is open or a write is pending. Available on the Budgets page.",
  input: BudgetId,
  annotations: { consequentialHint: true },
  async execute({ input, signal }) {
    return runDeleteTool("budget", input.id, signal);
  },
});

export const budgetsTools: ToolDefinition[] = [listBudgets, addBudget, editBudget, deleteBudget];
