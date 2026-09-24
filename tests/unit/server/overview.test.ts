import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";
import {
  CATEGORY_LABEL,
  THEME_LABEL,
  categoryLabel,
  themeLabel,
  toOverviewDto,
} from "@/src/server/overview";
import { CategorySchema, ThemeSchema } from "@/src/shared/schemas";

const repoRoot = join(import.meta.dirname, "..", "..", "..");
const read = (path: string) => readFileSync(join(repoRoot, path), "utf8");
const documentedList = (name: "Category" | "Theme") =>
  (
    new RegExp(`\`${name}\` = ([^.]+)\\.`).exec(read("docs/02-architecture/data-model.md"))?.[1] ??
    ""
  )
    .split(",")
    .map((label) => label.trim());

describe("CATEGORY_LABEL / THEME_LABEL (SPEC-overview §6, T-04 hand-off)", () => {
  it("CATEGORY_LABEL covers exactly CategorySchema's 10 options and data-model.md's own list", () => {
    const documented = documentedList("Category");
    expect(documented).toHaveLength(10);
    expect([...CATEGORY_LABEL.values()].sort()).toEqual([...CategorySchema.options].sort());
    expect([...CATEGORY_LABEL.values()].sort()).toEqual([...documented].sort());
  });

  it("THEME_LABEL covers exactly ThemeSchema's 15 options and data-model.md's own list", () => {
    const documented = documentedList("Theme");
    expect(documented).toHaveLength(15);
    expect([...THEME_LABEL.values()].sort()).toEqual([...ThemeSchema.options].sort());
    expect([...THEME_LABEL.values()].sort()).toEqual([...documented].sort());
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
