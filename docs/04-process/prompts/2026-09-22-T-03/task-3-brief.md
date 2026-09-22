### Task 3: The Overview's arithmetic

**Files:**
- Create: `src/domain/types.ts`, `src/domain/transactions.ts`, `src/domain/budgets.ts`,
  `src/domain/bills.ts`, `src/domain/overview.ts`, `tests/fixtures/domain.ts`,
  `tests/unit/domain/transactions.test.ts`, `tests/unit/domain/budgets.test.ts`,
  `tests/unit/domain/bills.test.ts`, `tests/unit/domain/overview.test.ts`
- Modify: `src/domain/README.md`

**Interfaces:**
- Consumes: `Clock`, `BUSINESS_TODAY`, `fixedClock` (Task 1); `isInMonthOf`, `isInMonthUpTo`,
  `sumCents` (Task 2).
- Produces:
  - `BalanceInput = { current: number; income: number; expenses: number }`;
    `TransactionInput = { name: string; category: string; date: Date; amount: number; recurring:
    boolean }`; `BudgetInput = { seq: number; category: string; maximum: number }`;
    `PotInput = { seq: number; total: number }`.
  - `compareLatest(a, b): number`; `latestTransactions<T extends TransactionInput>(transactions:
    readonly T[], count: number): T[]`.
  - `budgetSpent(category: string, transactions: readonly TransactionInput[], clock: Clock):
    number`.
  - `BillStatus = "paid" | "dueSoon" | "upcoming"`; `RecurringBill<T> = { name; day; amount;
    status; latest: T }`; `DUE_SOON_DAYS = 5`; `recurringBills<T>(transactions: readonly T[],
    clock: Clock): RecurringBill<T>[]`; `BillsSummary = { paid; upcoming; dueSoon }`;
    `billsSummary(bills: readonly RecurringBill[]): BillsSummary`.
  - `OVERVIEW_CARD_ITEMS = 4`; `OVERVIEW_TRANSACTIONS = 5`; `OverviewInput<T, B, P>`;
    `OverviewSummary<T, B, P> = { balance; pots: { total; items: P[] }; transactions: T[];
    budgets: { spent; limit; items: (B & { spent: number })[] }; bills: BillsSummary }`;
    `overviewSummary<T, B, P>(input: OverviewInput<T, B, P>, clock: Clock): OverviewSummary<T, B,
    P>`.

- [ ] **Step 1: Write the factory** — `tests/fixtures/domain.ts`:

```ts
import type { TransactionInput } from "@/src/domain/types";

/**
 * A hand-built transaction for the domain's unit tests: an August 2026 bill of $10.00
 * unless the test says otherwise. Values here are invented for one rule at a time — the
 * seed's own figures come from scripts/seed-figures.ts, never from here.
 */
export function transaction({
  date = "2026-08-10T12:00:00Z",
  ...fields
}: Partial<Omit<TransactionInput, "date">> & { date?: string } = {}): TransactionInput {
  return {
    name: "Vendor",
    category: "Bills",
    amount: -1_000,
    recurring: false,
    ...fields,
    date: new Date(date),
  };
}
```

