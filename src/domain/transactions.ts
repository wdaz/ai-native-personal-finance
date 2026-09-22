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
