import type { ReactNode } from "react";
import { BudgetsTools } from "@/src/webmcp/tools/BudgetsTools";

/**
 * SPEC-budgets 2.1, 2.13, SPEC-webmcp-tools §2.3: the Budgets segment's own layout, so the four
 * tools are registered on this page only and unregistered when the visitor leaves (R-23).
 */
export default function BudgetsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <BudgetsTools />
    </>
  );
}