- [ ] **Step 2: Write the tests** — `tests/unit/domain/transactions.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { latestTransactions } from "@/src/domain/transactions";
import { transaction } from "@/tests/fixtures/domain";

const names = (rows: { name: string }[]) => rows.map((row) => row.name);

describe("latestTransactions (US-06 AC1, ordered as US-11 Latest)", () => {
  it("puts the newest first by full timestamp, not by day", () => {
    const rows = [
      transaction({ name: "Morning", date: "2026-08-19T08:00:00Z" }),
      transaction({ name: "Yesterday", date: "2026-08-18T23:59:59Z" }),
      transaction({ name: "Evening", date: "2026-08-19T20:00:00Z" }),
    ];
    expect(names(latestTransactions(rows, 5))).toEqual(["Evening", "Morning", "Yesterday"]);
  });

  it("breaks a tie of equal timestamps by name, A to Z (the seed has none)", () => {
    const at = "2026-08-19T12:00:00Z";
    const rows = [
      transaction({ name: "Zed", date: at }),
      transaction({ name: "Amy", date: at }),
      transaction({ name: "Moe", date: at }),
    ];
    expect(names(latestTransactions(rows, 5))).toEqual(["Amy", "Moe", "Zed"]);
  });

  it("orders names as a reader would, ignoring case", () => {
    const at = "2026-08-19T12:00:00Z";
    const rows = [
      transaction({ name: "Banana", date: at }),
      transaction({ name: "apple", date: at }),
    ];
    expect(names(latestTransactions(rows, 5))).toEqual(["apple", "Banana"]);
  });

  it("returns at most `count`, and the ones there are when fewer (US-06 AC3)", () => {
    const rows = [1, 2, 3, 4, 5, 6, 7].map((day) =>
      transaction({ name: `Day ${day}`, date: `2026-08-0${day}T12:00:00Z` }),
    );
    expect(names(latestTransactions(rows, 5))).toEqual([
      "Day 7",
      "Day 6",
      "Day 5",
      "Day 4",
      "Day 3",
    ]);
    expect(latestTransactions(rows.slice(0, 2), 5)).toHaveLength(2);
    expect(latestTransactions([], 5)).toEqual([]);
  });

  it("returns the caller's own rows and leaves the input in its order", () => {
    const rows = [
      { ...transaction({ name: "Old", date: "2026-08-01T12:00:00Z" }), id: "a" },
      { ...transaction({ name: "New", date: "2026-08-02T12:00:00Z" }), id: "b" },
    ];
    expect(latestTransactions(rows, 5).map((row) => row.id)).toEqual(["b", "a"]);
    expect(names(rows)).toEqual(["Old", "New"]);
  });

  it.each([-1, 2.5, Number.NaN])("refuses a count of %d", (count) => {
    expect(() => latestTransactions([], count)).toThrow("is not a whole number of transactions");
  });
});
```

`tests/unit/domain/budgets.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { budgetSpent } from "@/src/domain/budgets";
import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";
import { transaction } from "@/tests/fixtures/domain";

const clock = fixedClock(BUSINESS_TODAY);

describe("budgetSpent (data-model.md: Σ |amount| of negative transactions in the current month)", () => {
  it("adds the category's money out this month", () => {
    const rows = [
      transaction({ category: "Bills", amount: -1_500 }),
      transaction({ category: "Bills", amount: -250, date: "2026-08-01T00:00:00Z" }),
    ];
    expect(budgetSpent("Bills", rows, clock)).toBe(1_750);
  });

  it("does not let money in reduce what was spent (the seed has no such case)", () => {
    const rows = [
      transaction({ category: "Bills", amount: -1_500 }),
      transaction({ category: "Bills", amount: 4_000 }),
    ];
    expect(budgetSpent("Bills", rows, clock)).toBe(1_500);
  });

  it("leaves out other categories, other months and the same month of another year", () => {
    const rows = [
      transaction({ category: "Dining Out", amount: -900 }),
      transaction({ category: "Bills", amount: -800, date: "2026-07-31T23:59:59.999Z" }),
      transaction({ category: "Bills", amount: -700, date: "2026-09-01T00:00:00Z" }),
      transaction({ category: "Bills", amount: -600, date: "2025-08-10T12:00:00Z" }),
    ];
    expect(budgetSpent("Bills", rows, clock)).toBe(0);
  });

  it("counts the whole current month, including days after today", () => {
    const rows = [transaction({ category: "Bills", amount: -300, date: "2026-08-31T12:00:00Z" })];
    expect(budgetSpent("Bills", rows, clock)).toBe(300);
  });

  it("is 0 when the category has no transactions", () => {
    expect(budgetSpent("Bills", [], clock)).toBe(0);
  });
});
```

