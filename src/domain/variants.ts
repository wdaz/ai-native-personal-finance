/**
 * SPEC-reset-and-test-support §2.7: the seed variants `POST /api/test/seed` accepts. Each is a
 * pure function of the seed rows, applied before they are inserted, so a variant is one
 * transaction with its reset. Moved here from `src/server/variants.ts` (SPEC-budgets §4, H15 (2)),
 * so `scripts/seed-figures.ts` can apply them; the server re-exports them.
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

/**
 * The rows a variant reads: the server's insert rows hold dates as UTC ISO-8601 text, the
 * figures script's as `Date`s. Either way the instant decides.
 */
export type VariantRows = {
  transactions: readonly { date: string | Date; recurring: boolean }[];
  budgets: readonly unknown[];
  pots: readonly unknown[];
};

const instant = (date: string | Date) =>
  typeof date === "string" ? Date.parse(date) : date.getTime();

const newestFirst = (a: { date: string | Date }, b: { date: string | Date }) =>
  instant(b.date) - instant(a.date);

/** The `count` newest rows, kept in their own order (a stable sort keeps file order on a tie). */
function latest<T extends { date: string | Date }>(transactions: readonly T[], count: number): T[] {
  const kept = new Set([...transactions].sort(newestFirst).slice(0, count));
  return transactions.filter((transaction) => kept.has(transaction));
}

/**
 * The variant's rows. A variant only empties a list or clears `recurring`, so the result has the
 * input's own type (the casts below say so; TypeScript cannot see it through the spreads).
 */
export function applyVariant<R extends VariantRows>(rows: R, variant: SeedVariant): R {
  return variantOf(rows, variant) as R;
}

function variantOf(rows: VariantRows, variant: SeedVariant): VariantRows {
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
