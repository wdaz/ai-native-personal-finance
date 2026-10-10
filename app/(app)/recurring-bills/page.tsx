import type { Metadata } from "next";
import { headers } from "next/headers";
import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";
import { COPY } from "@/src/shared/copy";
import { parseRecurringBillsQuery } from "@/src/shared/recurring-bills-query";
import type { RecurringBillsDto } from "@/src/shared/schemas";
import { getDb } from "@/src/server/db";
import { getRecurringBills } from "@/src/server/recurring-bills";
import { PAGE_NAMES } from "@/src/ui/nav";
import { PageHeader } from "@/src/ui/PageHeader";
import { ResultsRegion } from "@/src/ui/ResultsRegion";
import { BillsError } from "@/src/ui/recurring-bills/BillsError";
import { BillsNav } from "@/src/ui/recurring-bills/BillsNav";
import { BillsSummaryCard } from "@/src/ui/recurring-bills/BillsSummaryCard";
import { BillsTable, type BillsEmpty } from "@/src/ui/recurring-bills/BillsTable";
import { BillsToolbar } from "@/src/ui/recurring-bills/BillsToolbar";
import { TotalBillsCard } from "@/src/ui/recurring-bills/TotalBillsCard";
import styles from "./page.module.css";

// SPEC-app-shell §2.5: the root layout's template makes it "Personal Finance - Recurring Bills".
export const metadata: Metadata = { title: PAGE_NAMES.recurringBills };

/**
 * SPEC-recurring-bills 2.1–2.3, 2.10: reads the URL leniently (an unknown sort is Latest, a long
 * search is cut, `status` is ignored, and the URL is never rewritten) and calls
 * `getRecurringBills` directly on the business clock — no HTTP self-call, the same call
 * `GET /api/recurring-bills` makes. The summary is over all bills, so a total count of 0 tells
 * "No recurring bills yet" from "No bills match your search" without a second read. On a throw,
 * one error card replaces the summary cards and the list card.
 */
export default async function RecurringBillsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { query } = parseRecurringBillsQuery(await searchParams, { strict: false });
  let dto: RecurringBillsDto | undefined;
  try {
    dto = await getRecurringBills(getDb(), fixedClock(BUSINESS_TODAY), query);
  } catch (error) {
    const requestId = (await headers()).get("x-request-id") ?? "none";
    console.error(`RecurringBills: getRecurringBills failed requestId=${requestId}`, error);
  }

  if (dto === undefined) {
    return (
      <>
        <PageHeader title={PAGE_NAMES.recurringBills} />
        <BillsError />
      </>
    );
  }

  const empty: BillsEmpty | null =
    dto.summary.total.count === 0 ? "none" : dto.items.length === 0 ? "no-results" : null;
  const status =
    empty === "none"
      ? COPY.billsEmpty
      : empty === "no-results"
        ? COPY.billsNoResults
        : COPY.billsStatus(dto.items.length);

  return (
    <>
      <PageHeader title={PAGE_NAMES.recurringBills} />
      <div className={styles.layout}>
        <div className={styles.summary}>
          <TotalBillsCard amount={dto.summary.total.amount} />
          <BillsSummaryCard summary={dto.summary} />
        </div>
        <BillsNav effective={{ q: query.q, sort: query.sort }}>
          <div className={styles.card}>
            <BillsToolbar />
            <ResultsRegion status={status}>
              <BillsTable items={dto.items} empty={empty} />
            </ResultsRegion>
          </div>
        </BillsNav>
      </div>
    </>
  );
}