`tests/unit/domain/bills.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DUE_SOON_DAYS, billsSummary, recurringBills } from "@/src/domain/bills";
import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";
import { transaction } from "@/tests/fixtures/domain";

const clock = fixedClock(BUSINESS_TODAY);
const bill = (name: string, date: string, amount = -1_000) =>
  transaction({ name, date, amount, recurring: true });

describe("recurringBills (data-model.md; US-27 AC1, AC2)", () => {
  it("makes one bill per vendor from the recurring transactions only, in order of appearance", () => {
    const rows = [
      bill("Water", "2026-07-30T12:00:00Z"),
      transaction({ name: "Cafe", date: "2026-08-02T12:00:00Z" }),
      bill("Power", "2026-08-02T12:00:00Z"),
      bill("Water", "2026-06-30T12:00:00Z"),
    ];
    expect(recurringBills(rows, clock).map((b) => b.name)).toEqual(["Water", "Power"]);
  });

  it("takes the day and the amount of the vendor's most recent transaction, as a positive amount", () => {
    const [power] = recurringBills(
      [
        bill("Power", "2026-07-02T12:00:00Z", -9_000),
        bill("Power", "2026-08-03T12:00:00Z", -10_000),
      ],
      clock,
    );
    expect(power).toMatchObject({ day: 3, amount: 10_000 });
    expect(power?.latest.date.toISOString()).toBe("2026-08-03T12:00:00.000Z");
  });

  it("is paid when the vendor has a transaction this month on or before today, whatever the hour", () => {
    const [bill19] = recurringBills([bill("Late", "2026-08-19T23:59:59Z")], clock);
    expect(bill19?.status).toBe("paid");
  });

  it("is not paid by a transaction dated after today", () => {
    const [future] = recurringBills([bill("Future", "2026-08-20T09:00:00Z")], clock);
    expect(future?.status).toBe("dueSoon");
  });

  it(`is due soon up to today + ${DUE_SOON_DAYS} (day 24) and upcoming from day 25`, () => {
    const bills = recurringBills(
      [bill("On 24th", "2026-07-24T12:00:00Z"), bill("On 25th", "2026-07-25T12:00:00Z")],
      clock,
    );
    expect(bills.map((b) => b.status)).toEqual(["dueSoon", "upcoming"]);
  });

  it("is due soon when an earlier day of this month went unpaid — the rule as written (the seed has no such case)", () => {
    const [missed] = recurringBills([bill("Missed", "2026-07-10T12:00:00Z")], clock);
    expect(missed?.status).toBe("dueSoon");
  });

  it("returns no bills when nothing is recurring (US-08 AC3)", () => {
    expect(recurringBills([transaction()], clock)).toEqual([]);
  });
});

describe("billsSummary (SPEC-overview §2.6, US-28 AC1)", () => {
  it("totals paid and not-paid bills; Due Soon is part of Upcoming", () => {
    const bills = recurringBills(
      [
        bill("Paid", "2026-08-05T12:00:00Z", -12_000),
        bill("Soon", "2026-07-22T12:00:00Z", -777),
        bill("Later", "2026-07-28T12:00:00Z", -3_000),
      ],
      clock,
    );
    expect(billsSummary(bills)).toEqual({ paid: 12_000, upcoming: 3_777, dueSoon: 777 });
  });

  it("is zero everywhere without bills (US-08 AC3)", () => {
    expect(billsSummary([])).toEqual({ paid: 0, upcoming: 0, dueSoon: 0 });
  });
});
```

