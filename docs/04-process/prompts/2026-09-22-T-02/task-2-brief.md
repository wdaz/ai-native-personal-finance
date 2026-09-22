### Task 2: Seed rows and variants (pure, no database)

**Files:**
- Create: `prisma/data.json`, `src/server/seed.ts`, `src/server/variants.ts`,
  `tests/unit/seed.test.ts`, `tests/unit/variants.test.ts`
- Modify: `.prettierignore`

**Interfaces:**
- Consumes: `Category`, `Theme` (types) from `src/server/generated/prisma/enums` (Task 1).
- Produces, from `src/server/seed.ts`: `type SeedFile`, `type SeedRows` (below),
  `SEED_YEAR_SHIFT = 2`, `shiftYears(timestamp: string, years: number): string`,
  `toCents(dollars: number): number`, `THEME_BY_HEX: ReadonlyMap<string, Theme>`,
  `themeFromHex(hex: string): Theme`, `CATEGORY_BY_NAME: ReadonlyMap<string, Category>`,
  `categoryFromName(name: string): Category`, `avatarKey(path: string): string`,
  `buildSeedRows(file: SeedFile): SeedRows`, `seedRows(): SeedRows`. From
  `src/server/variants.ts`: `SEED_VARIANTS` (the six names, `as const`), `type SeedVariant`,
  `isSeedVariant(value: unknown): value is SeedVariant`, `FEW_TRANSACTIONS = 3`,
  `applyVariant(rows: SeedRows, variant: SeedVariant): SeedRows`.

- [ ] **Step 1: Write the failing seed tests**

Create `tests/unit/seed.test.ts`:

