import { budgetsSummary, type BudgetsSummary } from "@/src/domain/budgets";
import type { Clock } from "@/src/domain/clock";
import type { Category, Theme } from "@/src/shared/enums";
import type {
  BudgetCreateInput,
  BudgetEditInput,
  BudgetItemDto,
  BudgetsDto,
  ErrorIssue,
} from "@/src/shared/schemas";
import type { Db } from "./db";
import { Category as PrismaCategoryEnum, Theme as PrismaThemeEnum } from "./generated/prisma/enums";
import { CATEGORY_LABEL, categoryLabel, THEME_LABEL, themeLabel } from "./overview";
import type { WriteOutcome, WriteTx } from "./write";

type PrismaCategory = (typeof PrismaCategoryEnum)[keyof typeof PrismaCategoryEnum];
type PrismaTheme = (typeof PrismaThemeEnum)[keyof typeof PrismaThemeEnum];

/**
 * The display name → the database's enum value: the inverse of `CATEGORY_LABEL` and
 * `THEME_LABEL`, which `labelMap` builds and checks as bijections, so the inverse is one too
 * (T-23 plan F3; no hand-typed table, T-09 plan D2).
 */
const invert = <K extends string, V extends string>(map: ReadonlyMap<K, V>): ReadonlyMap<V, K> =>
  new Map([...map].map(([key, value]) => [value, key]));

const PRISMA_CATEGORY = invert(CATEGORY_LABEL as ReadonlyMap<PrismaCategory, Category>);
const PRISMA_THEME = invert(THEME_LABEL as ReadonlyMap<PrismaTheme, Theme>);

export function prismaCategory(category: Category): PrismaCategory {
  const value = PRISMA_CATEGORY.get(category);
  if (!value) throw new Error(`Unmapped category "${category}"`);
  return value;
}

export function prismaTheme(theme: Theme): PrismaTheme {
  const value = PRISMA_THEME.get(theme);
  if (!value) throw new Error(`Unmapped theme "${theme}"`);
  return value;
}

type TransactionRow = {
  id: string;
  name: string;
  avatar: string;
  category: Category;
  date: Date;
  amount: number;
  recurring: boolean;
};
type BudgetRow = { id: string; seq: number; category: Category; maximum: number; theme: Theme };
type BudgetSummaryItem = BudgetsSummary<TransactionRow, BudgetRow>["items"][number];

/**
 * SPEC-budgets 2.11: `BudgetItemDtoSchema` is strict. Every field is named (the `toOverviewDto`
 * pattern), so `seq` and the latest rows' `category` and `recurring` never reach the DTO.
 */
export function toBudgetItemDto(budget: BudgetSummaryItem): BudgetItemDto {
  return {
    id: budget.id,
    category: budget.category,
    theme: budget.theme,
    maximum: budget.maximum,
    spent: budget.spent,
    remaining: budget.remaining,
    latest: budget.latest.map((transaction) => ({
      id: transaction.id,
      name: transaction.name,
      avatar: transaction.avatar,
      date: transaction.date.toISOString(),
      amount: transaction.amount,
    })),
  };
}

export function toBudgetsDto(summary: BudgetsSummary<TransactionRow, BudgetRow>): BudgetsDto {
  return {
    items: summary.items.map(toBudgetItemDto),
    spent: summary.spent,
    limit: summary.limit,
  };
}

/** Reads what the summary needs, through a client or a write's transaction. */
async function readSummary(db: Db | WriteTx, clock: Clock) {
  const [transactions, budgets] = await Promise.all([
    db.transaction.findMany({
      select: {
        id: true,
        name: true,
        avatar: true,
        category: true,
        date: true,
        amount: true,
        recurring: true,
      },
    }),
    db.budget.findMany({
      select: { id: true, seq: true, category: true, maximum: true, theme: true },
    }),
  ]);
  return budgetsSummary(
    {
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
    },
    clock,
  );
}

/**
 * SPEC-budgets 2.1, 2.11: the one place the budgets are read, for the page (directly) and
 * `GET /api/budgets`. Every transaction and budget is read (the Overview pattern: no `where`,
 * no `seeded` filter); the order is the summary's (`seq`).
 */
