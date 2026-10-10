import { describe, expect, it } from "vitest";
import {
  compareLatest,
  filterTransactions,
  latestTransactions,
  paginate,
  sortTransactions,
  transactionsPage,
} from "@/src/domain/transactions";
import { TRANSACTION_SORTS, TRANSACTIONS_PAGE_SIZE } from "@/src/shared/transactions-query";
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

  it("orders names A to Z as a reader would, not by code unit", () => {
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

// ---------------------------------------------------------------------------------------
// SPEC-transactions 2.4: the list's rules. Hand-built rows, one rule at a time; the seed's
// own first and last rows are tests/unit/seed-figures.test.ts's, from scripts/seed-figures.ts.

const row = (id: string, fields: Parameters<typeof transaction>[0] = {}) => ({
  ...transaction(fields),
  id,
});
const ids = (rows: { id: string }[]) => rows.map((r) => r.id);

describe("sortTransactions (SPEC-transactions 2.4, US-11 AC1)", () => {
  const rows = [
    row("a", { name: "Moe", date: "2026-08-10T12:00:00Z", amount: -500 }),
    row("b", { name: "Amy", date: "2026-08-12T12:00:00Z", amount: 2_000 }),
    row("c", { name: "Zed", date: "2026-08-11T12:00:00Z", amount: -100 }),
  ];

  it.each([
    ["latest", ["b", "c", "a"]],
    ["oldest", ["a", "c", "b"]],
    ["a-to-z", ["b", "a", "c"]],
    ["z-to-a", ["c", "a", "b"]],
    ["highest", ["b", "c", "a"]],
    ["lowest", ["a", "c", "b"]],
  ] as const)("US-11 orders by %s", (sort, expected) => {
    expect(ids(sortTransactions(rows, sort))).toEqual(expected);
  });

  it("leaves the input in its order and returns the caller's own rows", () => {
    const sorted = sortTransactions(rows, "a-to-z");
    expect(ids(rows)).toEqual(["a", "b", "c"]);
    expect(sorted[0]).toBe(rows[1]);
  });

  it("US-11 Latest equals compareLatest, the Release 1 order (then id)", () => {
    const shuffled = [
      row("1", { name: "Kim", date: "2026-08-03T10:00:00Z" }),
      row("2", { name: "Ann", date: "2026-08-03T10:00:00Z" }),
      row("3", { name: "Bo", date: "2026-08-04T09:00:00Z" }),
      row("4", { name: "Al", date: "2026-08-01T23:00:00Z" }),
    ];
    expect(sortTransactions(shuffled, "latest")).toEqual([...shuffled].sort(compareLatest));
  });

  it("US-11 Latest and Oldest break equal timestamps by name, A to Z in both", () => {
    const at = "2026-08-19T12:00:00Z";
    const tied = [row("1", { name: "Zed", date: at }), row("2", { name: "Amy", date: at })];
    expect(ids(sortTransactions(tied, "latest"))).toEqual(["2", "1"]);
    expect(ids(sortTransactions(tied, "oldest"))).toEqual(["2", "1"]);
  });

  it("US-11 compares the full timestamp, not the calendar day", () => {
    const sameDay = [
      row("1", { name: "Amy", date: "2026-08-17T09:00:00Z" }),
      row("2", { name: "Zed", date: "2026-08-17T21:00:00Z" }),
    ];
    expect(ids(sortTransactions(sameDay, "latest"))).toEqual(["2", "1"]);
    expect(ids(sortTransactions(sameDay, "oldest"))).toEqual(["1", "2"]);
  });

  it("US-11 orders names as a reader would: case variants by the collator, not by code unit", () => {
    const at = "2026-08-19T12:00:00Z";
    const variants = [
      row("1", { name: "Banana", date: at }),
      row("2", { name: "Apple", date: at }),
      row("3", { name: "apple", date: at }),
    ];
    expect(ids(sortTransactions(variants, "a-to-z"))).toEqual(["3", "2", "1"]);
    expect(ids(sortTransactions(variants, "z-to-a"))).toEqual(["1", "2", "3"]);
  });

  it("US-11 A to Z and Z to A break equal names by timestamp, newest first in both", () => {
    const same = [
      row("1", { name: "Emma", date: "2026-07-20T12:00:00Z" }),
      row("2", { name: "Emma", date: "2026-08-19T12:00:00Z" }),
    ];
    expect(ids(sortTransactions(same, "a-to-z"))).toEqual(["2", "1"]);
    expect(ids(sortTransactions(same, "z-to-a"))).toEqual(["2", "1"]);
  });

  it("US-11 Highest and Lowest break equal amounts by timestamp, newest first in both", () => {
    const equal = [
      row("1", { amount: -10_000, date: "2026-07-02T12:00:00Z" }),
      row("2", { amount: -10_000, date: "2026-08-02T12:00:00Z" }),
      row("3", { amount: -10_000, date: "2026-07-30T12:00:00Z" }),
    ];
    expect(ids(sortTransactions(equal, "highest"))).toEqual(["2", "3", "1"]);
    expect(ids(sortTransactions(equal, "lowest"))).toEqual(["2", "3", "1"]);
  });

  it("US-11 Highest puts income first: the signed amount, not its size", () => {
    const signed = [row("out", { amount: -5_000 }), row("in", { amount: 100 })];
    expect(ids(sortTransactions(signed, "highest"))).toEqual(["in", "out"]);
    expect(ids(sortTransactions(signed, "lowest"))).toEqual(["out", "in"]);
  });

  it.each(TRANSACTION_SORTS)(
    "%s ends every tie with the id, ascending, so no row crosses a page between requests",
    (sort) => {
      const twins = ["c", "a", "b"].map((id) => row(id));
      expect(ids(sortTransactions(twins, sort))).toEqual(["a", "b", "c"]);
    },
  );
});

describe("filterTransactions (SPEC-transactions 2.4, US-10, US-12)", () => {
  const rows = [
    row("1", { name: "Emma Richardson", category: "General" }),
    row("2", { name: "Savory Bites Bistro", category: "Dining Out" }),
    row("3", { name: "Sebastian Cook", category: "Dining Out" }),
    row("4", { name: "Dr. Who 100%", category: "Bills" }),
  ];

  it("US-10 matches a case-insensitive substring of the name", () => {
    expect(ids(filterTransactions(rows, { q: "EMMA", category: undefined }))).toEqual(["1"]);
    expect(ids(filterTransactions(rows, { q: "co", category: undefined }))).toEqual(["3"]);
  });

  it("US-10 reads `.` and `%` as themselves, not as patterns", () => {
    expect(ids(filterTransactions(rows, { q: "r.", category: undefined }))).toEqual(["4"]);
    expect(ids(filterTransactions(rows, { q: "0%", category: undefined }))).toEqual(["4"]);
    expect(filterTransactions(rows, { q: ".*", category: undefined })).toEqual([]);
  });

  it("US-10 searches the name only, never the category", () => {
    expect(filterTransactions(rows, { q: "bills", category: undefined })).toEqual([]);
  });

  it("US-10 filters nothing for an absent or an all-space needle", () => {
    expect(filterTransactions(rows, { q: undefined, category: undefined })).toEqual(rows);
    expect(filterTransactions(rows, { q: "   ", category: undefined })).toEqual(rows);
  });

  it("US-12 keeps the category by exact display name", () => {
    expect(ids(filterTransactions(rows, { q: undefined, category: "Dining Out" }))).toEqual([
      "2",
      "3",
    ]);
  });

  it("US-10 and US-12 apply the search and the category together", () => {
    expect(ids(filterTransactions(rows, { q: "s", category: "Dining Out" }))).toEqual(["2", "3"]);
    expect(filterTransactions(rows, { q: "emma", category: "Dining Out" })).toEqual([]);
  });
});

describe("paginate (SPEC-transactions 2.4, US-09)", () => {
  const rows = Array.from({ length: 49 }, (_, n) => n);

  it("US-09 AC1 gives ten rows a page and the last page the rest", () => {
    expect(paginate(rows, 1)).toEqual({
      items: rows.slice(0, TRANSACTIONS_PAGE_SIZE),
      page: 1,
      pageCount: 5,
      total: 49,
    });
    expect(paginate(rows, 5).items).toEqual(rows.slice(40));
  });

  it("US-09 AC4 clamps a page beyond the end to the last page, and below 1 to 1", () => {
    expect(paginate(rows, 99).page).toBe(5);
    expect(paginate(rows, Number.POSITIVE_INFINITY).page).toBe(5);
    expect(paginate(rows, 0).page).toBe(1);
    expect(paginate(rows, Number.NaN).page).toBe(1);
  });

  it("gives no rows page 1 of 1, total 0", () => {
    expect(paginate([], 3)).toEqual({ items: [], page: 1, pageCount: 1, total: 0 });
  });

  it("gives exactly ten rows one page", () => {
    expect(paginate(rows.slice(0, 10), 2)).toMatchObject({ page: 1, pageCount: 1, total: 10 });
  });
});

describe("transactionsPage (SPEC-transactions 2.4: category, search, sort, page, in that order)", () => {
  it("filters before it pages, so the total and the pages count the matches", () => {
    const many = Array.from({ length: 12 }, (_, n) =>
      row(String(n).padStart(2, "0"), {
        name: n % 2 === 0 ? `Even ${n}` : `Odd ${n}`,
        date: `2026-08-${String(n + 1).padStart(2, "0")}T12:00:00Z`,
      }),
    );
    const result = transactionsPage(many, {
      q: "even",
      category: undefined,
      sort: "oldest",
      page: 1,
    });
    expect(result.total).toBe(6);
    expect(result.pageCount).toBe(1);
    expect(ids(result.items)).toEqual(["00", "02", "04", "06", "08", "10"]);
  });
});
