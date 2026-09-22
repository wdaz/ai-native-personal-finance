import { describe, expect, it } from "vitest";
import { sumCents } from "@/src/domain/money";

// toCents keeps its tests in tests/unit/seed.test.ts, beside the seed amounts it converts.
describe("sumCents (ADR-0005: money is integer cents)", () => {
  it("adds whole cents, signs included", () => {
    expect(sumCents([12_345, -2_000, 7])).toBe(10_352);
  });

  it("is 0 for no amounts", () => {
    expect(sumCents([])).toBe(0);
  });

  it("adds the largest amounts NFR-S3 allows without losing a cent", () => {
    expect(sumCents([99_999_999_999, 99_999_999_999, 1])).toBe(199_999_999_999);
  });

  it.each([1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53])(
    "refuses %d, which is not a whole number of cents",
    (amount) => {
      expect(() => sumCents([100, amount])).toThrow("is not a whole number of cents");
    },
  );

  it("refuses a database BigInt that was not converted to a number (T-09)", () => {
    expect(() => sumCents([100, 250n as unknown as number])).toThrow(
      "is not a whole number of cents",
    );
  });

  it("refuses a total beyond the exact range of a number", () => {
    expect(() => sumCents([Number.MAX_SAFE_INTEGER, 1])).toThrow("beyond the exact range");
  });

  it("refuses a partial sum beyond the exact range, even when later amounts bring it back", () => {
    expect(() => sumCents([Number.MAX_SAFE_INTEGER, 2, -2])).toThrow("beyond the exact range");
  });
});
