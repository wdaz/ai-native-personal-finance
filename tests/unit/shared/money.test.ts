import { describe, expect, it } from "vitest";
import { formatMoney, formatSignedMoney } from "@/src/shared/money";

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
