import { describe, expect, it } from "vitest";
import { TransactionsDtoSchema, type TransactionsDto } from "@/src/shared/schemas";
import { TRANSACTIONS_PAGE_SIZE } from "@/src/shared/transactions-query";

/**
 * A hand-built page of the list. Its amounts are chosen not to equal any seed figure
 * (build-workflow.md: seed figures come from scripts/seed-figures.ts, never typed).
 */
const item = (n: number) => ({
  id: `00000000-0000-4000-9000-0000000000${String(n).padStart(2, "0")}`,
  name: `Vendor ${n}`,
  avatar: "savory-bites-bistro",
  category: "Dining Out" as const,
  date: `2026-08-0${(n % 9) + 1}T09:15:00.000Z`,
  amount: n % 2 === 0 ? 2_311 : -2_311,
});

const dto: TransactionsDto = {
  items: [1, 2, 3].map(item),
  page: 2,
  pageSize: TRANSACTIONS_PAGE_SIZE,
  pageCount: 2,
  total: 13,
};

describe("SPEC-transactions 2.13: TransactionsDtoSchema", () => {
  it("accepts a page of the list", () => {
    expect(TransactionsDtoSchema.parse(dto)).toEqual(dto);
  });

  it("accepts the empty list: page 1 of 1, total 0", () => {
    expect(() =>
      TransactionsDtoSchema.parse({ ...dto, items: [], page: 1, pageCount: 1, total: 0 }),
    ).not.toThrow();
  });

  it("is strict at both levels, so a leaked field fails (recurring, seeded)", () => {
    expect(() => TransactionsDtoSchema.parse({ ...dto, seeded: false })).toThrow();
    expect(() =>
      TransactionsDtoSchema.parse({ ...dto, items: [{ ...item(1), recurring: true }] }),
    ).toThrow();
  });

  it("holds at most ten items, a page size of exactly 10 and pages from 1", () => {
    const eleven = Array.from({ length: TRANSACTIONS_PAGE_SIZE + 1 }, (_, n) => item(n));
    expect(() => TransactionsDtoSchema.parse({ ...dto, items: eleven })).toThrow();
    expect(() => TransactionsDtoSchema.parse({ ...dto, pageSize: 20 })).toThrow();
    expect(() => TransactionsDtoSchema.parse({ ...dto, page: 0 })).toThrow();
    expect(() => TransactionsDtoSchema.parse({ ...dto, pageCount: 0 })).toThrow();
    expect(() => TransactionsDtoSchema.parse({ ...dto, total: -1 })).toThrow();
  });

  it("carries a display category, integer cents and a UTC date", () => {
    expect(() =>
      TransactionsDtoSchema.parse({ ...dto, items: [{ ...item(1), category: "DiningOut" }] }),
    ).toThrow();
    expect(() =>
      TransactionsDtoSchema.parse({ ...dto, items: [{ ...item(1), amount: 23.11 }] }),
    ).toThrow();
    expect(() =>
      TransactionsDtoSchema.parse({
        ...dto,
        items: [{ ...item(1), date: "2026-08-01T09:15:00+02:00" }],
      }),
    ).toThrow();
  });
});
