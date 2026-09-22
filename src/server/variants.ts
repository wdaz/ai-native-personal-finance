import type { SeedRows } from "./seed";

/**
 * SPEC-reset-and-test-support §2.7: the seed variants `POST /api/test/seed` accepts. Each
 * is a pure function of the seed rows, applied before they are inserted, so a variant is
 * one transaction with its reset.
 */
export const SEED_VARIANTS = [
  "seed",
  "empty-pots",
  "empty-budgets",
  "few-transactions",
  "no-recurring",
  "empty-all",
] as const;

export type SeedVariant = (typeof SEED_VARIANTS)[number];

export function isSeedVariant(value: unknown): value is SeedVariant {
  return typeof value === "string" && (SEED_VARIANTS as readonly string[]).includes(value);
}

/** "few-transactions (keep the latest 3)". */
export const FEW_TRANSACTIONS = 3;

// Dates are UTC ISO-8601 text of one fixed shape, so their code-unit order is time order.
const newestFirst = (a: { date: string }, b: { date: string }) =>
  a.date < b.date ? 1 : a.date > b.date ? -1 : 0;

const latest = (transactions: SeedRows["transactions"], count: number) => {
  const kept = new Set([...transactions].sort(newestFirst).slice(0, count));
  return transactions.filter((transaction) => kept.has(transaction));
};

export function applyVariant(rows: SeedRows, variant: SeedVariant): SeedRows {
  switch (variant) {
    case "seed":
      return rows;
    case "empty-pots":
      // "delete pots, balance unchanged"
      return { ...rows, pots: [] };
    case "empty-budgets":
      return { ...rows, budgets: [] };
    case "few-transactions":
      return { ...rows, transactions: latest(rows.transactions, FEW_TRANSACTIONS) };
    case "no-recurring":
      return {
        ...rows,
        transactions: rows.transactions.map((transaction) => ({
          ...transaction,
          recurring: false,
        })),
      };
    case "empty-all":
      // SPEC-reset-and-test-support §2.7 (v1.1): no pots, budgets or transactions; the
      // balance stays.
      return { ...rows, pots: [], budgets: [], transactions: [] };
  }
}
