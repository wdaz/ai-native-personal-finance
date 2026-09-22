import { isInMonthOf } from "./calendar";
import type { Clock } from "./clock";
import { sumCents } from "./money";
import type { TransactionInput } from "./types";

/**
 * data-model.md: `budgetSpent(category, transactions, clock)` = Σ |amount| of the category's
 * negative transactions in the current month (UTC). Income in the category does not reduce
 * what was spent.
 */
export function budgetSpent(
  category: string,
  transactions: readonly TransactionInput[],
  clock: Clock,
): number {
  const today = clock.today();
  return sumCents(
    transactions
      .filter((t) => t.category === category && t.amount < 0 && isInMonthOf(t.date, today))
      .map((t) => -t.amount),
  );
}
