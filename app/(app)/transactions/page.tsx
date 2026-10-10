import type { Metadata } from "next";
import { headers } from "next/headers";
import { COPY } from "@/src/shared/copy";
import type { TransactionsDto } from "@/src/shared/schemas";
import { parseTransactionsQuery } from "@/src/shared/transactions-query";
import { getDb } from "@/src/server/db";
import { getTransactions } from "@/src/server/transactions";
import { PAGE_NAMES } from "@/src/ui/nav";
import { PageHeader } from "@/src/ui/PageHeader";
import { ResultsRegion } from "@/src/ui/ResultsRegion";
import { TransactionTable, type TransactionsEmpty } from "@/src/ui/transactions/TransactionTable";
import { TransactionsError } from "@/src/ui/transactions/TransactionsError";
import { TransactionsNav } from "@/src/ui/transactions/TransactionsNav";
import { TransactionsPagination } from "@/src/ui/transactions/TransactionsPagination";
import { TransactionsToolbar } from "@/src/ui/transactions/TransactionsToolbar";
import styles from "./page.module.css";

// SPEC-app-shell §2.5: the root layout's template makes it "Personal Finance - Transactions".
export const metadata: Metadata = { title: PAGE_NAMES.transactions };

/**
 * SPEC-transactions 2.1–2.3, 2.10: reads the URL leniently (an unknown value is its default, a
 * page past the end the last page, and the URL is never rewritten) and calls `getTransactions`
 * directly — no HTTP self-call, the same call `GET /api/transactions` makes. With no match it
 * asks once more, unfiltered, whether any transaction exists, so "No transactions yet" wins over
 * "No transactions match your search" (2.10). On a throw, one error card replaces the list card.
 */
export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { query } = parseTransactionsQuery(await searchParams, { strict: false });
  let dto: TransactionsDto | undefined;
  let empty: TransactionsEmpty | null = null;
  try {
    const db = getDb();
    dto = await getTransactions(db, query);
    if (dto.total === 0) {
      const all = await getTransactions(db, {
        q: undefined,
        category: undefined,
        sort: "latest",
        page: 1,
      });
      empty = all.total === 0 ? "none" : "no-results";
    }
  } catch (error) {
    dto = undefined;
    const requestId = (await headers()).get("x-request-id") ?? "none";
    console.error(`Transactions: getTransactions failed requestId=${requestId}`, error);
  }

  if (dto === undefined) {
    return (
      <>
        <PageHeader title={PAGE_NAMES.transactions} />
        <TransactionsError />
      </>
    );
  }

  const status =
    empty === null
      ? COPY.transactionsStatus(dto.total, dto.page, dto.pageCount)
      : empty === "none"
        ? COPY.transactionsEmpty
        : COPY.transactionsNoResults;

  return (
    <>
      <PageHeader title={PAGE_NAMES.transactions} />
      <TransactionsNav effective={{ ...query, page: dto.page }}>
        <div className={styles.card}>
          <TransactionsToolbar />
          <ResultsRegion status={status}>
            <TransactionTable items={dto.items} empty={empty} />
          </ResultsRegion>
          <TransactionsPagination pageCount={dto.pageCount} total={dto.total} />
        </div>
      </TransactionsNav>
    </>
  );
}
