import {
  type BillSort,
  type BillStatus,
  type RecurringBillsQuery,
} from "@/src/shared/recurring-bills-query";
import { isInMonthUpTo } from "./calendar";
import type { Clock } from "./clock";
import { sumCents } from "./money";
import { compareLatest } from "./transactions";
import type { TransactionInput } from "./types";

/** SPEC-recurring-bills 2.1: the type of `BILL_STATUSES`, the one list of statuses. */
export type { BillStatus };

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

// ---------------------------------------------------------------------------------------
// SPEC-recurring-bills 2.4: the Recurring Bills list — search, status, sort, in that order.

const names = new Intl.Collator("en");

type ListBill = Pick<RecurringBill, "name" | "day" | "amount" | "status">;

/**
 * Name A to Z (§9 RB-Q8 (a)): the collator first, then UTF-16 code units for two different
 * strings the collator calls equal, so the order is total and stable between requests.
 */
const compareNames = (a: ListBill, b: ListBill) =>
  names.compare(a.name, b.name) || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

/** 2.4's table: each sort's keys; every one but Z to A ends in name A to Z. */
const SORT_KEYS: Record<BillSort, (a: ListBill, b: ListBill) => number> = {
  latest: (a, b) => a.day - b.day || compareNames(a, b),
  oldest: (a, b) => b.day - a.day || compareNames(a, b),
  "a-to-z": compareNames,
  "z-to-a": (a, b) => compareNames(b, a),
  highest: (a, b) => b.amount - a.amount || compareNames(a, b),
  lowest: (a, b) => a.amount - b.amount || compareNames(a, b),
};

/**
 * US-30 AC1: one of the six orders. Latest is the earliest day in the month first. Names are
 * unique by construction (one bill per name), so no further key is needed.
 */
export function sortBills<B extends ListBill>(bills: readonly B[], sort: BillSort): B[] {
  return [...bills].sort(SORT_KEYS[sort]);
}

/**
 * US-29 AC1: a case-insensitive substring of the name only, trimmed, with no pattern characters;
 * an absent or all-space needle filters nothing. `status` (the API's and the tool's, §9 RB-Q3
 * (a)) keeps the bills whose own status it is (RB-Q4 (a): `upcoming` is not "every unpaid").
 */
export function filterBills<B extends Pick<ListBill, "name" | "status">>(
  bills: readonly B[],
  { q, status }: { q: string | undefined; status: BillStatus | undefined },
): B[] {
  const needle = q?.trim().toLowerCase() ?? "";
  return bills.filter(
    (bill) =>
      (status === undefined || bill.status === status) &&
      (needle === "" || bill.name.toLowerCase().includes(needle)),
  );
}

/** 2.4: the bills `query` shows — the search, then the status, then the sort. */
export function billsList<B extends ListBill>(
  bills: readonly B[],
  query: RecurringBillsQuery,
): B[] {
  return sortBills(filterBills(bills, query), query.sort);
}

export type BillsTotal = { count: number; amount: number };
export type BillsTotals = {
  total: BillsTotal;
  paid: BillsTotal;
  /** Every bill not paid, due soon included (US-28 AC1) — not the row status `upcoming`. */
  totalUpcoming: BillsTotal;
  dueSoon: BillsTotal;
};

/**
 * SPEC-recurring-bills 2.4, US-28 AC1: the four summary rows, each a count and its sum in cents,
 * always over every bill. Total Upcoming and Due Soon overlap as `billsSummary`'s do.
 */
export function billsTotals(bills: readonly Pick<ListBill, "amount" | "status">[]): BillsTotals {
  const total = (keep: (status: BillStatus) => boolean): BillsTotal => {
    const kept = bills.filter((bill) => keep(bill.status));
    return { count: kept.length, amount: sumCents(kept.map((bill) => bill.amount)) };
  };
  return {
    total: total(() => true),
    paid: total((status) => status === "paid"),
    totalUpcoming: total((status) => status !== "paid"),
    dueSoon: total((status) => status === "dueSoon"),
  };
}
