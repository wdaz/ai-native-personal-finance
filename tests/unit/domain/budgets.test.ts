import { describe, expect, it } from "vitest";
import { budgetSpent } from "@/src/domain/budgets";
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
