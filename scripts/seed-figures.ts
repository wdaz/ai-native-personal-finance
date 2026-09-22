import seedFile from "@/prisma/data.json" with { type: "json" };
import { SEED_YEAR_SHIFT, shiftYears } from "@/src/domain/calendar";
import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";
import { toCents } from "@/src/domain/money";
import { overviewSummary } from "@/src/domain/overview";
import { formatDate } from "@/src/shared/dates";
import { formatMoney, formatSignedMoney } from "@/src/shared/money";

/**
 * The seed's figures, computed by the domain from prisma/data.json — the one source every
 * seed-derived figure in code or tests comes from (build-workflow.md: "never typed").
 * `npm run seed:figures` prints SPEC-overview §4.3, and tests/unit/seed-figures.test.ts
 * holds that table to this output.
 *
 * ADR-0002 lets scripts import only `src/domain` and `src/shared`, so the rows are built
 * here with the domain's own conversions (+2 years, cents) rather than with
 * `src/server/seed.ts`; tests/unit/seed-figures.test.ts checks that names, money, dates,
 * categories (mapped) and recurring flags agree with `src/server/seed.ts`; the rows keep
 * data.json's avatar path, hex theme and display category name, where the database stores
 * the avatar key and the `Theme`/`Category` enums. Budgets and pots get `seq` in file order,
 * as the database assigns it on reset (T-02).
 */
export function seedOverviewInput() {
  return {
    balance: {
      current: toCents(seedFile.balance.current),
      income: toCents(seedFile.balance.income),
      expenses: toCents(seedFile.balance.expenses),
    },
    transactions: seedFile.transactions.map((transaction) => ({
      name: transaction.name,
      avatar: transaction.avatar,
      category: transaction.category,
      date: new Date(shiftYears(transaction.date, SEED_YEAR_SHIFT)),
      amount: toCents(transaction.amount),
      recurring: transaction.recurring,
    })),
    budgets: seedFile.budgets.map((budget, index) => ({
      seq: index + 1,
      category: budget.category,
      maximum: toCents(budget.maximum),
      theme: budget.theme,
    })),
    pots: seedFile.pots.map((pot, index) => ({
      seq: index + 1,
      name: pot.name,
      target: toCents(pot.target),
      total: toCents(pot.total),
      theme: pot.theme,
    })),
  };
}

/** The Overview of the seed on the business day (NFR-D1). */
export const seedFigures = () => overviewSummary(seedOverviewInput(), fixedClock(BUSINESS_TODAY));

const code = (text: string) => `\`${text}\``;
const money = (cents: number) => code(formatMoney(cents));

/** SPEC-overview §4.3, cell by cell: the header, then one row per item. */
export function workedExample(figures = seedFigures()): string[][] {
  const { balance, pots, budgets, bills, transactions } = figures;
  return [
    ["Item", "Value"],
    [
      "Balance / Income / Expenses",
      [balance.current, balance.income, balance.expenses].map(money).join(" / "),
    ],
    ["Pots total", money(pots.total)],
    ["First four pots", pots.items.map((pot) => `${pot.name} ${money(pot.total)}`).join(", ")],
    [
      "Budgets spent / limit",
      `${money(budgets.spent)} / ${money(budgets.limit)} (${budgets.items
        .map((budget) => `${budget.category} ${money(budget.spent)}`)
        .join(", ")})`,
    ],
    [
      "Legend",
      budgets.items.map((budget) => `${budget.category} ${money(budget.maximum)}`).join(", "),
    ],
    [
      "Bills",
      `Paid ${money(bills.paid)}, Upcoming ${money(bills.upcoming)}, Due Soon ${money(bills.dueSoon)}`,
    ],
    [
      "Latest five (timestamp desc, then name)",
      transactions
        .map((t) => `${t.name} ${code(formatSignedMoney(t.amount))} ${formatDate(t.date)}`)
        .join(" · "),
    ],
  ];
}

/** The rows as the Markdown table of SPEC-overview §4.3. */
export function markdownTable(rows: readonly string[][]): string {
  return rows
    .flatMap((cells, index) => [
      `| ${cells.join(" | ")} |`,
      ...(index === 0 ? [`|${cells.map((cell) => "-".repeat(cell.length + 2)).join("|")}|`] : []),
    ])
    .join("\n");
}

if (import.meta.main) {
  console.log(markdownTable(workedExample()));
}
