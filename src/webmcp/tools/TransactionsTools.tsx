"use client";

import { WebMcpTools } from "../WebMcpTools";

const loadTransactionsTools = () => import("./transactions").then((m) => m.transactionsTools);

/** SPEC-transactions 2.14, SPEC-webmcp-tools §2.3: the Transactions page's tool (the Overview pattern). */
export function TransactionsTools() {
  return <WebMcpTools load={loadTransactionsTools} />;
}
