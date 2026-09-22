import { describe, expect, it } from "vitest";
import { latestTransactions } from "@/src/domain/transactions";
import { transaction } from "@/tests/fixtures/domain";

const names = (rows: { name: string }[]) => rows.map((row) => row.name);

describe("latestTransactions (US-06 AC1, ordered as US-11 Latest)", () => {
  it("puts the newest first by full timestamp, not by day", () => {
    const rows = [
      transaction({ name: "Morning", date: "2026-08-19T08:00:00Z" }),
      transaction({ name: "Yesterday", date: "2026-08-18T23:59:59Z" }),
      transaction({ name: "Evening", date: "2026-08-19T20:00:00Z" }),
    ];
    expect(names(latestTransactions(rows, 5))).toEqual(["Evening", "Morning", "Yesterday"]);
  });

  it("breaks a tie of equal timestamps by name, A to Z (the seed has none)", () => {
    const at = "2026-08-19T12:00:00Z";
    const rows = [
      transaction({ name: "Zed", date: at }),
      transaction({ name: "Amy", date: at }),
      transaction({ name: "Moe", date: at }),
    ];
    expect(names(latestTransactions(rows, 5))).toEqual(["Amy", "Moe", "Zed"]);
  });

  it("orders names as a reader would, ignoring case", () => {
    const at = "2026-08-19T12:00:00Z";
    const rows = [
      transaction({ name: "Banana", date: at }),
      transaction({ name: "apple", date: at }),
    ];
    expect(names(latestTransactions(rows, 5))).toEqual(["apple", "Banana"]);
  });

  it("returns at most `count`, and the ones there are when fewer (US-06 AC3)", () => {
    const rows = [1, 2, 3, 4, 5, 6, 7].map((day) =>
      transaction({ name: `Day ${day}`, date: `2026-08-0${day}T12:00:00Z` }),
    );
    expect(names(latestTransactions(rows, 5))).toEqual([
      "Day 7",
      "Day 6",
      "Day 5",
      "Day 4",
      "Day 3",
    ]);
    expect(latestTransactions(rows.slice(0, 2), 5)).toHaveLength(2);
    expect(latestTransactions([], 5)).toEqual([]);
  });

  it("returns the caller's own rows and leaves the input in its order", () => {
    const rows = [
      { ...transaction({ name: "Old", date: "2026-08-01T12:00:00Z" }), id: "a" },
      { ...transaction({ name: "New", date: "2026-08-02T12:00:00Z" }), id: "b" },
    ];
    expect(latestTransactions(rows, 5).map((row) => row.id)).toEqual(["b", "a"]);
    expect(names(rows)).toEqual(["Old", "New"]);
  });

  it.each([-1, 2.5, Number.NaN])("refuses a count of %d", (count) => {
    expect(() => latestTransactions([], count)).toThrow("is not a whole number of transactions");
  });
});
