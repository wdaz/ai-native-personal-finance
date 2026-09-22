import { isInMonthUpTo } from "./calendar";
import type { Clock } from "./clock";
import { sumCents } from "./money";
import { compareLatest } from "./transactions";
import type { TransactionInput } from "./types";

export type BillStatus = "paid" | "dueSoon" | "upcoming";

/** One vendor's bill: `latest` is its most recent recurring transaction. */
export type RecurringBill<T extends TransactionInput = TransactionInput> = {
  name: string;
  /** Day of month of the most recent recurring transaction ("Monthly - 2nd"). */
  day: number;
  /** Absolute amount of the most recent recurring transaction, in cents (US-30). */
  amount: number;
  status: BillStatus;
  latest: T;
};

/** US-27 AC2: "Due Soon if not paid and its day-of-month ≤ today + 5". */
export const DUE_SOON_DAYS = 5;

/**
 * data-model.md: one bill per `name` among the recurring transactions, in order of first
 * appearance. US-27 AC2, compared as calendar dates in UTC: **paid** if the vendor has a
 * recurring transaction in the current month on or before today; otherwise **dueSoon** if
 * its day is at most today + 5 — a day earlier in the month that was not paid counts too,
 * as the rule is written; otherwise **upcoming**.
 */
export function recurringBills<T extends TransactionInput>(
  transactions: readonly T[],
  clock: Clock,
): RecurringBill<T>[] {
  const today = clock.today();
  const byName = new Map<string, T[]>();
  for (const transaction of transactions) {
    if (!transaction.recurring) continue;
    const list = byName.get(transaction.name);
    if (list) list.push(transaction);
    else byName.set(transaction.name, [transaction]);
  }
  return [...byName].map(([name, list]) => {
    const latest = list.reduce((a, b) => (compareLatest(a, b) <= 0 ? a : b));
    const day = latest.date.getUTCDate();
    const paid = list.some((t) => isInMonthUpTo(t.date, today));
    const status: BillStatus = paid
      ? "paid"
      : day <= today.getUTCDate() + DUE_SOON_DAYS
        ? "dueSoon"
        : "upcoming";
    return { name, day, amount: Math.abs(latest.amount), status, latest };
  });
}

export type BillsSummary = { paid: number; upcoming: number; dueSoon: number };

/**
 * SPEC-overview §2.6, US-28 AC1: totals in cents. Upcoming is every bill not paid, and Due
 * Soon is the part of it due within five days — the two overlap (seed: 4 paid + 4 upcoming
 * = 8 vendors, 2 of the upcoming due soon).
 */
export function billsSummary(bills: readonly RecurringBill[]): BillsSummary {
  const total = (keep: (bill: RecurringBill) => boolean) =>
    sumCents(bills.filter(keep).map((bill) => bill.amount));
  return {
    paid: total((bill) => bill.status === "paid"),
    upcoming: total((bill) => bill.status !== "paid"),
    dueSoon: total((bill) => bill.status === "dueSoon"),
  };
}
