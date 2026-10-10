import {
  TRANSACTIONS_PAGE_SIZE,
  type TransactionSort,
  type TransactionsQuery,
} from "@/src/shared/transactions-query";
import type { TransactionInput } from "./types";

const names = new Intl.Collator("en");

/**
 * US-11 "Latest": by full timestamp, newest first, then by name A to Z (SPEC-overview §4.3,
 * "timestamp desc, then name").
 */
export const compareLatest = (
  a: Pick<TransactionInput, "date" | "name">,
  b: Pick<TransactionInput, "date" | "name">,
): number => b.date.getTime() - a.date.getTime() || names.compare(a.name, b.name);

/** US-06 AC1: the `count` most recent transactions, ordered as US-11 Latest. */
export function latestTransactions<T extends TransactionInput>(
  transactions: readonly T[],
  count: number,
): T[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new Error(`Count ${count} is not a whole number of transactions`);
  }
  return [...transactions].sort(compareLatest).slice(0, count);
}

// ---------------------------------------------------------------------------------------
// SPEC-transactions 2.4: the Transactions list — category, search, sort, page, in that order.

type ListRow = Pick<TransactionInput, "name" | "category" | "date" | "amount"> & { id: string };

const newestFirst = (a: Pick<ListRow, "date">, b: Pick<ListRow, "date">) =>
  b.date.getTime() - a.date.getTime();

/** 2.4's table: each sort's keys before the final `id`. */
const SORT_KEYS: Record<TransactionSort, (a: ListRow, b: ListRow) => number> = {
  latest: compareLatest,
  oldest: (a, b) => a.date.getTime() - b.date.getTime() || names.compare(a.name, b.name),
  "a-to-z": (a, b) => names.compare(a.name, b.name) || newestFirst(a, b),
  "z-to-a": (a, b) => names.compare(b.name, a.name) || newestFirst(a, b),
  highest: (a, b) => b.amount - a.amount || newestFirst(a, b),
  lowest: (a, b) => a.amount - b.amount || newestFirst(a, b),
};

/**
 * US-11 AC1: one of the six orders, then `id` ascending by code unit. `Transaction` has no
 * `seq` and `findMany()` no `orderBy`, so without the `id` two rows tied on every other key
 * could swap between requests and cross a page boundary.
 */
export function sortTransactions<T extends ListRow>(
  rows: readonly T[],
  sort: TransactionSort,
): T[] {
  return [...rows].sort(
    (a, b) => SORT_KEYS[sort](a, b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
}

/**
 * US-10, US-12: the category by exact display name; the search a case-insensitive substring of
 * the name only, trimmed, with no pattern characters. An absent or all-space needle filters nothing.
 */
export function filterTransactions<T extends Pick<ListRow, "name" | "category">>(
  rows: readonly T[],
  { q, category }: { q: string | undefined; category: string | undefined },
): T[] {
  const needle = q?.trim().toLowerCase() ?? "";
  return rows.filter(
    (row) =>
      (category === undefined || row.category === category) &&
      (needle === "" || row.name.toLowerCase().includes(needle)),
  );
}

export type TransactionsPage<T> = { items: T[]; page: number; pageCount: number; total: number };

/** US-09: ten a page; the requested page clamped to `1…pageCount` (R-27, US-09 AC4). */
export function paginate<T>(rows: readonly T[], page: number): TransactionsPage<T> {
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / TRANSACTIONS_PAGE_SIZE));
  const effective = Math.min(Math.max(1, Number.isNaN(page) ? 1 : Math.floor(page)), pageCount);
  const start = (effective - 1) * TRANSACTIONS_PAGE_SIZE;
  return {
    items: rows.slice(start, start + TRANSACTIONS_PAGE_SIZE),
    page: effective,
    pageCount,
    total,
  };
}

/** 2.4: the page of `rows` that `query` shows. */
export function transactionsPage<T extends ListRow>(
  rows: readonly T[],
  query: TransactionsQuery,
): TransactionsPage<T> {
  return paginate(sortTransactions(filterTransactions(rows, query), query.sort), query.page);
}
