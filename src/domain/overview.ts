import { billsSummary, recurringBills, type BillsSummary } from "./bills";
import { budgetSpent } from "./budgets";
import type { Clock } from "./clock";
import { sumCents } from "./money";
import { latestTransactions } from "./transactions";
import type { BalanceInput, BudgetInput, PotInput, TransactionInput } from "./types";

/** SPEC-overview §2.3, §2.5: the pots grid and the budgets legend show the first four. */
export const OVERVIEW_CARD_ITEMS = 4;

/** SPEC-overview §2.4, US-06 AC1: the five most recent transactions. */
export const OVERVIEW_TRANSACTIONS = 5;

export type OverviewInput<T, B, P> = {
  balance: BalanceInput;
  transactions: readonly T[];
  budgets: readonly B[];
  pots: readonly P[];
};

/**
 * Everything the Overview shows, in cents, in the shape of SPEC-overview §6's `OverviewDto`.
 * Rows are the caller's own (ids, themes and avatars pass through); dates stay `Date`s.
 */
export type OverviewSummary<T, B, P> = {
  balance: BalanceInput;
  pots: { total: number; items: P[] };
  transactions: T[];
  budgets: { spent: number; limit: number; items: (B & { spent: number })[] };
  bills: BillsSummary;
};

const byCreation = (a: { seq: number }, b: { seq: number }) => a.seq - b.seq;

/**
 * SPEC-overview §4.1: the page performs no arithmetic — every value comes from here.
 * Totals cover all pots and all budgets; the lists hold the first four in creation order
 * (`seq`) and the five latest transactions (US-04…US-08). The balance is stored, not derived
 * (US-04 AC3), and passes through unchanged.
 */
export function overviewSummary<
  T extends TransactionInput,
  B extends BudgetInput,
  P extends PotInput,
>(input: OverviewInput<T, B, P>, clock: Clock): OverviewSummary<T, B, P> {
  const pots = [...input.pots].sort(byCreation);
  const budgets = [...input.budgets].sort(byCreation).map((budget) => ({
    ...budget,
    spent: budgetSpent(budget.category, input.transactions, clock),
  }));
  return {
    balance: { ...input.balance },
    pots: {
      total: sumCents(pots.map((pot) => pot.total)),
      items: pots.slice(0, OVERVIEW_CARD_ITEMS),
    },
    transactions: latestTransactions(input.transactions, OVERVIEW_TRANSACTIONS),
    budgets: {
      spent: sumCents(budgets.map((budget) => budget.spent)),
      limit: sumCents(budgets.map((budget) => budget.maximum)),
      items: budgets.slice(0, OVERVIEW_CARD_ITEMS),
    },
    bills: billsSummary(recurringBills(input.transactions, clock)),
  };
}
