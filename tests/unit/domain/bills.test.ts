import { describe, expect, it } from "vitest";
import {
  DUE_SOON_DAYS,
  billsList,
  billsSummary,
  billsTotals,
  filterBills,
  recurringBills,
  sortBills,
} from "@/src/domain/bills";
import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";
import { transaction } from "@/tests/fixtures/domain";

const clock = fixedClock(BUSINESS_TODAY);
const bill = (name: string, date: string, amount = -1_037) =>
  transaction({ name, date, amount, recurring: true });

describe("recurringBills (data-model.md; US-27 AC1, AC2)", () => {
  it("makes one bill per vendor from the recurring transactions only, in order of appearance", () => {
    const rows = [
      bill("Water", "2026-07-30T12:00:00Z"),
      transaction({ name: "Cafe", date: "2026-08-02T12:00:00Z" }),
      bill("Power", "2026-08-02T12:00:00Z"),
      bill("Water", "2026-06-30T12:00:00Z"),
    ];
    expect(recurringBills(rows, clock).map((b) => b.name)).toEqual(["Water", "Power"]);
  });

  it("takes the day and the amount of the vendor's most recent transaction, as a positive amount", () => {
    const [power] = recurringBills(
      [
        bill("Power", "2026-07-02T12:00:00Z", -9_000),
        bill("Power", "2026-08-03T12:00:00Z", -10_037),
      ],
      clock,
    );
    expect(power).toMatchObject({ day: 3, amount: 10_037 });
    expect(power?.latest.date.toISOString()).toBe("2026-08-03T12:00:00.000Z");
  });

  it("is paid when the vendor has a transaction this month on or before today, whatever the hour", () => {
    const [bill19] = recurringBills([bill("Late", "2026-08-19T23:59:59Z")], clock);
    expect(bill19?.status).toBe("paid");
  });

  it("is not paid by a transaction dated after today", () => {
    const [future] = recurringBills([bill("Future", "2026-08-20T09:00:00Z")], clock);
    expect(future?.status).toBe("dueSoon");
  });

  it(`is due soon up to today + ${DUE_SOON_DAYS} (day 24) and upcoming from day 25`, () => {
    const bills = recurringBills(
      [bill("On 24th", "2026-07-24T12:00:00Z"), bill("On 25th", "2026-07-25T12:00:00Z")],
      clock,
    );
    expect(bills.map((b) => b.status)).toEqual(["dueSoon", "upcoming"]);
  });

  it("is due soon when an earlier day of this month went unpaid — the rule as written (the seed has no such case)", () => {
    const [missed] = recurringBills([bill("Missed", "2026-07-10T12:00:00Z")], clock);
    expect(missed?.status).toBe("dueSoon");
  });

  it("SPEC-recurring-bills 4.4: a bill last paid on the 31st of July is upcoming, its day 31", () => {
    const [day31] = recurringBills([bill("Day31", "2026-07-31T12:00:00Z")], clock);
    expect(day31).toMatchObject({ day: 31, status: "upcoming" });
  });

  it("US-30 AC1 SPEC-recurring-bills 4.4: a recurring income is a bill of its absolute amount", () => {
    const [refund] = recurringBills([bill("Refund", "2026-07-28T12:00:00Z", 2_311)], clock);
    expect(refund).toMatchObject({ amount: 2_311, status: "upcoming" });
  });

  it("returns no bills when nothing is recurring (US-08 AC3)", () => {
    expect(recurringBills([transaction()], clock)).toEqual([]);
  });
});

describe("billsSummary (SPEC-overview §2.6, US-28 AC1's rule)", () => {
  it("totals paid and not-paid bills; Due Soon is part of Upcoming", () => {
    const bills = recurringBills(
      [
        bill("Paid", "2026-08-05T12:00:00Z", -12_419),
        bill("Soon", "2026-07-22T12:00:00Z", -777),
        bill("Later", "2026-07-28T12:00:00Z", -3_219),
      ],
      clock,
    );
    expect(billsSummary(bills)).toEqual({ paid: 12_419, upcoming: 3_996, dueSoon: 777 });
  });

  it("is zero everywhere without bills (US-08 AC3)", () => {
    expect(billsSummary([])).toEqual({ paid: 0, upcoming: 0, dueSoon: 0 });
  });
});

