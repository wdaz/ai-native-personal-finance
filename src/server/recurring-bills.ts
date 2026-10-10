import { billsList, billsTotals, recurringBills, type BillsTotals } from "@/src/domain/bills";
import type { Clock } from "@/src/domain/clock";
import type { BillStatus, RecurringBillsQuery } from "@/src/shared/recurring-bills-query";
import type { RecurringBillsDto } from "@/src/shared/schemas";
import type { Db } from "./db";
import { categoryLabel } from "./overview";

type BillRow = {
  name: string;
  day: number;
  amount: number;
  status: BillStatus;
  latest: { avatar: string };
};

/**
 * SPEC-recurring-bills 2.11: `RecurringBillsDtoSchema` is strict. Every field is named (the
 * `toOverviewDto` pattern), so the bill's `latest` transaction — its id, date and category —
 * never reaches the DTO. A bill has no `id` (§9 RB-Q6 (a)).
 */
export function toRecurringBillsDto(
  items: readonly BillRow[],
  summary: BillsTotals,
): RecurringBillsDto {
  const row = ({ count, amount }: { count: number; amount: number }) => ({ count, amount });
  return {
    items: items.map((bill) => ({
      name: bill.name,
      avatar: bill.latest.avatar,
      day: bill.day,
      amount: bill.amount,
      status: bill.status,
    })),
    summary: {
      total: row(summary.total),
      paid: row(summary.paid),
      totalUpcoming: row(summary.totalUpcoming),
      dueSoon: row(summary.dueSoon),
    },
  };
}

/**
 * SPEC-recurring-bills 2.1, 2.4: the one place the bills are read, for the page (directly) and
 * `GET /api/recurring-bills`. Every transaction is read (the Overview pattern: no `where`, no
 * `orderBy`, no `seeded` filter), the bills are built on `clock`'s day, the summary is taken
 * over all of them, and only then are the search, the status and the sort applied.
 */
export async function getRecurringBills(
  db: Db,
  clock: Clock,
  query: RecurringBillsQuery,
): Promise<RecurringBillsDto> {
  const rows = await db.transaction.findMany({
    select: {
      id: true,
      name: true,
      avatar: true,
      category: true,
      date: true,
      amount: true,
      recurring: true,
    },
  });
  // `findMany()` has no order; a vendor's two recurring rows with the same timestamp would let the
  // database's order pick the bill's amount and avatar (`recurringBills` keeps the first of a
  // tie). Ordering by `id` first makes that choice the same on every request (code review, T-20).
  rows.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const bills = recurringBills(
    rows.map((row) => ({
      name: row.name,
      avatar: row.avatar,
      category: categoryLabel(row.category),
      date: row.date,
      amount: Number(row.amount),
      recurring: row.recurring,
    })),
    clock,
  );
  return toRecurringBillsDto(billsList(bills, query), billsTotals(bills));
}
