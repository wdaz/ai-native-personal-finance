import seedFile from "@/prisma/data.json" with { type: "json" };
import { SEED_YEAR_SHIFT, shiftYears } from "@/src/domain/calendar";
import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";
import { toCents } from "@/src/domain/money";
import { overviewSummary } from "@/src/domain/overview";
import { billsList, billsTotals, recurringBills, sortBills } from "@/src/domain/bills";
import { filterTransactions, sortTransactions, transactionsPage } from "@/src/domain/transactions";
import { COPY } from "@/src/shared/copy";
import { CATEGORIES } from "@/src/shared/enums";
import {
  TRANSACTION_SORTS,
  type TransactionSort,
  type TransactionsQuery,
} from "@/src/shared/transactions-query";
import { formatDate, formatDueDay } from "@/src/shared/dates";
import {
  BILL_SORTS,
  BILL_STATUSES,
  type BillSort,
  type RecurringBillsQuery,
} from "@/src/shared/recurring-bills-query";
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

const view = (query: Partial<TransactionsQuery>, rows = seedTransactions()) =>
  transactionsPage(rows, {
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

/** The groups of two or more rows sharing `key`. */
function groups<T>(rows: readonly T[], key: (row: T) => string): T[][] {
  const byKey = new Map<string, T[]>();
  for (const row of rows) byKey.set(key(row), [...(byKey.get(key(row)) ?? []), row]);
  return [...byKey.values()].filter((group) => group.length > 1);
}

type ListRow = Parameters<typeof sortTransactions>[0][number];

/**
 * 4.4: "the final `id` key never decides". For each sort, each neighbouring pair is sorted again
 * with its ids swapped; if the pair's order flips, only the id kept them apart. The API oracle and
 * `seedTransactions` stand in their own ids for the database's, which is sound only while this
 * holds for the rows they use.
 */
export function idNeverDecides(rows: readonly ListRow[]): boolean {
  return TRANSACTION_SORTS.every((sort) => {
    const sorted = sortTransactions(rows, sort);
    return sorted.every((row, index) => {
      const next = sorted[index + 1];
      if (next === undefined) return true;
      const pair = sortTransactions(
        [
          { ...next, id: "a" },
          { ...row, id: "b" },
        ],
        sort,
      );
      return pair[0]!.id === "b";
    });
  });
}

/** SPEC-transactions 4.2 and 4.4–4.7: what the tests of the list read instead of typing. */
export function transactionFigures() {
  const rows = seedTransactions();
  const all = view({}, rows);
  const lastPage = view({ page: all.pageCount }, rows).items;
  const count = (query: Partial<TransactionsQuery>) => view(query, rows).total;
  return {
    total: all.total,
    pageCount: all.pageCount,
    lastPageSize: lastPage.length,
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
    lastPage,
    /** 4.5: the search and filter examples. */
    search: {
      a: count({ q: "a" }),
      co: view({ q: "co" }, rows).items,
      emma: count({ q: "EMMA" }),
      bill: count({ q: "bill" }),
      xyz: count({ q: "xyz" }),
      space: count({ q: " " }),
      aDiningOut: count({ q: "a", category: "Dining Out" }),
      coEntertainment: count({ q: "co", category: "Entertainment" }),
    },
    /** 4.6: the Budgets links. */
    diningOut: view({ category: "Dining Out" }, rows).items,
    entertainment: view({ category: "Entertainment" }, rows).items,
    dates: {
      first: sortTransactions(rows, "oldest")[0]!.date,
      last: sortTransactions(rows, "latest")[0]!.date,
      distinct: new Set(rows.map((t) => t.date.getTime())).size,
    },
    generalPages: view({ category: "General" }, rows).pageCount,
    generalLastPage: view({ category: "General", page: 2 }, rows).items.length,
    aPages: view({ q: "a" }, rows).pageCount,
    aLastPage: view({ q: "a", page: view({ q: "a" }, rows).pageCount }, rows).items.length,
    withoutA: rows.filter((t) => !t.name.toLowerCase().includes("a")).map((t) => t.name),
    /** 4.5: what an untrimmed single space would match (2.5: the needle is trimmed). */
    untrimmedSpace: rows.filter((t) => t.name.includes(" ")).length,
    /** 4.4: the repeated sort keys, as groups of rows. */
    ties: {
      names: groups(rows, (t) => t.name),
      amounts: groups(rows, (t) => String(t.amount)),
      timestamps: groups(rows, (t) => String(t.date.getTime())),
    },
    /** 4.7: the longest name and the widest amount. */
    longestName: rows.reduce((a, b) => (b.name.length > a.name.length ? b : a)).name,
    widestAmount: rows.reduce((a, b) =>
      formatSignedMoney(b.amount).length > formatSignedMoney(a.amount).length ? b : a,
    ),
    view,
  };
}

// ---------------------------------------------------------------------------------------
// SPEC-recurring-bills 4.2–4.5 (hand-off H14 (2)): the bills' figures, computed by the domain.

/** The seed's bills on the business day (NFR-D1), in `recurringBills`' order (first appearance). */
export const seedBills = () =>
  recurringBills(seedOverviewInput().transactions, fixedClock(BUSINESS_TODAY));

type SeedBill = ReturnType<typeof seedBills>[number];

/** "11th": the ordinal of `formatDueDay`, without "Monthly - ". */
const ordinal = (day: number) => formatDueDay(day).replace("Monthly - ", "");

/** 4.2's and the row's words for a status. */
const STATUS_WORDS = { paid: "paid", dueSoon: "due soon", upcoming: "upcoming" } as const;

/** "Spark Electric Solutions (2nd)" in Latest and Oldest' table cell; the amount in Highest's. */
function sortCell(sort: BillSort, bill: SeedBill): string {
  if (sort === "latest") return `${bill.name} (${ordinal(bill.day)})`;
  if (sort === "highest") return `${bill.name} (${formatMoney(bill.amount)})`;
  return bill.name;
}

/** SPEC-recurring-bills 4.3, cell by cell: the header, then each sort's full order. */
export function billSorts(bills = seedBills()): string[][] {
  return [
    ["Sort", "Order"],
    ...BILL_SORTS.map((sort) => [
      COPY.transactionSorts[sort],
      sortBills(bills, sort)
        .map((bill) => sortCell(sort, bill))
        .join(", "),
    ]),
  ];
}

/** "4 ($190.00)": a summary row as US-28 AC1 writes it. */
export const totalText = ({ count, amount }: { count: number; amount: number }) =>
  `${count} (${formatMoney(amount)})`;

/** SPEC-recurring-bills 4.2 and 4.5: what the tests of the bills read instead of typing. */
export function billFigures() {
  const input = seedOverviewInput().transactions;
  const bills = seedBills();
  const view = (query: Partial<RecurringBillsQuery>) =>
    billsList(bills, { q: undefined, sort: "latest", status: undefined, ...query });
  const recurring = input.filter((t) => t.recurring);
  const shortDate = (date: Date) => formatDate(date).replace(/ \d{4}$/, "");
  return {
    transactions: input.length,
    recurring: recurring.length,
    bills,
    totals: billsTotals(bills),
    /** 4.2: "Pixel Playground · 11th · $10.00 · paid (11 Aug)", one per vendor. */
    vendorLines: bills.map(
      (bill) =>
        `${bill.name} · ${ordinal(bill.day)} · ${formatMoney(bill.amount)} · ${STATUS_WORDS[bill.status]} (${recurring
          .filter((t) => t.name === bill.name)
          .map((t) => shortDate(t.date))
          .join(", ")})`,
    ),
    byStatus: Object.fromEntries(
      BILL_STATUSES.map((status) => [status, view({ status })]),
    ) as Record<(typeof BILL_STATUSES)[number], SeedBill[]>,
    /** 4.3: the repeated keys, as groups of names. */
    ties: {
      days: groupNames(bills, (bill) => String(bill.day)),
      amounts: groupNames(bills, (bill) => String(bill.amount)),
      caseInsensitive: groupNames(bills, (bill) => bill.name.toLowerCase()),
    },
    /** 4.3: the collator's A to Z equals the code-unit order of the names. */
    collatorIsCodeUnit:
      sortBills(bills, "a-to-z")
        .map((bill) => bill.name)
        .join("|") ===
      bills
        .map((bill) => bill.name)
        .sort()
        .join("|"),
    lowestIsHighestReversed:
      sortBills(bills, "lowest")
        .map((bill) => bill.name)
        .join("|") ===
      sortBills(bills, "highest")
        .map((bill) => bill.name)
        .reverse()
        .join("|"),
    /** 4.5: the search examples, in Latest order. */
    search: (q: string) => view({ q }),
    withoutA: sortBills(
      bills.filter((bill) => !bill.name.toLowerCase().includes("a")),
      "a-to-z",
    ),
    view,
    /** 4.6: the longest name. */
    longestName: bills.reduce((a, b) => (b.name.length > a.name.length ? b : a)).name,
  };
}

function groupNames(bills: readonly SeedBill[], key: (bill: SeedBill) => string): string[][] {
  return groups(bills, key).map((group) => group.map((bill) => bill.name));
}

if (import.meta.main) {
  console.log(markdownTable(workedExample()));
}
