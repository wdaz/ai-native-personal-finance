import type { ReactNode } from "react";
import { TransactionsTools } from "@/src/webmcp/tools/TransactionsTools";

/**
 * SPEC-transactions 2.1, SPEC-webmcp-tools §2.3: the Transactions segment's own layout, so
 * `list_transactions` is registered on this page only and unregistered when the visitor leaves
 * (the Overview pattern).
 */
export default function TransactionsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <TransactionsTools />
    </>
  );
}
