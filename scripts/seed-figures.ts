import seedFile from "@/prisma/data.json" with { type: "json" };
import { SEED_YEAR_SHIFT, shiftYears } from "@/src/domain/calendar";
import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";
import { toCents } from "@/src/domain/money";
import { overviewSummary } from "@/src/domain/overview";
import {
  filterTransactions,
  paginate,
  sortTransactions,
  transactionsPage,
} from "@/src/domain/transactions";
import { CATEGORIES } from "@/src/shared/enums";
import {
  TRANSACTION_SORTS,
  type TransactionSort,
  type TransactionsQuery,
} from "@/src/shared/transactions-query";
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

// ---------------------------------------------------------------------------------------
// SPEC-transactions 4.2–4.7 (hand-off H11 (3)): the list's figures, computed by the domain.

/**
 * The 49 seed transactions as the list reads them: display categories (data.json's own
 * spelling) and a stand-in `id`, the file index zero-padded. The database assigns real ids;
 * the seed has no two rows tied on every key before the id (4.4), so the stand-in never
 * decides an order.
 */
export function seedTransactions() {
  return seedOverviewInput().transactions.map((transaction, index) => ({
    ...transaction,
    id: String(index).padStart(2, "0"),
  }));
}

type SeedTransaction = ReturnType<typeof seedTransactions>[number];

const view = (query: Partial<TransactionsQuery>) =>
  transactionsPage(seedTransactions(), {
    q: undefined,
    category: undefined,
    sort: "latest",
    page: 1,
    ...query,
  });

/** "Savory Bites Bistro, 19 Aug 2026, -$55.50" — 4.3's cell. */
export const transactionCell = (t: SeedTransaction) =>
  `${t.name}, ${formatDate(t.date)}, ${formatSignedMoney(t.amount)}`;

/** The menu's labels (US-11 AC1); they move into `COPY` with the page (T-19, H11 (1)). */
const SORT_LABEL: Record<TransactionSort, string> = {
  latest: "Latest",
  oldest: "Oldest",
  "a-to-z": "A to Z",
  "z-to-a": "Z to A",
  highest: "Highest",
  lowest: "Lowest",
};

/** SPEC-transactions 4.3, cell by cell: the header, then each sort's first and last row. */
export function sortExtremes(): string[][] {
  const rows = seedTransactions();
  return [
    ["Sort", "First", "Last"],
    ...TRANSACTION_SORTS.map((sort) => {
      const sorted = sortTransactions(rows, sort);
      return [SORT_LABEL[sort], transactionCell(sorted[0]!), transactionCell(sorted.at(-1)!)];
    }),
  ];
}

/** SPEC-transactions 4.2 and 4.4–4.7: what the tests of the list read instead of typing. */
export function transactionFigures() {
  const rows = seedTransactions();
  const all = paginate(sortTransactions(rows, "latest"), 1);
  const count = (query: Partial<TransactionsQuery>) => view(query).total;
  return {
    total: all.total,
    pageCount: all.pageCount,
    lastPageSize: view({ page: all.pageCount }).items.length,
    distinctNames: new Set(rows.map((t) => t.name)).size,
    income: rows.filter((t) => t.amount > 0),
    spending: rows.filter((t) => t.amount < 0),
    recurring: rows.filter((t) => t.recurring).length,
    byCategory: Object.fromEntries(
      CATEGORIES.map((category) => [
        category,
        filterTransactions(rows, { q: undefined, category }),
      ]),
    ),
    /** 4.2: the default view, page 1 and the last page. */
    defaultPage: all.items,
    lastPage: view({ page: all.pageCount }).items,
    /** 4.5: the search and filter examples. */
    search: {
      a: count({ q: "a" }),
      co: view({ q: "co" }).items,
      emma: count({ q: "EMMA" }),
      bill: count({ q: "bill" }),
      xyz: count({ q: "xyz" }),
      space: count({ q: " " }),
      aDiningOut: count({ q: "a", category: "Dining Out" }),
      coEntertainment: count({ q: "co", category: "Entertainment" }),
    },
    /** 4.6: the Budgets links. */
    diningOut: view({ category: "Dining Out" }).items,
    entertainment: view({ category: "Entertainment" }).items,
    /** 4.7: the longest name and the widest amount. */
    longestName: rows.reduce((a, b) => (b.name.length > a.name.length ? b : a)).name,
    widestAmount: rows.reduce((a, b) =>
      formatSignedMoney(b.amount).length > formatSignedMoney(a.amount).length ? b : a,
    ),
    view,
  };
}

if (import.meta.main) {
  console.log(markdownTable(workedExample()));
}
