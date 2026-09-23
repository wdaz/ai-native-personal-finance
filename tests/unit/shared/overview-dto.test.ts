import { describe, expect, it } from "vitest";
import { OVERVIEW_CARD_ITEMS, OVERVIEW_TRANSACTIONS } from "@/src/domain/overview";
import { OVERVIEW_LIST_MAX, OverviewDtoSchema, type OverviewDto } from "@/src/shared/schemas";

/**
 * A hand-built Overview. Its amounts are chosen not to equal any seed figure
 * (build-workflow.md: seed figures come from scripts/seed-figures.ts, never typed).
 */
const pot = (n: number) => ({
  id: `00000000-0000-4000-8000-00000000000${n}`,
  name: `Pot ${n}`,
  total: 1_001 * n,
  theme: "Navy Grey" as const,
});
const transaction = (n: number) => ({
  id: `00000000-0000-4000-9000-00000000000${n}`,
  name: `Vendor ${n}`,
  avatar: "savory-bites-bistro",
  amount: n % 2 === 0 ? 2_311 : -2_311,
  date: `2026-08-0${n}T09:15:00.000Z`,
});
const budget = (n: number) => ({
  id: `00000000-0000-4000-a000-00000000000${n}`,
  category: "Dining Out" as const,
  maximum: 7_013,
  spent: 1_207,
  theme: "Army Green" as const,
});

const overview: OverviewDto = {
  balance: { current: 123_456, income: 98_765, expenses: 43_210 },
  pots: { total: 10_010, items: [pot(1), pot(2)] },
  transactions: [transaction(1), transaction(2)],
  budgets: { spent: 1_207, limit: 7_013, items: [budget(1)] },
  bills: { paid: 3_001, upcoming: 4_002, dueSoon: 1_003 },
};

const valid = (dto: unknown) => OverviewDtoSchema.safeParse(dto).success;

describe("OverviewDto (SPEC-overview §6: cents; dates ISO-8601 UTC)", () => {
  it("accepts an Overview in the spec's shape", () => {
    expect(OverviewDtoSchema.parse(overview)).toEqual(overview);
  });

  it("accepts the empty Overview of the seed variants (§2.7)", () => {
    expect(
      valid({
        ...overview,
        pots: { total: 0, items: [] },
        transactions: [],
        budgets: { spent: 0, limit: 0, items: [] },
        bills: { paid: 0, upcoming: 0, dueSoon: 0 },
      }),
    ).toBe(true);
  });

  it("takes dates as Date#toISOString() writes them, and refuses offsets and zone-less times", () => {
    const at = (date: string) => ({ ...overview, transactions: [{ ...transaction(1), date }] });
    expect(valid(at(new Date(Date.UTC(2026, 7, 19, 20, 23, 11)).toISOString()))).toBe(true);
    expect(valid(at("2026-08-19T20:23:11+04:00"))).toBe(false);
    expect(valid(at("2026-08-19T20:23:11"))).toBe(false);
    expect(valid(at("2026-08-19"))).toBe(false);
  });

  it("takes money as whole cents only — no dollars, no BigInt, nothing past 2^53", () => {
    const current = (value: unknown) => ({
      ...overview,
      balance: { ...overview.balance, current: value },
    });
    expect(valid(current(-5_000))).toBe(true);
    expect(valid(current(12.5))).toBe(false);
    expect(valid(current(BigInt(1_000)))).toBe(false);
    expect(valid(current(Number.MAX_SAFE_INTEGER + 1))).toBe(false);
  });

  it("refuses a negative total, spent or bill amount, and a budget maximum of 0", () => {
    expect(valid({ ...overview, pots: { ...overview.pots, total: -1 } })).toBe(false);
    expect(valid({ ...overview, budgets: { ...overview.budgets, spent: -1 } })).toBe(false);
    expect(valid({ ...overview, bills: { ...overview.bills, dueSoon: -1 } })).toBe(false);
    expect(
      valid({
        ...overview,
        budgets: { ...overview.budgets, items: [{ ...budget(1), maximum: 0 }] },
      }),
    ).toBe(false);
  });

  it("names categories and themes as data-model.md does, not as Prisma's client does", () => {
    const withBudget = (b: object) => ({
      ...overview,
      budgets: { ...overview.budgets, items: [b] },
    });
    expect(valid(withBudget({ ...budget(1), category: "DiningOut" }))).toBe(false);
    expect(valid(withBudget({ ...budget(1), theme: "ArmyGreen" }))).toBe(false);
  });

  it("takes an avatar key, not the seed's image path", () => {
    const avatar = "./assets/images/avatars/savory-bites-bistro.jpg";
    expect(valid({ ...overview, transactions: [{ ...transaction(1), avatar }] })).toBe(false);
  });

  it("refuses fields the spec does not list — the rows the domain returns carry seq, category, recurring", () => {
    expect(valid({ ...overview, pots: { ...overview.pots, items: [{ ...pot(1), seq: 1 }] } })).toBe(
      false,
    );
    expect(valid({ ...overview, transactions: [{ ...transaction(1), recurring: true }] })).toBe(
      false,
    );
    expect(valid({ ...overview, transactions: [{ ...transaction(1), category: "Bills" }] })).toBe(
      false,
    );
  });

  it("holds as many rows as the domain hands over: four pots and budgets, five transactions (T-03)", () => {
    expect(OVERVIEW_LIST_MAX).toEqual({
      pots: OVERVIEW_CARD_ITEMS,
      budgets: OVERVIEW_CARD_ITEMS,
      transactions: OVERVIEW_TRANSACTIONS,
    });
    const rows = <T>(make: (n: number) => T, count: number) =>
      Array.from({ length: count }, (_, i) => make(i + 1));
    const withCounts = (pots: number, transactions: number, budgets: number) => ({
      ...overview,
      pots: { ...overview.pots, items: rows(pot, pots) },
      transactions: rows(transaction, transactions),
      budgets: { ...overview.budgets, items: rows(budget, budgets) },
    });
    expect(valid(withCounts(4, 5, 4))).toBe(true);
    expect(valid(withCounts(5, 5, 4))).toBe(false);
    expect(valid(withCounts(4, 6, 4))).toBe(false);
    expect(valid(withCounts(4, 5, 5))).toBe(false);
  });
});
