import type { Metadata } from "next";
import { PAGE_NAMES } from "@/src/ui/nav";
import { Release2Placeholder } from "../Release2Placeholder";

// SPEC-app-shell §2.5: the root layout's template makes it "Personal Finance - Budgets".
export const metadata: Metadata = { title: PAGE_NAMES.budgets };

export default function BudgetsPage() {
  return <Release2Placeholder title={PAGE_NAMES.budgets} />;
}
