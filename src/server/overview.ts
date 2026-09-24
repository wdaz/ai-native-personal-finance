import { overviewSummary, type OverviewSummary } from "@/src/domain/overview";
import type { Clock } from "@/src/domain/clock";
import { CATEGORIES, THEMES, type Category, type Theme } from "@/src/shared/enums";
import type { OverviewDto } from "@/src/shared/schemas";
import type { Db } from "./db";
import { Category as PrismaCategoryEnum, Theme as PrismaThemeEnum } from "./generated/prisma/enums";

type PrismaCategory = (typeof PrismaCategoryEnum)[keyof typeof PrismaCategoryEnum];
type PrismaTheme = (typeof PrismaThemeEnum)[keyof typeof PrismaThemeEnum];

/**
 * data-model.md spells these with a space; Prisma's client identifier drops it
 * (`prisma/schema.prisma`'s `@map`). Built, not hand-typed (T-09 plan D2 — a hand-typed
 * reverse table could swap two entries without any test noticing): one entry per name in
 * `src/shared/enums.ts`, which `tests/unit/shared/enums.test.ts` already holds to
 * data-model.md, checked here against the *live* generated Prisma enum, so a name this
 * project documents but `prisma/schema.prisma` does not (or the reverse) throws at import
 * time rather than passing silently. Keys are plain `string`, the same loose-key convention
 * `seed.ts`'s own `CATEGORY_BY_NAME`/`THEME_BY_HEX` already use — `categoryLabel`/`themeLabel`
 * below are the precisely-typed accessors production code calls.
 */
function despacedCategory(label: string): PrismaCategory {
  const key = label.replaceAll(" ", "");
  if (!(key in PrismaCategoryEnum)) {
    throw new Error(`"${label}" (src/shared/enums.ts) has no matching Prisma Category "${key}"`);
  }
  return key as PrismaCategory;
}

function despacedTheme(label: string): PrismaTheme {
  const key = label.replaceAll(" ", "");
  if (!(key in PrismaThemeEnum)) {
    throw new Error(`"${label}" (src/shared/enums.ts) has no matching Prisma Theme "${key}"`);
  }
  return key as PrismaTheme;
}

export const CATEGORY_LABEL: ReadonlyMap<string, Category> = new Map(
  CATEGORIES.map((label) => [despacedCategory(label), label]),
);

export const THEME_LABEL: ReadonlyMap<string, Theme> = new Map(
  THEMES.map((label) => [despacedTheme(label), label]),
);

export function categoryLabel(category: PrismaCategory): Category {
  const label = CATEGORY_LABEL.get(category);
  if (!label) throw new Error(`Unmapped category "${category}" — CATEGORY_LABEL needs an entry`);
  return label;
}

export function themeLabel(theme: PrismaTheme): Theme {
  const label = THEME_LABEL.get(theme);
  if (!label) throw new Error(`Unmapped theme "${theme}" — THEME_LABEL needs an entry`);
  return label;
}

type OverviewRow = { id: string };
type PotRow = OverviewRow & { name: string; total: number; theme: Theme };
type TransactionRow = OverviewRow & { name: string; avatar: string; amount: number; date: Date };
// `OverviewSummary<T, B, P>` itself types `budgets.items` as `(B & { spent: number })[]` —
// `spent` is computed by `overviewSummary`, so it is not part of the input row `B` describes.
type BudgetRow = OverviewRow & { category: Category; maximum: number; theme: Theme };

/**
 * SPEC-overview §6: `OverviewDtoSchema` is strict. Pure (T-09 plan D7 — T-08's D2 precedent):
 * every field is named explicitly, so `seq`/`category`/`recurring` on the caller's rows never
 * reach the DTO no matter what extra fields `overviewSummary`'s generic result happens to carry.
 */
export function toOverviewDto<T extends TransactionRow, B extends BudgetRow, P extends PotRow>(
  summary: OverviewSummary<T, B, P>,
): OverviewDto {
  return {
    balance: summary.balance,
    pots: {
      total: summary.pots.total,
      items: summary.pots.items.map((pot) => ({
        id: pot.id,
        name: pot.name,
        total: pot.total,
        theme: pot.theme,
      })),
    },
    transactions: summary.transactions.map((transaction) => ({
      id: transaction.id,
      name: transaction.name,
      avatar: transaction.avatar,
      amount: transaction.amount,
      date: transaction.date.toISOString(),
    })),
    budgets: {
      spent: summary.budgets.spent,
      limit: summary.budgets.limit,
      items: summary.budgets.items.map((budget) => ({
        id: budget.id,
        category: budget.category,
        maximum: budget.maximum,
        spent: budget.spent,
        theme: budget.theme,
      })),
    },
    bills: summary.bills,
  };
}

/**
 * SPEC-overview §2.1, §6: the one place an Overview DTO is assembled from the database.
 * `Balance` is a singleton seeded by `resetToSeed`; its absence means the database was never
 * seeded, a configuration fault like `latestReset`'s (T-08 D1). No `seeded` filter (T-09 plan
 * D4). Both budgets' and transactions' `category` go through the same `categoryLabel` before
 * `overviewSummary` runs, so `budgetSpent`'s `===` compare never mismatches on spelling (D3).
 */
export async function getOverview(db: Db, clock: Clock): Promise<OverviewDto> {
  const [balance, transactions, budgets, pots] = await Promise.all([
    db.balance.findFirst(),
    db.transaction.findMany(),
    db.budget.findMany(),
    db.pot.findMany(),
  ]);
  if (!balance) {
    throw new Error("No Balance row exists: the database was never seeded (README, db:reset)");
  }
  const summary = overviewSummary(
    {
      balance: {
        current: Number(balance.current),
        income: Number(balance.income),
        expenses: Number(balance.expenses),
      },
      transactions: transactions.map((row) => ({
        id: row.id,
        name: row.name,
        avatar: row.avatar,
        category: categoryLabel(row.category),
        date: row.date,
        amount: Number(row.amount),
        recurring: row.recurring,
      })),
      budgets: budgets.map((row) => ({
        id: row.id,
        seq: row.seq,
        category: categoryLabel(row.category),
        maximum: Number(row.maximum),
        theme: themeLabel(row.theme),
      })),
      pots: pots.map((row) => ({
        id: row.id,
        seq: row.seq,
        name: row.name,
        total: Number(row.total),
        theme: themeLabel(row.theme),
      })),
    },
    clock,
  );
  return toOverviewDto(summary);
}
