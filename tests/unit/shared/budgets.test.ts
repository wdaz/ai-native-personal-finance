import { describe, expect, it } from "vitest";
import { budgetFillPercent } from "@/src/shared/budgets";
import { AMOUNT_MAX_CENTS } from "@/src/shared/schemas";

/** SPEC-budgets 4.1: `min(100, spent ÷ maximum × 100)`, at most two decimals, half up. */
describe("budgetFillPercent (SPEC-budgets 4.1)", () => {
  it.each([
    [0, 5_000, 0],
    [1_500, 5_000, 30],
    [10_000, 30_000, 33.33],
    [20_000, 30_000, 66.67],
    [13_300, 7_500, 100],
    [13_300, 13_300, 100],
    [1_500, 1, 100],
    [10_730, 50_000, 21.46],
    [13_300, 15_000, 88.67],
    [1, 20_000, 0.01],
    [1, 20_001, 0],
    [1_500, AMOUNT_MAX_CENTS, 0],
  ])("US-14 AC1 %i of %i fills %d %", (spent, maximum, percent) => {
    expect(budgetFillPercent(spent, maximum)).toBe(percent);
  });

  it("rounds a half up in integers, where floating point would round it down", () => {
    // 0.005 % exactly: 1 cent of 20,000 cents, half of the last place kept.
    expect(budgetFillPercent(1, 20_000)).toBe(0.01);
    // 1.005 % exactly: Math.round(1.005 × 100) / 100 is 1 in floating point; the rule says 1.01.
    expect(budgetFillPercent(201, 20_000)).toBe(1.01);
  });

  it("stays exact at NFR-S3's largest amounts, where spent × 10,000 passes 2⁵³", () => {
    expect(budgetFillPercent(AMOUNT_MAX_CENTS - 1, AMOUNT_MAX_CENTS)).toBe(100);
    expect(budgetFillPercent(Math.floor(AMOUNT_MAX_CENTS / 2), AMOUNT_MAX_CENTS)).toBe(50);
  });

  it.each([
    [-1, 100],
    [1.5, 100],
    [1, 0],
    [1, -100],
    [1, 2.5],
  ])("refuses spent %d of maximum %d", (spent, maximum) => {
    expect(() => budgetFillPercent(spent, maximum)).toThrow();
  });
});
