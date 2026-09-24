import { describe, expect, it } from "vitest";
import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";
import {
  CATEGORY_LABEL,
  THEME_LABEL,
  categoryLabel,
  labelMap,
  themeLabel,
  toOverviewDto,
} from "@/src/server/overview";
import { CategorySchema, ThemeSchema } from "@/src/shared/schemas";

/**
 * CATEGORY_LABEL/THEME_LABEL are built directly from src/shared/enums.ts's CATEGORIES/THEMES,
 * which tests/unit/shared/enums.test.ts already holds to data-model.md, with its own
 * violation fixture (DoD v1.1) — not repeated here, since that would just re-check what that
 * file already checks. What is new here is that the *map's own construction* agrees with the
 * schemas (CategorySchema/ThemeSchema, src/shared/schemas.ts) built from the same arrays, and
 * (below) that labelMap itself would fail closed if it ever did not.
 */
describe("CATEGORY_LABEL / THEME_LABEL (SPEC-overview §6, T-04 hand-off)", () => {
  it("CATEGORY_LABEL's values are exactly CategorySchema's 10 options", () => {
    expect([...CATEGORY_LABEL.values()].sort()).toEqual([...CategorySchema.options].sort());
  });

  it("THEME_LABEL's values are exactly ThemeSchema's 15 options", () => {
    expect([...THEME_LABEL.values()].sort()).toEqual([...ThemeSchema.options].sort());
  });

  it("keys are the label with its spaces removed — the two multi-word themes included", () => {
    for (const [prismaKey, label] of THEME_LABEL) expect(prismaKey).toBe(label.replaceAll(" ", ""));
    for (const [prismaKey, label] of CATEGORY_LABEL) {
      expect(prismaKey).toBe(label.replaceAll(" ", ""));
    }
  });

  it("categoryLabel/themeLabel throw on a value the map does not have (violation fixture, DoD v1.1)", () => {
    expect(() => categoryLabel("NotACategory" as never)).toThrow(/Unmapped category/);
    expect(() => themeLabel("NotATheme" as never)).toThrow(/Unmapped theme/);
  });
});

describe("labelMap (both directions — DoD v1.1 violation fixtures)", () => {
  it("throws when a label has no matching Prisma key, same size on both sides", () => {
    expect(() => labelMap(["Foo"], { Bar: "Bar" })).toThrow(/"Foo".*has no matching Prisma key/);
  });

  it("throws when a Prisma enum has a key no label covers — a size mismatch", () => {
    expect(() => labelMap(["Foo"], { Foo: "Foo", Extra: "Extra" })).toThrow(
      /1 labels but 2 Prisma keys/,
    );
  });

  it("throws when two labels collide on the same Prisma key", () => {
    expect(() => labelMap(["A B", "AB"], { AB: "AB", C: "C" })).toThrow(
      /two labels map to the same Prisma key/,
    );
  });

  it("builds the map when the two sides truly agree", () => {
    expect([
      ...labelMap(["Dining Out", "Bills"], { DiningOut: "DiningOut", Bills: "Bills" }),
    ]).toEqual([
      ["DiningOut", "Dining Out"],
      ["Bills", "Bills"],
    ]);
  });

  it("does not fall for the inherited-property trap a bare `in` check would (Object.hasOwn)", () => {
    // "constructor" in {} is true (Object.prototype) — a bare `in` check would accept this
    // label and set Object.prototype.constructor (the Object function) as its "Prisma value".
    expect(() => labelMap(["constructor"], { Foo: "Foo" })).toThrow(
      /"constructor".*has no matching Prisma key "constructor"/,
    );
  });
});

describe("toOverviewDto (SPEC-overview §6: strict — no seq, no category/recurring on transactions)", () => {
  const clock = fixedClock(BUSINESS_TODAY);
  const summary = {
    balance: { current: 100_037, income: 50_000, expenses: 20_000 },
    pots: {
      total: 300,
      items: [{ id: "pot-1", seq: 1, name: "Savings", total: 300, theme: "Green" as const }],
    },
    transactions: [
      {
        id: "txn-1",
        seq: 99, // extra field a real row might carry — must not leak either
        name: "Vendor",
        avatar: "vendor",
        category: "Bills" as const,
        date: clock.today(),
        amount: -500,
        recurring: true,
      },
    ],
    budgets: {
      spent: 500,
      limit: 1000,
      items: [
        {
          id: "budget-1",
          seq: 1,
          category: "Bills" as const,
          maximum: 1000,
          spent: 500,
          theme: "Red" as const,
        },
      ],
    },
    bills: { paid: 0, upcoming: 500, dueSoon: 0 },
  };

  it("keeps id/name/avatar/amount/date on a transaction — drops category, recurring, seq", () => {
    const dto = toOverviewDto(summary);
    expect(dto.transactions).toEqual([
      {
        id: "txn-1",
        name: "Vendor",
        avatar: "vendor",
        amount: -500,
        date: clock.today().toISOString(),
      },
    ]);
  });

  it("keeps id/name/total/theme on a pot — drops seq", () => {
    expect(toOverviewDto(summary).pots.items).toEqual([
      { id: "pot-1", name: "Savings", total: 300, theme: "Green" },
    ]);
  });

  it("keeps id/category/maximum/spent/theme on a budget — drops seq", () => {
    expect(toOverviewDto(summary).budgets.items).toEqual([
      { id: "budget-1", category: "Bills", maximum: 1000, spent: 500, theme: "Red" },
    ]);
  });

  it("passes balance, pots.total, budgets.spent/limit and bills through unchanged", () => {
    const dto = toOverviewDto(summary);
    expect(dto.balance).toEqual(summary.balance);
    expect(dto.pots.total).toBe(300);
    expect(dto.budgets.spent).toBe(500);
    expect(dto.budgets.limit).toBe(1000);
    expect(dto.bills).toEqual(summary.bills);
  });
});
