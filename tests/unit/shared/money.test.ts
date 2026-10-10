import { describe, expect, it } from "vitest";
import {
  formatAmountInput,
  formatPercent,
  formatMoney,
  formatSignedMoney,
  parseAmountInput,
} from "@/src/shared/money";
import { seedOverviewInput } from "@/scripts/seed-figures";

describe("formatMoney (SPEC-overview §4.2: `$`, thousands separators, two decimals)", () => {
  it.each([
    [123_456, "$1,234.56"],
    [1, "$0.01"],
    [-1, "-$0.01"],
    [5, "$0.05"],
    [100_000_000, "$1,000,000.00"],
    [-4_210, "-$42.10"],
    [-123_456_789, "-$1,234,567.89"],
    [0, "$0.00"],
    [99_999_999_999, "$999,999,999.99"],
  ])("writes %d cents as %s", (cents, text) => {
    expect(formatMoney(cents)).toBe(text);
  });

  it("writes negative zero as $0.00, not -$0.00", () => {
    expect(formatMoney(-0)).toBe("$0.00");
  });

  it.each([1.5, Number.NaN, 2 ** 53])(
    "refuses %d, which is not a whole number of cents",
    (cents) => {
      expect(() => formatMoney(cents)).toThrow("is not a whole number of cents");
    },
  );
});

describe("formatSignedMoney (SPEC-overview §2.4: transaction rows)", () => {
  it.each([
    [1_234, "+$12.34"],
    [-1_234, "-$12.34"],
    [1, "+$0.01"],
    [0, "$0.00"],
  ])("writes %d cents as %s", (cents, text) => {
    expect(formatSignedMoney(cents)).toBe(text);
  });
});

/**
 * SPEC-ui-kit 4.1, the worked amount grammar (the figures record,
 * `prompts/2026-10-04-T-15d/ui-kit-figures/output.txt`), every line as a case (H13 (4)).
 * Failing first (T-22): `parseAmountInput` did not exist.
 */
describe("parseAmountInput (SPEC-ui-kit 2.5, 4.1; US-15 AC2, US-22 AC2, US-25 AC2, US-26 AC2)", () => {
  it.each([
    ["0.01", 1],
    ["1", 100],
    ["42", 4_200],
    [" 42 ", 4_200],
    ["007", 700],
    ["75.5", 7_550],
    ["75.50", 7_550],
    [".5", 50],
    ["$1,234.50", 123_450],
    ["1,234.5", 123_450],
    ["1234.50", 123_450],
    ["12,345,678", 1_234_567_800],
    ["$999,999,999.99", 99_999_999_999],
    ["999999999.99", 99_999_999_999],
  ])("accepts %j as %d cents", (text, cents) => {
    expect(parseAmountInput(text)).toEqual({ ok: true, cents });
  });

  it.each(["", "   "])("reads %j as required", (text) => {
    expect(parseAmountInput(text)).toEqual({ ok: false, code: "required" });
  });

  it.each(["0", "0.00", "$0", "-5", "-$5", "-0"])("reads %j as too_small", (text) => {
    expect(parseAmountInput(text)).toEqual({ ok: false, code: "too_small" });
  });

  it.each(["1,000,000,000", "1000000000", "99999999999999999999"])(
    "reads %j as too_large",
    (text) => {
      expect(parseAmountInput(text)).toEqual({ ok: false, code: "too_large" });
    },
  );

  it.each([
    "5.",
    "$-5",
    "1.234",
    "1,23",
    "1,2345",
    "12,34.5",
    "0,500",
    "0,123",
    "01,234",
    "$ 5",
    "$$5",
    "$",
    "-",
    "1e3",
    "0x10",
    "Infinity",
    "NaN",
    "5 000",
    "５",
    "−5",
    "USD 5",
  ])("reads %j as invalid_format", (text) => {
    expect(parseAmountInput(text)).toEqual({ ok: false, code: "invalid_format" });
  });
});

describe("formatAmountInput (SPEC-ui-kit 2.5, 4.1: an edit form's pre-fill; US-16 AC1, US-23 AC1)", () => {
  it.each([
    [1, "0.01"],
    [7_550, "75.50"],
    [123_450, "1234.50"],
    [99_999_999_999, "999999999.99"],
    [75_000, "750"],
  ])("writes %d cents as %s", (cents, text) => {
    expect(formatAmountInput(cents)).toBe(text);
  });

  it("writes the seed's budget maximums and pot targets as whole dollars, digits only", () => {
    const seed = seedOverviewInput();
    const amounts = [...seed.budgets.map((b) => b.maximum), ...seed.pots.map((p) => p.target)];
    for (const cents of amounts) {
      expect(formatAmountInput(cents)).toBe(String(cents / 100));
    }
  });

  it("reads back to the same cents for every accepted value of 4.1 and every seed amount", () => {
    const seed = seedOverviewInput();
    const amounts = [
      1,
      100,
      700,
      4_200,
      7_550,
      50,
      123_450,
      1_234_567_800,
      99_999_999_999,
      ...seed.budgets.map((b) => b.maximum),
      ...seed.pots.map((p) => p.target),
    ];
    for (const cents of amounts) {
      expect(parseAmountInput(formatAmountInput(cents))).toEqual({ ok: true, cents });
    }
  });

  it("refuses a value that is not whole, non-negative cents", () => {
    expect(() => formatAmountInput(1.5)).toThrow();
    expect(() => formatAmountInput(-1)).toThrow();
  });
});

describe("formatPercent (SPEC-pots 2.3: basis points, two decimals, no separator)", () => {
  it.each([
    [795, "7.95%"],
    [10_667, "106.67%"],
    [0, "0.00%"],
    [5, "0.05%"],
    [57_560_000_00, "57560000.00%"],
  ])("US-21 AC1 %i basis points read %s", (basisPoints, text) => {
    expect(formatPercent(basisPoints)).toBe(text);
  });

  it("refuses a value that is not whole, non-negative basis points", () => {
    expect(() => formatPercent(7.5)).toThrow("7.5");
    expect(() => formatPercent(-1)).toThrow("-1");
  });
});