export async function getBudgets(db: Db, clock: Clock): Promise<BudgetsDto> {
  return toBudgetsDto(await readSummary(db, clock));
}

/**
 * 2.10: a `category` or `theme` held by **another** budget is `taken` (both are reported when
 * both apply); the budget's own values never count against it (R-18). The unique constraints
 * stay the last line of defence for two requests racing (`guardedWrite` maps them).
 */
async function takenIssues(
  tx: WriteTx,
  input: { category: Category; theme: Theme },
  ownId?: string,
): Promise<ErrorIssue[]> {
  const others = await tx.budget.findMany({
    where: {
      OR: [{ category: prismaCategory(input.category) }, { theme: prismaTheme(input.theme) }],
      ...(ownId === undefined ? {} : { NOT: { id: ownId } }),
    },
    select: { category: true, theme: true },
  });
  const issues: ErrorIssue[] = [];
  if (others.some((b) => b.category === prismaCategory(input.category))) {
    issues.push({ path: ["category"], code: "taken" });
  }
  if (others.some((b) => b.theme === prismaTheme(input.theme))) {
    issues.push({ path: ["theme"], code: "taken" });
  }
  return issues;
}

/**
 * 2.10: the answer's DTO is computed with the same `budgetsSummary` as `GET`, so the budget comes
 * back with its August spent, remaining and latest three (US-15 AC3). It is read on the write's
 * own transaction, just before the commit: the transaction sees its own write, so this is the
 * state the commit leaves; a threshold reset after the commit answers 409 instead (2.9).
 */
async function answer(tx: WriteTx, clock: Clock, id: string, status: 200 | 201) {
  const summary = await readSummary(tx, clock);
  const budget = summary.items.find((item) => item.id === id);
  if (!budget) throw new Error(`Budget ${id} is missing after its own write`);
  return { kind: "ok", status, body: { budget: toBudgetItemDto(budget) } } as const;
}

/** `POST /api/budgets` (2.10): 201 `{ budget }`, listed last (`seq` from the database). */
export function createBudget(clock: Clock) {
  return async (tx: WriteTx, input: BudgetCreateInput | undefined): Promise<WriteOutcome> => {
    const body = input!;
    const issues = await takenIssues(tx, body);
    if (issues.length > 0) return { kind: "validation", issues };
    const created = await tx.budget.create({
      data: {
        category: prismaCategory(body.category),
        maximum: BigInt(body.maximum),
        theme: prismaTheme(body.theme),
      },
      select: { id: true },
    });
    return answer(tx, clock, created.id, 201);
  };
}

/** `PATCH /api/budgets/:id` (2.10): all three fields; 404 for no such budget; `seq` kept. */
export function updateBudget(clock: Clock) {
  return async (
    tx: WriteTx,
    input: BudgetEditInput | undefined,
    id: string | undefined,
  ): Promise<WriteOutcome> => {
    const body = input!;
    const exists = await tx.budget.findUnique({ where: { id: id! }, select: { id: true } });
    if (!exists) return { kind: "not_found" };
    const issues = await takenIssues(tx, body, id);
    if (issues.length > 0) return { kind: "validation", issues };
    // A conditional update (SPEC-write-path 2.8): a delete that commits between the read above
    // and this write leaves no row to touch, which is a 404, not a thrown P2025 (code review, T-23).
    const { count } = await tx.budget.updateMany({
      where: { id: id! },
      data: {
        category: prismaCategory(body.category),
        maximum: BigInt(body.maximum),
        theme: prismaTheme(body.theme),
      },
    });
    if (count === 0) return { kind: "not_found" };
    return answer(tx, clock, id!, 200);
  };
}

/** `DELETE /api/budgets/:id` (2.8, 2.10): 204; 404 for no such budget. Nothing else changes. */
export async function deleteBudget(
  tx: WriteTx,
  _input: unknown,
  id: string | undefined,
): Promise<WriteOutcome> {
  const { count } = await tx.budget.deleteMany({ where: { id: id! } });
  return count === 0 ? { kind: "not_found" } : { kind: "ok", status: 204 };
}