```ts
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CATEGORY_BY_NAME,
  SEED_YEAR_SHIFT,
  THEME_BY_HEX,
  avatarKey,
  buildSeedRows,
  categoryFromName,
  seedRows,
  shiftYears,
  themeFromHex,
  toCents,
  type SeedFile,
} from "@/src/server/seed";

const repoRoot = join(import.meta.dirname, "..", "..");
const read = (path: string) => readFileSync(join(repoRoot, path), "utf8");
const seedFile = JSON.parse(read("prisma/data.json")) as SeedFile;

/**
 * SPEC-reset-and-test-support §7, unit row: date shift (+2 y incl. leap-day safety), cents
 * conversion, theme mapping, avatar key — and §5, the checksum of the seed copy. Expected
 * figures come from data.json or the documents, never typed (build-workflow.md).
 */
describe("prisma/data.json (SPEC-reset-and-test-support §5)", () => {
  const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
  const original = readFileSync(join(repoRoot, "docs/00-discovery/inputs/data.json"));

  it("is a byte-for-byte copy of docs/00-discovery/inputs/data.json", () => {
    expect(sha256(readFileSync(join(repoRoot, "prisma/data.json")))).toBe(sha256(original));
  });

  it("would report a copy that differs by one byte (violation fixture, DoD v1.1)", () => {
    expect(sha256(Buffer.concat([original, Buffer.from("\n")]))).not.toBe(sha256(original));
  });
});

describe("shiftYears", () => {
  it("adds whole years and keeps the time of day", () => {
    expect(shiftYears("2024-07-02T09:25:51Z", 2)).toBe("2026-07-02T09:25:51Z");
  });

  it("keeps fractional seconds", () => {
    expect(shiftYears("2024-01-31T23:59:59.999Z", 2)).toBe("2026-01-31T23:59:59.999Z");
  });

  it("moves 29 February to 28 February when the target year has no leap day", () => {
    expect(shiftYears("2024-02-29T12:00:00Z", 2)).toBe("2026-02-28T12:00:00Z");
  });

  it("keeps 29 February when the target year has one", () => {
    expect(shiftYears("2024-02-29T12:00:00Z", 4)).toBe("2028-02-29T12:00:00Z");
  });

  it.each(["2024-08-19 14:23:11", "2024-08-19T14:23:11+04:00", "19 Aug 2024", ""])(
    "refuses %j, which is not a UTC ISO-8601 timestamp",
    (timestamp) => {
      expect(() => shiftYears(timestamp, 2)).toThrow("is not a UTC ISO-8601 timestamp");
    },
  );

  it("shifts every seed date by SEED_YEAR_SHIFT years (NFR-D3: 2024 → 2026)", () => {
    const rows = seedRows();
    expect(SEED_YEAR_SHIFT).toBe(2);
    rows.transactions.forEach((row, i) => {
      const source = seedFile.transactions[i]?.date ?? "";
      expect(Number(row.date.slice(0, 4))).toBe(Number(source.slice(0, 4)) + 2);
      expect(row.date.slice(4)).toBe(source.slice(4));
    });
  });
});

describe("toCents", () => {
  it.each([
    [12.34, 1234],
    [-42.3, -4230],
    [0.07, 7],
    [-0.1, -10],
    [0, 0],
    [999_999_999.99, 99_999_999_999],
  ])("converts %d dollars to %d cents", (dollars, cents) => {
    expect(toCents(dollars)).toBe(cents);
  });

  it.each([1.005, 0.001, Number.NaN, Number.POSITIVE_INFINITY])(
    "refuses %d, which is not a whole number of cents",
    (dollars) => {
      expect(() => toCents(dollars)).toThrow("is not a whole number of cents");
    },
  );

  it("converts every amount in prisma/data.json without loss", () => {
    const amounts = [
      ...Object.values(seedFile.balance),
      ...seedFile.transactions.map((t) => t.amount),
      ...seedFile.budgets.map((b) => b.maximum),
      ...seedFile.pots.flatMap((p) => [p.target, p.total]),
    ];
    for (const dollars of amounts) {
      expect(toCents(dollars) / 100).toBe(dollars);
    }
  });
});

describe("themeFromHex mirrors docs/02-architecture/design-tokens.md", () => {
  // | `--color-green` | Green | `#277C78` | 39, 124, 120 | positive amounts, paid, theme |
  const documented = new Map<string, string>();
  for (const [, name, hex, use] of read("docs/02-architecture/design-tokens.md").matchAll(
    /^\|\s*`--color-[a-z-]+`\s*\|\s*([^|]+?)\s*\|\s*`(#[0-9A-Fa-f]{6})`\s*\|[^|]*\|([^|]*)\|/gm,
  )) {
    if (name && hex && use && /\btheme\b/.test(use)) documented.set(hex.toUpperCase(), name);
  }
  // The client spells "Navy Grey" as NavyGrey (prisma/schema.prisma maps it back).
  const mismatches = (map: ReadonlyMap<string, string>) =>
    [...documented]
      .filter(([hex, name]) => map.get(hex) !== name.replaceAll(" ", ""))
      .map(([, name]) => name);

  it("finds the 15 theme colours in the document", () => {
    expect(documented.size).toBe(15);
  });

  it("maps each documented hex to its theme, and nothing else", () => {
    expect(mismatches(THEME_BY_HEX)).toEqual([]);
    expect(THEME_BY_HEX.size).toBe(documented.size);
  });

  it("would report a swapped colour (violation fixture, DoD v1.1)", () => {
    expect(mismatches(new Map(THEME_BY_HEX).set("#277C78", "Navy"))).toEqual(["Green"]);
  });

  it("reads the hex case-insensitively and refuses one it does not know", () => {
    expect(themeFromHex("#277c78")).toBe("Green");
    expect(() => themeFromHex("#000000")).toThrow("is not one of the 15 theme colours");
  });
});

