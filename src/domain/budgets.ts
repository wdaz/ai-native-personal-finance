import { isInMonthOf } from "./calendar";
import type { Clock } from "./clock";
import { sumCents } from "./money";
import { latestTransactions } from "./transactions";
import type { BudgetInput, TransactionInput } from "./types";

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

/** SPEC-budgets 2.5, US-18 AC1: the three latest transactions of a budget's category. */
export const LATEST_SPENDING = 3;

/**
 * data-model.md's `latestSpending(category, transactions, 3)` (SPEC-budgets 4.1): the category's
 * `count` newest transactions in any month and of any sign, ordered as US-11 Latest
 * (`compareLatest`).
 */
export function latestSpending<T extends TransactionInput>(
  category: string,
  transactions: readonly T[],
  count: number = LATEST_SPENDING,
): T[] {
  return latestTransactions(
    transactions.filter((t) => t.category === category),
    count,
  );
}

/** SPEC-budgets 4.1: Remaining = `max(0, maximum − spent)`; it never goes below $0.00. */
export function budgetRemaining(maximum: number, spent: number): number {
  return Math.max(0, sumCents([maximum, -spent]));
}

export type BudgetsSummaryInput<T, B> = {
  transactions: readonly T[];
  budgets: readonly B[];
};

export type BudgetsSummary<T, B> = {
  /** Creation order (`seq`, US-14 AC4). */
  items: (B & { spent: number; remaining: number; latest: T[] })[];
  /** Σ spent over all budgets (US-20 AC1). */
  spent: number;
  /** Σ maximum over all budgets. */
  limit: number;
};

const byCreation = (a: { seq: number }, b: { seq: number }) => a.seq - b.seq;

/**
 * SPEC-budgets 2.1, 4.1: everything the page and `GET /api/budgets` show, in cents. The rows
 * are the caller's own (ids, themes and avatars pass through). The totals are the ones
 * `overviewSummary` gives Overview, so the two pages read the same numbers (US-20 AC1).
 */
export function budgetsSummary<T extends TransactionInput, B extends BudgetInput>(
  input: BudgetsSummaryInput<T, B>,
  clock: Clock,
): BudgetsSummary<T, B> {
  const items = [...input.budgets].sort(byCreation).map((budget) => {
    const spent = budgetSpent(budget.category, input.transactions, clock);
    return {
      ...budget,
      spent,
      remaining: budgetRemaining(budget.maximum, spent),
      latest: latestSpending(budget.category, input.transactions),
    };
  });
  return {
    items,
    spent: sumCents(items.map((budget) => budget.spent)),
    limit: sumCents(items.map((budget) => budget.maximum)),
  };
}
