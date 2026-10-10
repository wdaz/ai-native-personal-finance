"use client";

import { WebMcpTools } from "../WebMcpTools";
import { PAGE_TOOLS } from "./registry";

/** SPEC-transactions 2.14, SPEC-webmcp-tools §2.3: the Transactions page's tool (the Overview pattern). */
export function TransactionsTools() {
  return <WebMcpTools tools={PAGE_TOOLS.transactions} />;
}