describe("categoryFromName mirrors docs/02-architecture/data-model.md", () => {
  // Enums: `Category` = Entertainment, Bills, … General. `Theme` = …
  const line = /`Category` = ([^.]+)\./.exec(read("docs/02-architecture/data-model.md"))?.[1];
  const documented = (line ?? "").split(",").map((name) => name.trim());
  const mismatches = (map: ReadonlyMap<string, string>) =>
    documented.filter((name) => map.get(name) !== name.replaceAll(" ", ""));

  it("finds the 10 categories in the document", () => {
    expect(documented).toHaveLength(10);
  });

  it("maps each documented category, and nothing else", () => {
    expect(mismatches(CATEGORY_BY_NAME)).toEqual([]);
    expect(CATEGORY_BY_NAME.size).toBe(documented.length);
  });

  it("would report a wrong mapping (violation fixture, DoD v1.1)", () => {
    expect(mismatches(new Map(CATEGORY_BY_NAME).set("Dining Out", "General"))).toEqual([
      "Dining Out",
    ]);
  });

  it("refuses a name it does not know, including a near miss", () => {
    expect(() => categoryFromName("Travel")).toThrow("is not one of the 10 categories");
    expect(() => categoryFromName("dining out")).toThrow("is not one of the 10 categories");
    expect(() => categoryFromName("constructor")).toThrow("is not one of the 10 categories");
  });
});

describe("avatarKey (SPEC-overview §4.5)", () => {
  it("keeps the basename without the extension", () => {
    expect(avatarKey("./assets/images/avatars/some-vendor.jpg")).toBe("some-vendor");
  });

  it.each(["./assets/images/avatars/some-vendor.png", "some-vendor", ""])("refuses %j", (path) => {
    expect(() => avatarKey(path)).toThrow("is not a path to a .jpg file");
  });

  it("gives every seed transaction a key that names a file in public/avatars", () => {
    for (const { avatar } of seedRows().transactions) {
      expect(existsSync(join(repoRoot, "public/avatars", `${avatar}.jpg`)), avatar).toBe(true);
    }
  });
});

describe("buildSeedRows", () => {
  const rows = buildSeedRows(seedFile);

  it("keeps every record of data.json, in file order", () => {
    expect(rows.transactions.map((t) => t.name)).toEqual(seedFile.transactions.map((t) => t.name));
    expect(rows.budgets.map((b) => b.category)).toEqual(
      seedFile.budgets.map((b) => categoryFromName(b.category)),
    );
    expect(rows.pots.map((p) => p.name)).toEqual(seedFile.pots.map((p) => p.name));
  });

  it("carries recurring through unchanged", () => {
    expect(rows.transactions.map((t) => t.recurring)).toEqual(
      seedFile.transactions.map((t) => t.recurring),
    );
  });

  it("is what seedRows() returns for prisma/data.json", () => {
    expect(seedRows()).toEqual(rows);
  });
});
```

(With question 3 answered "1 March" or "refuse", the 29 February test changes to expect
`"2026-03-01T12:00:00Z"` or a throw; with question 2 answered "keep 32-bit", the
`999_999_999.99` row goes.)

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/unit/seed.test.ts`
Expected: FAIL — `Failed to resolve import "@/src/server/seed"` (and `prisma/data.json` does not
exist yet).

- [ ] **Step 3: Copy the seed and keep Prettier off it**

Run: `cp docs/00-discovery/inputs/data.json prisma/data.json && shasum -a 256 prisma/data.json`
Expected: `26bcc91c89d646806849bb4a9c6f37f84df33ca22fc05eb842583f8fed69edb2` (E2).

Append to `.prettierignore`:

```gitignore

# A byte-for-byte copy of docs/00-discovery/inputs/data.json (checksum test in
# tests/unit/seed.test.ts); formatting it would break the copy.
/prisma/data.json
```

- [ ] **Step 4: Write `src/server/seed.ts`**

