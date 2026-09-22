import { describe, expect, it } from "vitest";
import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";
import { overviewSummary } from "@/src/domain/overview";
import { transaction } from "@/tests/fixtures/domain";

// The seed's own figures are asserted against SPEC-overview §4.3 in
// tests/unit/seed-figures.test.ts; the cases here are built by hand, one rule at a time.
const clock = fixedClock(BUSINESS_TODAY);
const balance = { current: 100_037, income: 50_000, expenses: 20_000 };
const pot = (seq: number, total: number) => ({ id: `pot-${seq}`, seq, total });
const budget = (seq: number, category: string, maximum: number) => ({
  id: `budget-${seq}`,
  seq,
  category,
  maximum,
});

describe("overviewSummary (SPEC-overview §4.1, §6; US-04…US-08)", () => {
  it("is zeros and empty lists for an empty dataset (§2.7; US-05 AC2, US-06 AC3, US-07 AC2, US-08 AC3)", () => {
    expect(overviewSummary({ balance, transactions: [], budgets: [], pots: [] }, clock)).toEqual({
      balance,
      pots: { total: 0, items: [] },
      transactions: [],
      budgets: { spent: 0, limit: 0, items: [] },
      bills: { paid: 0, upcoming: 0, dueSoon: 0 },
    });
  });

  it("passes the stored balance through unchanged (US-04 AC3)", () => {
    const summary = overviewSummary({ balance, transactions: [], budgets: [], pots: [] }, clock);
    expect(summary.balance).toEqual(balance);
    expect(summary.balance).not.toBe(balance);
  });

  it("totals all pots and lists the first four in creation order (US-05 AC1's rule)", () => {
    const pots = [pot(5, 537), pot(2, 200), pot(4, 400), pot(1, 100), pot(3, 300)];
    const summary = overviewSummary({ balance, transactions: [], budgets: [], pots }, clock);
    expect(summary.pots.total).toBe(1_537);
    expect(summary.pots.items.map((p) => p.id)).toEqual(["pot-1", "pot-2", "pot-3", "pot-4"]);
  });

  it("totals all budgets and lists the first four with what each spent (US-07 AC1's rule)", () => {
    const budgets = [
      budget(2, "Bills", 60_000),
      budget(1, "Dining Out", 5_037),
      budget(5, "Education", 1_019),
      budget(3, "General", 2_231),
      budget(4, "Shopping", 3_143),
    ];
    const transactions = [
      transaction({ category: "Bills", amount: -12_500 }),
      transaction({ category: "Education", amount: -563 }),
    ];
    const summary = overviewSummary({ balance, transactions, budgets, pots: [] }, clock);
    expect(summary.budgets.limit).toBe(71_430);
    expect(summary.budgets.spent).toBe(13_063);
    expect(summary.budgets.items.map((b) => [b.id, b.spent])).toEqual([
      ["budget-1", 0],
      ["budget-2", 12_500],
      ["budget-3", 0],
      ["budget-4", 0],
    ]);
  });

  it("lists the five latest transactions (US-06 AC1)", () => {
    const transactions = [1, 2, 3, 4, 5, 6].map((day) =>
      transaction({ name: `Day ${day}`, date: `2026-08-0${day}T12:00:00Z` }),
    );
    const summary = overviewSummary({ balance, transactions, budgets: [], pots: [] }, clock);
    expect(summary.transactions.map((t) => t.name)).toEqual([
      "Day 6",
      "Day 5",
      "Day 4",
      "Day 3",
      "Day 2",
    ]);
  });

  it("totals the recurring bills (US-08 AC1's rule)", () => {
    const transactions = [
      transaction({
        name: "Power",
        amount: -12_071,
        recurring: true,
        date: "2026-08-05T12:00:00Z",
      }),
      transaction({ name: "Cloud", amount: -777, recurring: true, date: "2026-07-22T12:00:00Z" }),
    ];
    const summary = overviewSummary({ balance, transactions, budgets: [], pots: [] }, clock);
    expect(summary.bills).toEqual({ paid: 12_071, upcoming: 777, dueSoon: 777 });
  });
});