`tests/unit/domain/overview.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";
import { overviewSummary } from "@/src/domain/overview";
import { transaction } from "@/tests/fixtures/domain";

// The seed's own figures are asserted against SPEC-overview §4.3 in
// tests/unit/seed-figures.test.ts; the cases here are built by hand, one rule at a time.
const clock = fixedClock(BUSINESS_TODAY);
const balance = { current: 100_000, income: 50_000, expenses: 20_000 };
const pot = (seq: number, total: number) => ({ id: `pot-${seq}`, seq, total });
const budget = (seq: number, category: string, maximum: number) => ({
  id: `budget-${seq}`,
  seq,
  category,
  maximum,
});

describe("overviewSummary (SPEC-overview §4.1, §6; US-04…US-08)", () => {
  it("is zeros and empty lists for an empty dataset (§2.7; US-05 AC2, US-06 AC3, US-07 AC2, US-08 AC3)", () => {
    expect(overviewSummary({ balance, transactions: [], budgets: [], pots: [] }, clock)).toEqual({
      balance,
      pots: { total: 0, items: [] },
      transactions: [],
      budgets: { spent: 0, limit: 0, items: [] },
      bills: { paid: 0, upcoming: 0, dueSoon: 0 },
    });
  });

  it("passes the stored balance through unchanged (US-04 AC3)", () => {
    const summary = overviewSummary({ balance, transactions: [], budgets: [], pots: [] }, clock);
    expect(summary.balance).toEqual(balance);
    expect(summary.balance).not.toBe(balance);
  });

  it("totals all pots and lists the first four in creation order (US-05 AC1)", () => {
    const pots = [pot(5, 500), pot(2, 200), pot(4, 400), pot(1, 100), pot(3, 300)];
    const summary = overviewSummary({ balance, transactions: [], budgets: [], pots }, clock);
    expect(summary.pots.total).toBe(1_500);
    expect(summary.pots.items.map((p) => p.id)).toEqual(["pot-1", "pot-2", "pot-3", "pot-4"]);
  });

  it("totals all budgets and lists the first four with what each spent (US-07 AC1)", () => {
    const budgets = [
      budget(2, "Bills", 60_000),
      budget(1, "Dining Out", 5_000),
      budget(5, "Education", 1_000),
      budget(3, "General", 2_000),
      budget(4, "Shopping", 3_000),
    ];
    const transactions = [
      transaction({ category: "Bills", amount: -12_500 }),
      transaction({ category: "Education", amount: -500 }),
    ];
    const summary = overviewSummary({ balance, transactions, budgets, pots: [] }, clock);
    expect(summary.budgets.limit).toBe(71_000);
    expect(summary.budgets.spent).toBe(13_000);
    expect(summary.budgets.items.map((b) => [b.id, b.spent])).toEqual([
      ["budget-1", 0],
      ["budget-2", 12_500],
      ["budget-3", 0],
      ["budget-4", 0],
    ]);
  });

  it("lists the five latest transactions (US-06 AC1)", () => {
    const transactions = [1, 2, 3, 4, 5, 6].map((day) =>
      transaction({ name: `Day ${day}`, date: `2026-08-0${day}T12:00:00Z` }),
    );
    const summary = overviewSummary({ balance, transactions, budgets: [], pots: [] }, clock);
    expect(summary.transactions.map((t) => t.name)).toEqual([
      "Day 6",
      "Day 5",
      "Day 4",
      "Day 3",
      "Day 2",
    ]);
  });

  it("totals the recurring bills (US-08 AC1)", () => {
    const transactions = [
      transaction({
        name: "Power",
        amount: -12_000,
        recurring: true,
        date: "2026-08-05T12:00:00Z",
      }),
      transaction({ name: "Cloud", amount: -777, recurring: true, date: "2026-07-22T12:00:00Z" }),
    ];
    const summary = overviewSummary({ balance, transactions, budgets: [], pots: [] }, clock);
    expect(summary.bills).toEqual({ paid: 12_000, upcoming: 777, dueSoon: 777 });
  });
});
```

Run: `npx vitest run tests/unit/domain`
Expected (*prediction*): the four new files fail to load; clock, calendar and money pass.

- [ ] **Step 3: Write the modules**

`src/domain/types.ts`:

```ts
/**
 * What the domain needs to know about each entity of docs/02-architecture/data-model.md.
 * Money is integer cents; dates are `Date`s. The domain cannot import the Prisma client
 * (ADR-0002), so these are structural: a repository row with more fields (`id`, `theme`,
 * `avatar`) is accepted as it is, and the functions that return rows return the caller's
 * own type.
 */

export type BalanceInput = { current: number; income: number; expenses: number };

export type TransactionInput = {
  name: string;
  category: string;
  date: Date;
  /** Signed: negative is money out. */
  amount: number;
  recurring: boolean;
};

/** `seq` is the creation order the database assigns (data-model.md v1.1). */
export type BudgetInput = { seq: number; category: string; maximum: number };

/** `seq` is the creation order the database assigns (data-model.md v1.1). */
export type PotInput = { seq: number; total: number };
```

`src/domain/transactions.ts`:

```ts
import type { TransactionInput } from "./types";

const names = new Intl.Collator("en");

/**
 * US-11 "Latest": by full timestamp, newest first, then by name A to Z (SPEC-overview §4.3,
 * "timestamp desc, then name").
 */
export const compareLatest = (
  a: Pick<TransactionInput, "date" | "name">,
  b: Pick<TransactionInput, "date" | "name">,
): number => b.date.getTime() - a.date.getTime() || names.compare(a.name, b.name);

/** US-06 AC1: the `count` most recent transactions, ordered as US-11 Latest. */
export function latestTransactions<T extends TransactionInput>(
  transactions: readonly T[],
  count: number,
): T[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new Error(`Count ${count} is not a whole number of transactions`);
  }
  return [...transactions].sort(compareLatest).slice(0, count);
}
```