```ts
import seedFile from "@/prisma/data.json" with { type: "json" };
import type { Category, Theme } from "./generated/prisma/enums";

/**
 * The seed (SPEC-reset-and-test-support §2.1): prisma/data.json, a byte-for-byte copy of
 * docs/00-discovery/inputs/data.json (tests/unit/seed.test.ts), turned into rows — dates +2
 * years, dollars to cents, theme hex to the `Theme` enum, avatar path to its key. Pure: no
 * database and no clock. ADR-0005 keeps `new Date()` out of src/server, and nothing here
 * needs one — dates stay ISO-8601 text, which Prisma accepts as is.
 */

/** The shape of data.json, as the Frontend Mentor challenge ships it. */
export type SeedFile = {
  balance: { current: number; income: number; expenses: number };
  transactions: {
    avatar: string;
    name: string;
    category: string;
    date: string;
    amount: number;
    recurring: boolean;
  }[];
  budgets: { category: string; maximum: number; theme: string }[];
  pots: { name: string; target: number; total: number; theme: string }[];
};

/** Rows as they are inserted: money in integer cents, dates as UTC ISO-8601 text. */
export type SeedRows = {
  balance: { current: number; income: number; expenses: number };
  transactions: {
    name: string;
    avatar: string;
    category: Category;
    date: string;
    amount: number;
    recurring: boolean;
  }[];
  budgets: { category: Category; maximum: number; theme: Theme }[];
  pots: { name: string; target: number; total: number; theme: Theme }[];
};

/** NFR-D3: "all dates shifted +2 years (2024 → 2026) at seed time". */
export const SEED_YEAR_SHIFT = 2;

const UTC_TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})(T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)$/;

const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

/**
 * Adds whole calendar years to a UTC timestamp written as text. 29 February lands on
 * 28 February when the target year has no leap day (SPEC-reset-and-test-support §2.1).
 */
export function shiftYears(timestamp: string, years: number): string {
  const [, year, month, day, time] = UTC_TIMESTAMP.exec(timestamp) ?? [];
  if (!year || !month || !day || !time) {
    throw new Error(`Seed date "${timestamp}" is not a UTC ISO-8601 timestamp`);
  }
  const shifted = Number(year) + years;
  const shiftedDay = month === "02" && day === "29" && !isLeapYear(shifted) ? "28" : day;
  return `${String(shifted).padStart(4, "0")}-${month}-${shiftedDay}${time}`;
}

/**
 * Dollars as data.json writes them to integer cents (ADR-0005, NFR-D2). A value finer than
 * a cent is refused rather than rounded away.
 */
export function toCents(dollars: number): number {
  const cents = Math.round(dollars * 100);
  if (!Number.isFinite(dollars) || Math.abs(cents - dollars * 100) > 1e-6) {
    throw new Error(`Seed amount ${dollars} is not a whole number of cents`);
  }
  return cents;
}

/**
 * docs/02-architecture/design-tokens.md, the 15 theme colours: "data.json stores them as
 * hex, the seed maps hex → enum name". tests/unit/seed.test.ts holds this table to the
 * document. The client spells a two-word theme without its space (`NavyGrey`); the
 * database stores the documented name (`@map` in prisma/schema.prisma).
 */
export const THEME_BY_HEX: ReadonlyMap<string, Theme> = new Map([
  ["#277C78", "Green"],
  ["#F2CDAC", "Yellow"],
  ["#82C9D7", "Cyan"],
  ["#626070", "Navy"],
  ["#C94736", "Red"],
  ["#826CB0", "Purple"],
  ["#597C7C", "Turquoise"],
  ["#93674F", "Brown"],
  ["#934F6F", "Magenta"],
  ["#3F82B2", "Blue"],
  ["#97A0AC", "NavyGrey"],
  ["#7F9161", "ArmyGreen"],
  ["#CAB361", "Gold"],
  ["#BE6C49", "Orange"],
  ["#AF81BA", "Pink"],
]);

export function themeFromHex(hex: string): Theme {
  const theme = THEME_BY_HEX.get(hex.toUpperCase());
  if (!theme) {
    throw new Error(`Seed theme ${hex} is not one of the 15 theme colours of design-tokens.md`);
  }
  return theme;
}

/**
 * docs/02-architecture/data-model.md, `Category`: data.json and the database write the
 * documented name ("Dining Out"), the client an identifier without the space.
 */
export const CATEGORY_BY_NAME: ReadonlyMap<string, Category> = new Map([
  ["Entertainment", "Entertainment"],
  ["Bills", "Bills"],
  ["Groceries", "Groceries"],
  ["Dining Out", "DiningOut"],
  ["Transportation", "Transportation"],
  ["Personal Care", "PersonalCare"],
  ["Education", "Education"],
  ["Lifestyle", "Lifestyle"],
  ["Shopping", "Shopping"],
  ["General", "General"],
]);

export function categoryFromName(name: string): Category {
  const category = CATEGORY_BY_NAME.get(name);
  if (!category) {
    throw new Error(`Seed category "${name}" is not one of the 10 categories of data-model.md`);
  }
  return category;
}

/**
 * SPEC-overview §4.5: an avatar is stored as its basename key (`emma-richardson`); the UI
 * resolves it to /avatars/<key>.jpg.
 */
export function avatarKey(path: string): string {
  const key = /(?:^|\/)([a-z0-9-]+)\.jpg$/.exec(path)?.[1];
  if (!key) {
    throw new Error(`Seed avatar "${path}" is not a path to a .jpg file`);
  }
  return key;
}

export function buildSeedRows(file: SeedFile): SeedRows {
  return {
    balance: {
      current: toCents(file.balance.current),
      income: toCents(file.balance.income),
      expenses: toCents(file.balance.expenses),
    },
    transactions: file.transactions.map((transaction) => ({
      name: transaction.name,
      avatar: avatarKey(transaction.avatar),
      category: categoryFromName(transaction.category),
      date: shiftYears(transaction.date, SEED_YEAR_SHIFT),
      amount: toCents(transaction.amount),
      recurring: transaction.recurring,
    })),
    budgets: file.budgets.map((budget) => ({
      category: categoryFromName(budget.category),
      maximum: toCents(budget.maximum),
      theme: themeFromHex(budget.theme),
    })),
    pots: file.pots.map((pot) => ({
      name: pot.name,
      target: toCents(pot.target),
      total: toCents(pot.total),
      theme: themeFromHex(pot.theme),
    })),
  };
}

/** The rows of prisma/data.json. */
export function seedRows(): SeedRows {
  return buildSeedRows(seedFile);
}
```