// SPEC-recurring-bills 2.4: the list's rules. Hand-built bills, one rule at a time; the seed's
// own orders are tests/unit/seed-figures.test.ts's, from scripts/seed-figures.ts.

type Bill = { name: string; day: number; amount: number; status: "paid" | "dueSoon" | "upcoming" };
const b = (name: string, day = 7, amount = 1_037, status: Bill["status"] = "upcoming"): Bill => ({
  name,
  day,
  amount,
  status,
});
const names = (bills: readonly Bill[]) => bills.map((x) => x.name);

describe("sortBills (SPEC-recurring-bills 2.4; US-30 AC1)", () => {
  const bills = [
    b("Kilo", 17, 3_111),
    b("Echo", 3, 777),
    b("Mike", 28, 12_419),
    b("Bravo", 9, 2_000),
  ];

  it.each([
    ["latest", ["Echo", "Bravo", "Kilo", "Mike"]],
    ["oldest", ["Mike", "Kilo", "Bravo", "Echo"]],
    ["a-to-z", ["Bravo", "Echo", "Kilo", "Mike"]],
    ["z-to-a", ["Mike", "Kilo", "Echo", "Bravo"]],
    ["highest", ["Mike", "Kilo", "Bravo", "Echo"]],
    ["lowest", ["Echo", "Bravo", "Kilo", "Mike"]],
  ] as const)("%s orders by its key", (sort, expected) => {
    expect(names(sortBills(bills, sort))).toEqual(expected);
  });

  it("Latest is the earliest day in the month first, Oldest the latest day first", () => {
    expect(sortBills(bills, "latest").map((x) => x.day)).toEqual([3, 9, 17, 28]);
    expect(sortBills(bills, "oldest").map((x) => x.day)).toEqual([28, 17, 9, 3]);
  });

  it("§9 RB-Q8 (a): the same day breaks by name A to Z in both Latest and Oldest", () => {
    const sameDay = [b("beta", 21), b("Alpha", 21), b("alpha", 21)];
    expect(names(sortBills(sameDay, "latest"))).toEqual(["alpha", "Alpha", "beta"]);
    expect(names(sortBills(sameDay, "oldest"))).toEqual(["alpha", "Alpha", "beta"]);
  });

  it("§9 RB-Q8 (a): the same amount breaks by name A to Z in both Highest and Lowest, so Lowest is not Highest reversed", () => {
    const sameAmount = [b("Zulu", 2, 5_000), b("Alpha", 30, 5_000), b("Mid", 4, 900)];
    expect(names(sortBills(sameAmount, "highest"))).toEqual(["Alpha", "Zulu", "Mid"]);
    expect(names(sortBills(sameAmount, "lowest"))).toEqual(["Mid", "Alpha", "Zulu"]);
  });

  it("orders case variants as the collator does, and A to Z and Z to A are each other's reverse", () => {
    const cased = [b("beta"), b("Alpha"), b("alpha"), b("Beta")];
    const aToZ = names(sortBills(cased, "a-to-z"));
    expect(aToZ).toEqual(["alpha", "Alpha", "beta", "Beta"]);
    expect(names(sortBills(cased, "z-to-a"))).toEqual([...aToZ].reverse());
  });

  it("is total: two names the collator calls equal are ordered by code units, whatever the input order", () => {
    const composed = b("Caf\u00e9");
    const decomposed = b("Cafe\u0301");
    expect(new Intl.Collator("en").compare(composed.name, decomposed.name)).toBe(0);
    for (const input of [
      [composed, decomposed],
      [decomposed, composed],
    ]) {
      expect(names(sortBills(input, "a-to-z"))).toEqual(["Cafe\u0301", "Caf\u00e9"]);
    }
  });

  it("does not change its input", () => {
    const input = [b("Zulu"), b("Alpha")];
    sortBills(input, "a-to-z");
    expect(names(input)).toEqual(["Zulu", "Alpha"]);
  });
});

