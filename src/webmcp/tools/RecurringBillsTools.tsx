"use client";

import { WebMcpTools } from "../WebMcpTools";
import { PAGE_TOOLS } from "./registry";

/** SPEC-recurring-bills 2.12, SPEC-webmcp-tools §2.3: the Recurring Bills page's tool (the Overview pattern). */
export function RecurringBillsTools() {
  return <WebMcpTools tools={PAGE_TOOLS.recurringBills} />;
}
