import { headers } from "next/headers";
import type { Metadata } from "next";
import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";
import { getDb } from "@/src/server/db";
import { getOverview } from "@/src/server/overview";
import { PAGE_NAMES } from "@/src/ui/nav";
import { PageHeader } from "@/src/ui/PageHeader";
import { BillsCard } from "@/src/ui/overview/BillsCard";
import { BudgetsCard } from "@/src/ui/overview/BudgetsCard";
import { OverviewError } from "@/src/ui/overview/OverviewError";
import { PotsCard } from "@/src/ui/overview/PotsCard";
import { StatCard } from "@/src/ui/overview/StatCard";
import { TransactionsCard } from "@/src/ui/overview/TransactionsCard";
import styles from "./page.module.css";

// SPEC-app-shell §2.5: the root layout's template makes it "Personal Finance - Overview".
export const metadata: Metadata = { title: PAGE_NAMES.overview };

/**
 * SPEC-overview §2.1: reads `getOverview` directly — no HTTP self-call, the same call
 * `GET /api/overview` makes (T-09). §2.8: on a throw, a single error card replaces the grid;
 * the failure is logged with the request id `middleware.ts` forwards on every request.
 */
export default async function OverviewPage() {
  let overview: Awaited<ReturnType<typeof getOverview>> | undefined;
  try {
    overview = await getOverview(getDb(), fixedClock(BUSINESS_TODAY));
  } catch (error) {
    const requestId = (await headers()).get("x-request-id") ?? "none";
    console.error(`Overview: getOverview failed requestId=${requestId}`, error);
  }

  return (
    <>
      <PageHeader title={PAGE_NAMES.overview} />
      {overview ? (
        <>
          <div className={styles.stats}>
            <StatCard label="Current Balance" cents={overview.balance.current} variant="dark" />
            <StatCard label="Income" cents={overview.balance.income} variant="light" />
            <StatCard label="Expenses" cents={overview.balance.expenses} variant="light" />
          </div>
          <div className={styles.grid}>
            <div className={styles.pots}>
              <PotsCard total={overview.pots.total} items={overview.pots.items} />
            </div>
            <div className={styles.transactions}>
              <TransactionsCard items={overview.transactions} />
            </div>
            <div className={styles.budgets}>
              <BudgetsCard
                total={overview.budgets.limit}
                spent={overview.budgets.spent}
                items={overview.budgets.items}
              />
            </div>
            <div className={styles.bills}>
              <BillsCard {...overview.bills} />
            </div>
          </div>
        </>
      ) : (
        <OverviewError />
      )}
    </>
  );
}