describe("filterBills (SPEC-recurring-bills 2.4, 2.12; US-29 AC1)", () => {
  const bills = [
    b("Harbor & Sons", 3, 1_037, "paid"),
    b("north.net", 21, 1_037, "dueSoon"),
    b("Harbor Lights", 27, 1_037, "upcoming"),
    b("Quill", 22, 1_037, "dueSoon"),
  ];
  const filter = (q: string | undefined, status?: Bill["status"]) =>
    names(filterBills(bills, { q, status }));

  it("finds a case-insensitive substring of the name", () => {
    expect(filter("HARBOR")).toEqual(["Harbor & Sons", "Harbor Lights"]);
    expect(filter("lights")).toEqual(["Harbor Lights"]);
  });

  it("reads & and . literally, never as a pattern", () => {
    expect(filter("r & s")).toEqual(["Harbor & Sons"]);
    expect(filter("h.n")).toEqual(["north.net"]);
    expect(filter(".")).toEqual(["north.net"]);
    expect(filter("h n")).toEqual([]);
  });

  it("trims the needle and keeps its inner spaces; all spaces filter nothing", () => {
    expect(filter("  bor l  ")).toEqual(["Harbor Lights"]);
    expect(filter("   ")).toEqual(names(bills));
    expect(filter(undefined)).toEqual(names(bills));
  });

  it("finds nothing when no name matches (the no-results state)", () => {
    expect(filter("zzz")).toEqual([]);
  });

  it("§9 RB-Q4 (a): keeps the bills whose own status is the one asked, alone and with a search", () => {
    expect(filter(undefined, "dueSoon")).toEqual(["north.net", "Quill"]);
    expect(filter(undefined, "upcoming")).toEqual(["Harbor Lights"]);
    expect(filter(undefined, "paid")).toEqual(["Harbor & Sons"]);
    expect(filter("harbor", "upcoming")).toEqual(["Harbor Lights"]);
    expect(filter("quill", "paid")).toEqual([]);
  });
});

describe("billsList (SPEC-recurring-bills 2.4: search, status, then sort)", () => {
  it("filters before it sorts", () => {
    const bills = [b("Echo", 9, 1_037, "dueSoon"), b("Delta", 3, 1_037, "dueSoon"), b("Alpha", 1)];
    expect(names(billsList(bills, { q: "e", sort: "latest", status: "dueSoon" }))).toEqual([
      "Delta",
      "Echo",
    ]);
  });
});

describe("billsTotals (SPEC-recurring-bills 2.4, US-28 AC1)", () => {
  it("counts and sums every bill, the paid ones, every unpaid one, and the due-soon ones", () => {
    const bills = [
      b("Paid", 5, 12_419, "paid"),
      b("Soon", 22, 777, "dueSoon"),
      b("Later", 28, 3_219, "upcoming"),
    ];
    expect(billsTotals(bills)).toEqual({
      total: { count: 3, amount: 16_415 },
      paid: { count: 1, amount: 12_419 },
      totalUpcoming: { count: 2, amount: 3_996 },
      dueSoon: { count: 1, amount: 777 },
    });
  });

  it("counts a due-soon bill in both Total Upcoming and Due Soon (the overlap)", () => {
    const totals = billsTotals([b("Soon", 22, 777, "dueSoon")]);
    expect(totals.totalUpcoming).toEqual(totals.dueSoon);
    expect(totals.paid).toEqual({ count: 0, amount: 0 });
  });

  it("US-30 AC2: four zero rows without bills", () => {
    const zero = { count: 0, amount: 0 };
    expect(billsTotals([])).toEqual({
      total: zero,
      paid: zero,
      totalUpcoming: zero,
      dueSoon: zero,
    });
  });

  it("agrees with billsSummary's three sums on the same bills", () => {
    const bills = recurringBills(
      [
        bill("Paid", "2026-08-05T12:00:00Z", -12_419),
        bill("Soon", "2026-07-22T12:00:00Z", -777),
        bill("Later", "2026-07-28T12:00:00Z", -3_219),
      ],
      clock,
    );
    const totals = billsTotals(bills);
    expect(billsSummary(bills)).toEqual({
      paid: totals.paid.amount,
      upcoming: totals.totalUpcoming.amount,
      dueSoon: totals.dueSoon.amount,
    });
  });
});
