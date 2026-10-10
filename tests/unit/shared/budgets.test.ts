import { describe, expect, it } from "vitest";
import {
  DONUT_FONT_EM,
  DONUT_HOLE,
  DONUT_TEXT_BOX,
  budgetFillPercent,
  donutCentreFit,
  donutLimitLines,
  donutSpentPreset,
} from "@/src/shared/budgets";
import { formatMoney } from "@/src/shared/money";
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

/**
 * SPEC-budgets 2.3 (BU-11 (A), changelog §24a/§25d, §9 BU-Q9 (a)) with the designer's §31a: the
 * donut centre's fit, by the formatted text's length alone. Every length `formatMoney` produces.
 */
describe("the donut centre's fit (SPEC-budgets 2.3, changelog §24a, §25d, §31a)", () => {
  it("the box is the 144 px hole less --spacing-100 each side; the glyph table is in em", () => {
    expect(DONUT_HOLE).toBe(144);
    expect(DONUT_TEXT_BOX).toBe(DONUT_HOLE - 2 * 8);
    for (const glyphs of Object.values(DONUT_FONT_EM)) {
      for (const em of Object.values(glyphs)) expect(em).toBeGreaterThan(0);
    }
  });

  it.each([
    [500, "$5.00", "text-preset-1"],
    [33_800, "$338.00", "text-preset-1"],
    [99_999, "$999.99", "text-preset-1"],
    [100_000, "$1,000.00", "text-preset-2"],
    [9_999_999, "$99,999.99", "text-preset-2"],
    [99_999_999, "$999,999.99", "text-preset-3"],
    [999_999_999, "$9,999,999.99", "text-preset-3"],
    [9_999_999_999, "$99,999,999.99", "text-preset-4-bold"],
    [99_999_999_999, "$999,999,999.99", "text-preset-4-bold"],
    [999_999_999_990, "$9,999,999,999.90", "text-preset-5-bold"],
  ] as const)("spent %i (%s) over a one-line limit → %s", (cents, text, preset) => {
    expect(formatMoney(cents)).toBe(text);
    expect(donutSpentPreset(text.length, 1)).toBe(preset);
  });

  it("§31a: the hole (144) is preset 1's room only over a one-line limit; else the 128 box", () => {
    // "$338.00" is 135.4 px at 32 px bold: wider than 128, narrower than 144.
    expect(donutSpentPreset("$338.00".length, 1)).toBe("text-preset-1");
    expect(donutSpentPreset("$338.00".length, 2)).toBe("text-preset-2");
    expect(donutSpentPreset("$38.00".length, 2)).toBe("text-preset-1");
  });

  it.each([
    ["$975.00", 1],
    ["$999,999.99", 1],
    ["$9,999,999.99", 2],
    ["$999,999,999.99", 2],
    ["$9,999,999,999.90", 2],
    ["$99,999,999,999.00", 3],
  ] as const)("the limit %s takes %i line(s)", (text, lines) => {
    expect(donutLimitLines(text.length)).toBe(lines);
  });

  it("donutCentreFit: the seed keeps preset 1 on one line; the ten largest budgets fit at the floor", () => {
    expect(donutCentreFit("$338.00", "$975.00")).toEqual({
      spentPreset: "text-preset-1",
      limitLines: 1,
    });
    expect(donutCentreFit("$338.00", "$9,999,999,999.90")).toEqual({
      spentPreset: "text-preset-2",
      limitLines: 2,
    });
    expect(donutCentreFit("$9,999,999,999.90", "$9,999,999,999.90")).toEqual({
      spentPreset: "text-preset-5-bold",
      limitLines: 2,
    });
  });

  it("is monotonic: a longer text never takes a larger preset or fewer limit lines", () => {
    const order = [
      "text-preset-1",
      "text-preset-2",
      "text-preset-3",
      "text-preset-4-bold",
      "text-preset-5-bold",
    ];
    for (let length = 5; length < 24; length++) {
      for (const lines of [1, 2, 3] as const) {
        expect(order.indexOf(donutSpentPreset(length + 1, lines))).toBeGreaterThanOrEqual(
          order.indexOf(donutSpentPreset(length, lines)),
        );
      }
      expect(donutLimitLines(length + 1)).toBeGreaterThanOrEqual(donutLimitLines(length));
    }
  });
});
