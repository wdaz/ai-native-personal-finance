import { describe, expect, it } from "vitest";
import { DUE_SOON_DAYS, billsSummary, recurringBills } from "@/src/domain/bills";
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

  it("returns no bills when nothing is recurring (US-08 AC3)", () => {
    expect(recurringBills([transaction()], clock)).toEqual([]);
  });
});

describe("billsSummary (SPEC-overview §2.6, US-28 AC1)", () => {
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