`src/domain/budgets.ts`:

```ts
import { isInMonthOf } from "./calendar";
import type { Clock } from "./clock";
import { sumCents } from "./money";
import type { TransactionInput } from "./types";

/**
 * data-model.md: `budgetSpent(category, transactions, clock)` = Σ |amount| of the category's
 * negative transactions in the current month (UTC). Income in the category does not reduce
 * what was spent.
 */
export function budgetSpent(
  category: string,
  transactions: readonly TransactionInput[],
  clock: Clock,
): number {
  const today = clock.today();
  return sumCents(
    transactions
      .filter((t) => t.category === category && t.amount < 0 && isInMonthOf(t.date, today))
      .map((t) => -t.amount),
  );
}
```

`src/domain/bills.ts`:

```ts
import { isInMonthUpTo } from "./calendar";
import type { Clock } from "./clock";
import { sumCents } from "./money";
import { compareLatest } from "./transactions";
import type { TransactionInput } from "./types";

export type BillStatus = "paid" | "dueSoon" | "upcoming";

/** One vendor's bill: `latest` is its most recent recurring transaction. */
export type RecurringBill<T extends TransactionInput = TransactionInput> = {
  name: string;
  /** Day of month of the most recent recurring transaction ("Monthly - 2nd"). */
  day: number;
  /** Absolute amount of the most recent recurring transaction, in cents (US-30). */
  amount: number;
  status: BillStatus;
  latest: T;
};

/** US-27 AC2: "Due Soon if not paid and its day-of-month ≤ today + 5". */
export const DUE_SOON_DAYS = 5;

/**
 * data-model.md: one bill per `name` among the recurring transactions, in order of first
 * appearance. US-27 AC2, compared as calendar dates in UTC: **paid** if the vendor has a
 * recurring transaction in the current month on or before today; otherwise **dueSoon** if
 * its day is at most today + 5 — a day earlier in the month that was not paid counts too,
 * as the rule is written; otherwise **upcoming**.
 */
export function recurringBills<T extends TransactionInput>(
  transactions: readonly T[],
  clock: Clock,
): RecurringBill<T>[] {
  const today = clock.today();
  const byName = new Map<string, T[]>();
  for (const transaction of transactions) {
    if (!transaction.recurring) continue;
    byName.set(transaction.name, [...(byName.get(transaction.name) ?? []), transaction]);
  }
  return [...byName].map(([name, list]) => {
    const latest = list.reduce((a, b) => (compareLatest(a, b) <= 0 ? a : b));
    const day = latest.date.getUTCDate();
    const paid = list.some((t) => isInMonthUpTo(t.date, today));
    const status: BillStatus = paid
      ? "paid"
      : day <= today.getUTCDate() + DUE_SOON_DAYS
        ? "dueSoon"
        : "upcoming";
    return { name, day, amount: Math.abs(latest.amount), status, latest };
  });
}

export type BillsSummary = { paid: number; upcoming: number; dueSoon: number };

/**
 * SPEC-overview §2.6, US-28 AC1: totals in cents. Upcoming is every bill not paid, and Due
 * Soon is the part of it due within five days — the two overlap (seed: 4 paid + 4 upcoming
 * = 8 vendors, 2 of the upcoming due soon).
 */
export function billsSummary(bills: readonly RecurringBill[]): BillsSummary {
  const total = (keep: (bill: RecurringBill) => boolean) =>
    sumCents(bills.filter(keep).map((bill) => bill.amount));
  return {
    paid: total((bill) => bill.status === "paid"),
    upcoming: total((bill) => bill.status !== "paid"),
    dueSoon: total((bill) => bill.status === "dueSoon"),
  };
}
```

`src/domain/overview.ts`:

