import { describe, expect, it } from "vitest";
import { seedRows } from "@/src/server/seed";
import {
  FEW_TRANSACTIONS,
  SEED_VARIANTS,
  applyVariant,
  isSeedVariant,
} from "@/src/server/variants";

/** SPEC-reset-and-test-support §7, unit row: "variant functions" (§2.7). */
describe("seed variants", () => {
  const seed = seedRows();

  it("seed leaves the rows as they are", () => {
    expect(applyVariant(seed, "seed")).toEqual(seed);
  });

  it("empty-pots removes the pots and keeps the balance", () => {
    expect(applyVariant(seed, "empty-pots")).toEqual({ ...seed, pots: [] });
  });

  it("empty-budgets removes the budgets only", () => {
    expect(applyVariant(seed, "empty-budgets")).toEqual({ ...seed, budgets: [] });
  });

  it("few-transactions keeps the latest three transactions and nothing else changes", () => {
    const newestFirst = [...seed.transactions].sort((a, b) => (a.date < b.date ? 1 : -1));
    const rows = applyVariant(seed, "few-transactions");
    expect(FEW_TRANSACTIONS).toBe(3);
    expect(rows.transactions).toHaveLength(3);
    expect(new Set(rows.transactions)).toEqual(new Set(newestFirst.slice(0, 3)));
    expect({ ...rows, transactions: [] }).toEqual({ ...seed, transactions: [] });
  });

  it("no-recurring clears recurring on every transaction and changes nothing else", () => {
    const rows = applyVariant(seed, "no-recurring");
    expect(rows.transactions.some((t) => t.recurring)).toBe(false);
    expect(rows.transactions).toEqual(seed.transactions.map((t) => ({ ...t, recurring: false })));
    expect(seed.transactions.some((t) => t.recurring)).toBe(true);
  });

  it("empty-all removes pots, budgets and transactions and keeps the balance", () => {
    expect(applyVariant(seed, "empty-all")).toEqual({
      balance: seed.balance,
      transactions: [],
      budgets: [],
      pots: [],
    });
  });

  it.each(SEED_VARIANTS)("%s leaves its input untouched", (variant) => {
    const input = seedRows();
    applyVariant(input, variant);
    expect(input).toEqual(seedRows());
  });

  it("accepts exactly the six variant names", () => {
    expect(SEED_VARIANTS).toEqual([
      "seed",
      "empty-pots",
      "empty-budgets",
      "few-transactions",
      "no-recurring",
      "empty-all",
    ]);
    for (const value of ["Seed", "empty_pots", "", " seed", undefined, null, 1, {}]) {
      expect(isSeedVariant(value), String(value)).toBe(false);
    }
  });
});