The maps are `Map`s, not object literals, so a name such as `constructor` finds nothing
instead of `Object.prototype`'s function (the "near miss" test).

- [ ] **Step 5: Run the seed tests**

Run: `npx vitest run tests/unit/seed.test.ts`
Expected: 38 passed. Mutation check (E12): delete `&& !isLeapYear(shifted)`'s whole ternary
(set `const shiftedDay = day;`) — the 29 February test fails; swap the first two entries of
`THEME_BY_HEX` — three tests fail; restore both and rerun: 38 passed.

- [ ] **Step 6: Write the failing variant tests**

Create `tests/unit/variants.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { seedRows } from "@/src/server/seed";
import {
  FEW_TRANSACTIONS,
  SEED_VARIANTS,
  applyVariant,
  isSeedVariant,
} from "@/src/server/variants";

/** SPEC-reset-and-test-support §7, unit row: "variant functions" (§2.7). */
describe("seed variants", () => {
  const seed = seedRows();

  it("seed leaves the rows as they are", () => {
    expect(applyVariant(seed, "seed")).toEqual(seed);
  });

  it("empty-pots removes the pots and keeps the balance", () => {
    expect(applyVariant(seed, "empty-pots")).toEqual({ ...seed, pots: [] });
  });

  it("empty-budgets removes the budgets only", () => {
    expect(applyVariant(seed, "empty-budgets")).toEqual({ ...seed, budgets: [] });
  });

  it("few-transactions keeps the latest three transactions and nothing else changes", () => {
    const newestFirst = [...seed.transactions].sort((a, b) => (a.date < b.date ? 1 : -1));
    const rows = applyVariant(seed, "few-transactions");
    expect(FEW_TRANSACTIONS).toBe(3);
    expect(rows.transactions).toHaveLength(3);
    expect(new Set(rows.transactions)).toEqual(new Set(newestFirst.slice(0, 3)));
    expect({ ...rows, transactions: [] }).toEqual({ ...seed, transactions: [] });
  });

  it("no-recurring clears recurring on every transaction and changes nothing else", () => {
    const rows = applyVariant(seed, "no-recurring");
    expect(rows.transactions.some((t) => t.recurring)).toBe(false);
    expect(rows.transactions).toEqual(seed.transactions.map((t) => ({ ...t, recurring: false })));
    expect(seed.transactions.some((t) => t.recurring)).toBe(true);
  });

  it("empty-all removes pots, budgets and transactions and keeps the balance", () => {
    expect(applyVariant(seed, "empty-all")).toEqual({
      balance: seed.balance,
      transactions: [],
      budgets: [],
      pots: [],
    });
  });

  it.each(SEED_VARIANTS)("%s leaves its input untouched", (variant) => {
    const input = seedRows();
    applyVariant(input, variant);
    expect(input).toEqual(seedRows());
  });

  it("accepts exactly the six variant names", () => {
    expect(SEED_VARIANTS).toEqual([
      "seed",
      "empty-pots",
      "empty-budgets",
      "few-transactions",
      "no-recurring",
      "empty-all",
    ]);
    for (const value of ["Seed", "empty_pots", "", " seed", undefined, null, 1, {}]) {
      expect(isSeedVariant(value), String(value)).toBe(false);
    }
  });
});
```

