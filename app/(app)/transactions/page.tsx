import type { Metadata } from "next";
import { PAGE_NAMES } from "@/src/ui/nav";
import { Release2Placeholder } from "../Release2Placeholder";

// SPEC-app-shell §2.5: the root layout's template makes it "Personal Finance - Transactions".
export const metadata: Metadata = { title: PAGE_NAMES.transactions };

export default function TransactionsPage() {
  return <Release2Placeholder title={PAGE_NAMES.transactions} />;
}