```ts
import { billsSummary, recurringBills, type BillsSummary } from "./bills";
import { budgetSpent } from "./budgets";
import type { Clock } from "./clock";
import { sumCents } from "./money";
import { latestTransactions } from "./transactions";
import type { BalanceInput, BudgetInput, PotInput, TransactionInput } from "./types";

/** SPEC-overview §2.3, §2.5: the pots grid and the budgets legend show the first four. */
export const OVERVIEW_CARD_ITEMS = 4;

/** SPEC-overview §2.4, US-06 AC1: the five most recent transactions. */
export const OVERVIEW_TRANSACTIONS = 5;

export type OverviewInput<T, B, P> = {
  balance: BalanceInput;
  transactions: readonly T[];
  budgets: readonly B[];
  pots: readonly P[];
};

/**
 * Everything the Overview shows, in cents, in the shape of SPEC-overview §6's `OverviewDto`.
 * Rows are the caller's own (ids, themes and avatars pass through); dates stay `Date`s.
 */
export type OverviewSummary<T, B, P> = {
  balance: BalanceInput;
  pots: { total: number; items: P[] };
  transactions: T[];
  budgets: { spent: number; limit: number; items: (B & { spent: number })[] };
  bills: BillsSummary;
};

const byCreation = (a: { seq: number }, b: { seq: number }) => a.seq - b.seq;

/**
 * SPEC-overview §4.1: the page performs no arithmetic — every value comes from here.
 * Totals cover all pots and all budgets; the lists hold the first four in creation order
 * (`seq`) and the five latest transactions (US-04…US-08). The balance is stored, not derived
 * (US-04 AC3), and passes through unchanged.
 */
export function overviewSummary<
  T extends TransactionInput,
  B extends BudgetInput,
  P extends PotInput,
>(input: OverviewInput<T, B, P>, clock: Clock): OverviewSummary<T, B, P> {
  const pots = [...input.pots].sort(byCreation);
  const budgets = [...input.budgets].sort(byCreation).map((budget) => ({
    ...budget,
    spent: budgetSpent(budget.category, input.transactions, clock),
  }));
  return {
    balance: { ...input.balance },
    pots: {
      total: sumCents(pots.map((pot) => pot.total)),
      items: pots.slice(0, OVERVIEW_CARD_ITEMS),
    },
    transactions: latestTransactions(input.transactions, OVERVIEW_TRANSACTIONS),
    budgets: {
      spent: sumCents(budgets.map((budget) => budget.spent)),
      limit: sumCents(budgets.map((budget) => budget.maximum)),
      items: budgets.slice(0, OVERVIEW_CARD_ITEMS),
    },
    bills: billsSummary(recurringBills(input.transactions, clock)),
  };
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/unit/domain`
Expected (*measured per file*): transactions 8, budgets 5, bills 9, overview 6, clock 11, calendar
10, money 9 — all pass.

- [ ] **Step 5: Replace `src/domain/README.md`** (already in Prettier's form):

```md
# src/domain

Pure functions: money, budgets, pots, bills, sorting, paging, clock (ADR-0002).

- **Imports allowed:** `src/shared` only.
- **Imports forbidden:** `app/`, `src/server`, `src/webmcp`, `src/ui` — enforced by
  `eslint-plugin-boundaries`.
- **No wall clock** — take a `Clock` explicitly (ADR-0005). `new Date()` without arguments,
  `Date()` and `Date.now()` are lint errors; `new Date(<value>)` builds a fixed date.
- Coverage ≥ 90 % statements from T-13 (ADR-0003).

| Module            | Holds (T-03)                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------- |
| `clock.ts`        | `Clock`, `BUSINESS_TODAY`, `fixedClock`                                                   |
| `calendar.ts`     | `shiftYears`, `SEED_YEAR_SHIFT`; the current month in UTC                                 |
| `money.ts`        | `toCents`, `sumCents` — integer cents                                                     |
| `types.ts`        | The rows the functions read: money in cents, dates as `Date`, extra fields passed through |
| `transactions.ts` | `compareLatest` (US-11 Latest), `latestTransactions`                                      |
| `budgets.ts`      | `budgetSpent`                                                                             |
| `bills.ts`        | `recurringBills`, `billsSummary`                                                          |
| `overview.ts`     | `overviewSummary` — every figure SPEC-overview shows                                      |
```

- [ ] **Step 6: All unit gates**

Run: `npx prettier --write src/domain tests/unit/domain tests/fixtures/domain.ts && npm run lint && npm run format:check && npm run typecheck && npm test`
Expected: every command exits 0 (run `format:check` after `--write`: E8 found one file that
needed a second pass); Vitest **291/291**.

- [ ] **Step 7: Commit**

```bash
git add src/domain tests/fixtures/domain.ts tests/unit/domain
GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit -m "feat(domain): budgetSpent, latestTransactions, recurringBills and overviewSummary (T-03)"
```

---

