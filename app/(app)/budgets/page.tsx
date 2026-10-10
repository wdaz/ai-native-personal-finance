import type { Metadata } from "next";
import { headers } from "next/headers";
import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";
import type { BudgetsDto } from "@/src/shared/schemas";
import { getBudgets } from "@/src/server/budgets";
import { getDb } from "@/src/server/db";
import { BudgetsError } from "@/src/ui/budgets/BudgetsError";
import { PAGE_NAMES } from "@/src/ui/nav";
import { PageHeader } from "@/src/ui/PageHeader";
import { BudgetsView } from "./BudgetsView";

// SPEC-app-shell §2.5: the root layout's template makes it "Personal Finance - Budgets".
export const metadata: Metadata = { title: PAGE_NAMES.budgets };

/**
 * SPEC-budgets 2.1, 2.12: reads `getBudgets` directly on the business clock — no HTTP self-call,
 * the same call `GET /api/budgets` makes. On a throw, the header with no "+ Add New Budget"
 * (§9 BU-Q6 (a)) and one error card in place of both columns, logged with the request id.
 */
export default async function BudgetsPage() {
  let budgets: BudgetsDto | undefined;
  try {
    budgets = await getBudgets(getDb(), fixedClock(BUSINESS_TODAY));
  } catch (error) {
    const requestId = (await headers()).get("x-request-id") ?? "none";
    console.error(`Budgets: getBudgets failed requestId=${requestId}`, error);
  }

  if (budgets === undefined) {
    return (
      <>
        <PageHeader title={PAGE_NAMES.budgets} />
        <BudgetsError />
      </>
    );
  }
  return <BudgetsView budgets={budgets} />;
}
