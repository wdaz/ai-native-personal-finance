import { describe, expect, it } from "vitest";
import { BILL_STATUSES } from "@/src/shared/recurring-bills-query";
import {
  BillStatusSchema,
  RecurringBillsDtoSchema,
  type RecurringBillsDto,
} from "@/src/shared/schemas";

/**
 * Hand-built bills. Their amounts are chosen not to equal any seed figure
 * (build-workflow.md: seed figures come from scripts/seed-figures.ts, never typed).
 */
const item = (n: number) => ({
  name: `Vendor ${n}`,
  avatar: "spark-electric-solutions",
  day: n,
  amount: 1_037 * n,
  status: BILL_STATUSES[n % 3]!,
});
const row = (count: number, amount: number) => ({ count, amount });

const dto: RecurringBillsDto = {
  items: [1, 2, 3].map(item),
  summary: {
    total: row(3, 6_222),
    paid: row(1, 3_111),
    totalUpcoming: row(2, 3_111),
    dueSoon: row(1, 1_037),
  },
};

describe("SPEC-recurring-bills 2.11: RecurringBillsDtoSchema", () => {
  it("accepts the bills and the summary", () => {
    expect(RecurringBillsDtoSchema.parse(dto)).toEqual(dto);
  });

  it("US-30 AC2 accepts no bills with four zero rows", () => {
    const zero = row(0, 0);
    expect(() =>
      RecurringBillsDtoSchema.parse({
        items: [],
        summary: { total: zero, paid: zero, totalUpcoming: zero, dueSoon: zero },
      }),
    ).not.toThrow();
  });

  it("is strict at every level, so a leaked field fails (an id, the latest transaction, a stray total)", () => {
    expect(() => RecurringBillsDtoSchema.parse({ ...dto, total: 3 })).toThrow();
    expect(() =>
      RecurringBillsDtoSchema.parse({ ...dto, items: [{ ...item(1), id: "x" }] }),
    ).toThrow();
    expect(() =>
      RecurringBillsDtoSchema.parse({ ...dto, items: [{ ...item(1), latest: {} }] }),
    ).toThrow();
    expect(() =>
      RecurringBillsDtoSchema.parse({ ...dto, summary: { ...dto.summary, upcoming: row(2, 1) } }),
    ).toThrow();
    expect(() =>
      RecurringBillsDtoSchema.parse({
        ...dto,
        summary: { ...dto.summary, paid: { ...row(1, 1), cents: 1 } },
      }),
    ).toThrow();
  });

  it("2.1: its status reads BILL_STATUSES and refuses any other", () => {
    expect(BillStatusSchema.options).toEqual(BILL_STATUSES);
    for (const status of ["late", "due-soon", "Paid"]) {
      expect(() =>
        RecurringBillsDtoSchema.parse({ ...dto, items: [{ ...item(1), status }] }),
      ).toThrow();
    }
  });

  it.each([
    ["day 0", { day: 0 }],
    ["day 32", { day: 32 }],
    ["a fractional day", { day: 1.5 }],
    ["a negative amount (bills are absolute, US-30 AC1)", { amount: -1 }],
    ["fractional cents", { amount: 1.5 }],
    ["an empty name", { name: "" }],
    ["a 61-character name", { name: "a".repeat(61) }],
    ["an avatar path instead of its key", { avatar: "./assets/images/avatars/x.jpg" }],
  ])("refuses %s", (_, change) => {
    expect(() =>
      RecurringBillsDtoSchema.parse({ ...dto, items: [{ ...item(1), ...change }] }),
    ).toThrow();
  });

  it("refuses a negative or fractional count", () => {
    for (const count of [-1, 1.5]) {
      expect(() =>
        RecurringBillsDtoSchema.parse({ ...dto, summary: { ...dto.summary, paid: row(count, 1) } }),
      ).toThrow();
    }
  });
});
