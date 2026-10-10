import { describe, expect, it } from "vitest";
import { budgetRemaining, budgetSpent, budgetsSummary, latestSpending } from "@/src/domain/budgets";
import { compareLatest } from "@/src/domain/transactions";
import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";
import { transaction } from "@/tests/fixtures/domain";

const clock = fixedClock(BUSINESS_TODAY);

describe("budgetSpent (data-model.md: Σ |amount| of negative transactions in the current month)", () => {
  it("adds the category's money out this month", () => {
    const rows = [
      transaction({ category: "Bills", amount: -1_537 }),
      transaction({ category: "Bills", amount: -250, date: "2026-08-01T00:00:00Z" }),
    ];
    expect(budgetSpent("Bills", rows, clock)).toBe(1_787);
  });

  it("does not let money in reduce what was spent (the seed has no such case)", () => {
    const rows = [
      transaction({ category: "Bills", amount: -1_537 }),
      transaction({ category: "Bills", amount: 4_219 }),
    ];
    expect(budgetSpent("Bills", rows, clock)).toBe(1_537);
  });

  it("leaves out other categories, other months and the same month of another year", () => {
    const rows = [
      transaction({ category: "Dining Out", amount: -900 }),
      transaction({ category: "Bills", amount: -800, date: "2026-07-31T23:59:59.999Z" }),
      transaction({ category: "Bills", amount: -700, date: "2026-09-01T00:00:00Z" }),
      transaction({ category: "Bills", amount: -600, date: "2025-08-10T12:00:00Z" }),
    ];
    expect(budgetSpent("Bills", rows, clock)).toBe(0);
  });

  it("counts the whole current month, including days after today", () => {
    const rows = [transaction({ category: "Bills", amount: -300, date: "2026-08-31T12:00:00Z" })];
    expect(budgetSpent("Bills", rows, clock)).toBe(300);
  });

  it("is 0 when the category has no transactions", () => {
    expect(budgetSpent("Bills", [], clock)).toBe(0);
  });
});

describe("latestSpending (SPEC-budgets 4.1: any month, any sign, US-11 Latest)", () => {
  const rows = [
    transaction({ name: "Old", category: "Bills", date: "2026-06-01T00:00:00Z" }),
    transaction({ name: "Income", category: "Bills", amount: 500, date: "2026-08-12T00:00:00Z" }),
    transaction({ name: "Other", category: "Dining Out", date: "2026-08-18T00:00:00Z" }),
    transaction({ name: "July", category: "Bills", date: "2026-07-20T00:00:00Z" }),
    transaction({ name: "B tie", category: "Bills", date: "2026-08-10T12:00:00Z" }),
    transaction({ name: "A tie", category: "Bills", date: "2026-08-10T12:00:00Z" }),
  ];

  it("US-18 AC1 keeps the three newest of the category, income and other months included", () => {
    expect(latestSpending("Bills", rows).map((t) => t.name)).toEqual(["Income", "A tie", "B tie"]);
  });

  it("US-18 AC1 orders a timestamp tie by name, as compareLatest does", () => {
    const tie = rows.filter((t) => t.name.endsWith("tie"));
    expect(latestSpending("Bills", tie)).toEqual([...tie].sort(compareLatest));
  });

  it("US-18 AC2 returns fewer than three, or none, and leaves other categories out", () => {
    expect(latestSpending("Dining Out", rows).map((t) => t.name)).toEqual(["Other"]);
    expect(latestSpending("Shopping", rows)).toEqual([]);
  });

  it("takes the count it is given", () => {
    expect(latestSpending("Bills", rows, 5).map((t) => t.name)).toEqual([
      "Income",
      "A tie",
      "B tie",
      "July",
      "Old",
    ]);
  });
});

describe("budgetRemaining (SPEC-budgets 4.1: never below 0)", () => {
  it.each([
    [5_000, 1_500, 3_500],
    [7_500, 13_300, 0],
    [13_300, 13_300, 0],
    [1, 1_500, 0],
    [99_999_999_999, 1_500, 99_999_998_499],
    [5_000, 0, 5_000],
  ])("US-14 AC2 a maximum of %i with %i spent leaves %i", (maximum, spent, remaining) => {
    expect(budgetRemaining(maximum, spent)).toBe(remaining);
  });
});

describe("budgetsSummary (SPEC-budgets 2.1, 4.1)", () => {
  const budget = (seq: number, category: string, maximum: number) => ({ seq, category, maximum });

  it("US-14 AC4 lists the budgets in creation order, each with spent, remaining and latest", () => {
    const rows = [
      transaction({ name: "Rent", category: "Bills", amount: -60_000 }),
      transaction({ name: "Lunch", category: "Dining Out", amount: -1_200 }),
    ];
    const summary = budgetsSummary(
      { budgets: [budget(3, "Dining Out", 1_000), budget(1, "Bills", 75_000)], transactions: rows },
      clock,
    );
    expect(summary.items.map((b) => [b.seq, b.category, b.spent, b.remaining])).toEqual([
      [1, "Bills", 60_000, 15_000],
      [3, "Dining Out", 1_200, 0],
    ]);
    expect(summary.items[1]!.latest.map((t) => t.name)).toEqual(["Lunch"]);
    expect({ spent: summary.spent, limit: summary.limit }).toEqual({
      spent: 61_200,
      limit: 76_000,
    });
  });

  it("US-14 AC2 spent ignores income and other months (a July expense, an August income)", () => {
    const rows = [
      transaction({ category: "Bills", amount: -2_000, date: "2026-07-31T23:00:00Z" }),
      transaction({ category: "Bills", amount: 4_000, date: "2026-08-05T00:00:00Z" }),
    ];
    const [bills] = budgetsSummary(
      { budgets: [budget(1, "Bills", 5_000)], transactions: rows },
      clock,
    ).items;
    expect(bills!.spent).toBe(0);
    expect(bills!.remaining).toBe(5_000);
    expect(bills!.latest).toHaveLength(2);
  });

  it("US-20 AC2 has no items and totals of 0 with no budgets", () => {
    expect(budgetsSummary({ budgets: [], transactions: [transaction()] }, clock)).toEqual({
      items: [],
      spent: 0,
      limit: 0,
    });
  });

  it("does not reorder or change its input", () => {
    const budgets = [budget(2, "Bills", 100), budget(1, "General", 100)];
    budgetsSummary({ budgets, transactions: [] }, clock);
    expect(budgets.map((b) => b.seq)).toEqual([2, 1]);
  });
});
