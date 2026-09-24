import { z } from "zod";
import { apiGet } from "@/src/shared/api-client";
import { OverviewDtoSchema } from "@/src/shared/schemas";
import { VIA_HEADER, VIA_WEBMCP } from "@/src/shared/via";
import { defineTool } from "../defineTool";
import { fromApiOutcome, toolSuccess } from "../tool-result";
import type { ToolDefinition } from "../types";

/**
 * SPEC-webmcp-tools §3: the Release 1 tools, registered on the Overview page only (§2.3, R-23).
 * Both call `GET /api/overview` — the endpoint the page reads — with the marker that puts the
 * call in the server log (§2.8). Neither takes input. `z.object({})` strips a stray key rather
 * than rejecting it, and publishes a schema with no `additionalProperties: false`, so the
 * declared contract and the behaviour agree (plan Q2, F4).
 */
const NO_INPUT = z.object({});

const fetchOverview = () =>
  apiGet("/api/overview", OverviewDtoSchema, { headers: { [VIA_HEADER]: VIA_WEBMCP } });

export const getBalance = defineTool({
  name: "get_balance",
  title: "Get balance",
  description:
    "Returns the demo account's current balance, income and expenses in USD cents. Available on the Overview page.",
  input: NO_INPUT,
  annotations: { readOnlyHint: true },
  async execute() {
    return fromApiOutcome(await fetchOverview(), (overview) => toolSuccess(overview.balance));
  },
});

export const getOverviewSummary = defineTool({
  name: "get_overview_summary",
  title: "Get overview summary",
  description:
    "Returns what the Overview page shows: totals, first four pots and budgets, latest five transactions, bills summary. Money in USD cents. Available on the Overview page.",
  input: NO_INPUT,
  annotations: { readOnlyHint: true, untrustedContentHint: true },
  async execute() {
    return fromApiOutcome(await fetchOverview(), (overview) => toolSuccess(overview));
  },
});

export const overviewTools: ToolDefinition[] = [getBalance, getOverviewSummary];
