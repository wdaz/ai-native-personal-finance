import type { ReactNode } from "react";
import { RecurringBillsTools } from "@/src/webmcp/tools/RecurringBillsTools";

/**
 * SPEC-recurring-bills 2.1, SPEC-webmcp-tools §2.3: the Recurring Bills segment's own layout, so
 * `list_recurring_bills` is registered on this page only and unregistered when the visitor
 * leaves (the Overview pattern).
 */
export default function RecurringBillsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <RecurringBillsTools />
    </>
  );
}
