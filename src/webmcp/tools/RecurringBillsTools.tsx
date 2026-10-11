"use client";

import { WebMcpTools } from "../WebMcpTools";

const loadRecurringBillsTools = () =>
  import("./recurring-bills").then((m) => m.recurringBillsTools);

/** SPEC-recurring-bills 2.12, SPEC-webmcp-tools §2.3: the Recurring Bills page's tool (the Overview pattern). */
export function RecurringBillsTools() {
  return <WebMcpTools load={loadRecurringBillsTools} />;
}
