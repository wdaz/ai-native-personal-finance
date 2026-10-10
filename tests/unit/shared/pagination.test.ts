import { describe, expect, it } from "vitest";
import { PAGE_NUMBERS_NARROW, PAGE_NUMBERS_WIDE, pageItems } from "@/src/shared/pagination";

/** `1 2 3 … 5`-style strings, so each example reads as SPEC-transactions 2.7 writes it. */
const show = (current: number, count: number, max: number) =>
  pageItems(current, count, max)
    .map((item) => (item === "gap" ? "…" : String(item)))
    .join(" ");

describe("pageItems (SPEC-transactions 2.7, US-09 AC3)", () => {
  it("the two widths' limits are 7 and 3 (4.1)", () => {
    expect(PAGE_NUMBERS_WIDE).toBe(7);
    expect(PAGE_NUMBERS_NARROW).toBe(3);
  });

  describe("768 px and up (7)", () => {
    it.each([
      [1, 1, "1"],
      [2, 3, "1 2 3"],
      [3, 5, "1 2 3 4 5"],
      [7, 7, "1 2 3 4 5 6 7"],
      [1, 8, "1 2 … 8"],
      [3, 8, "1 2 3 4 … 8"],
      [4, 8, "1 2 3 4 5 … 8"],
      [5, 8, "1 … 4 5 6 7 8"],
      [8, 8, "1 … 7 8"],
      [1, 20, "1 2 … 20"],
      [10, 20, "1 … 9 10 11 … 20"],
      [20, 20, "1 … 19 20"],
    ])("page %i of %i → %s", (current, count, expected) => {
      expect(show(current, count, PAGE_NUMBERS_WIDE)).toBe(expected);
    });

    it("never shows more than seven items", () => {
      for (let count = 1; count <= 30; count++) {
        for (let current = 1; current <= count; current++) {
          expect(pageItems(current, count, PAGE_NUMBERS_WIDE).length).toBeLessThanOrEqual(7);
        }
      }
    });
  });

  describe("below 768 px (3)", () => {
    it.each([
      [1, 1, "1"],
      [2, 3, "1 2 3"],
      [1, 5, "1 2 3 …"],
      [2, 5, "1 2 3 …"],
      [3, 5, "… 2 3 4 …"],
      [4, 5, "… 3 4 5"],
      [5, 5, "… 3 4 5"],
      [1, 7, "1 2 3 …"],
      [4, 8, "… 3 4 5 …"],
      [20, 20, "… 18 19 20"],
    ])("page %i of %i → %s", (current, count, expected) => {
      expect(show(current, count, PAGE_NUMBERS_NARROW)).toBe(expected);
    });

    it("never shows more than three numbers, and always the current one", () => {
      for (let count = 1; count <= 20; count++) {
        for (let current = 1; current <= count; current++) {
          const items = pageItems(current, count, PAGE_NUMBERS_NARROW);
          expect(items.filter((item) => item !== "gap").length).toBeLessThanOrEqual(3);
          expect(items).toContain(current);
        }
      }
    });
  });

  it("clamps a current page outside 1…count", () => {
    expect(show(0, 5, PAGE_NUMBERS_NARROW)).toBe("1 2 3 …");
    expect(show(9, 5, PAGE_NUMBERS_NARROW)).toBe("… 3 4 5");
  });
});