Run: `npx vitest run tests/unit/variants.test.ts`
Expected: FAIL — `Failed to resolve import "@/src/server/variants"`.

- [ ] **Step 7: Write `src/server/variants.ts`**

```ts
import type { SeedRows } from "./seed";

/**
 * SPEC-reset-and-test-support §2.7: the seed variants `POST /api/test/seed` accepts. Each
 * is a pure function of the seed rows, applied before they are inserted, so a variant is
 * one transaction with its reset.
 */
export const SEED_VARIANTS = [
  "seed",
  "empty-pots",
  "empty-budgets",
  "few-transactions",
  "no-recurring",
  "empty-all",
] as const;

export type SeedVariant = (typeof SEED_VARIANTS)[number];

export function isSeedVariant(value: unknown): value is SeedVariant {
  return typeof value === "string" && (SEED_VARIANTS as readonly string[]).includes(value);
}

/** "few-transactions (keep the latest 3)". */
export const FEW_TRANSACTIONS = 3;

// Dates are UTC ISO-8601 text of one fixed shape, so their code-unit order is time order.
const newestFirst = (a: { date: string }, b: { date: string }) =>
  a.date < b.date ? 1 : a.date > b.date ? -1 : 0;

const latest = (transactions: SeedRows["transactions"], count: number) => {
  const kept = new Set([...transactions].sort(newestFirst).slice(0, count));
  return transactions.filter((transaction) => kept.has(transaction));
};

export function applyVariant(rows: SeedRows, variant: SeedVariant): SeedRows {
  switch (variant) {
    case "seed":
      return rows;
    case "empty-pots":
      // "delete pots, balance unchanged"
      return { ...rows, pots: [] };
    case "empty-budgets":
      return { ...rows, budgets: [] };
    case "few-transactions":
      return { ...rows, transactions: latest(rows.transactions, FEW_TRANSACTIONS) };
    case "no-recurring":
      return {
        ...rows,
        transactions: rows.transactions.map((transaction) => ({
          ...transaction,
          recurring: false,
        })),
      };
    case "empty-all":
      // SPEC-reset-and-test-support §2.7 (v1.1): no pots, budgets or transactions; the
      // balance stays.
      return { ...rows, pots: [], budgets: [], transactions: [] };
  }
}
```

Run: `npx vitest run tests/unit/variants.test.ts`
Expected: 13 passed. Mutation check: make `newestFirst` return the oldest first (swap `1` and
`-1`) — one test fails; restore.

- [ ] **Step 8: Run every gate**

Run: `npm run lint && npm run format:check && npm run typecheck && npm test`
Expected: all exit 0; Vitest 209/209 (158 + 38 + 13).

- [ ] **Step 9: Commit**

```bash
git add prisma/data.json .prettierignore src/server/seed.ts src/server/variants.ts \
  tests/unit/seed.test.ts tests/unit/variants.test.ts
GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit -m "feat(seed): seed rows from prisma/data.json and the test variants (T-02)"
```

---

