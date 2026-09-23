### Task 4: The Overview DTO and meta

Owner answer 1.

**Files:**
- Modify: `src/shared/schemas.ts`
- Create: `tests/unit/shared/overview-dto.test.ts`, `tests/unit/shared/meta-dto.test.ts`

**Interfaces:**
- Consumes: `CATEGORIES`, `THEMES` (Task 1); `WEBMCP_MODES` from `src/shared/env.ts` (T-01);
  `OVERVIEW_CARD_ITEMS`, `OVERVIEW_TRANSACTIONS` from `src/domain/overview.ts` (T-03, tests only).
- Produces, in `src/shared/schemas.ts`: `CategorySchema`, `ThemeSchema`, `WebMcpModeSchema`;
  `AVATAR_KEY: RegExp`; `OVERVIEW_LIST_MAX = { pots: 4, budgets: 4, transactions: 5 }`;
  `OverviewDtoSchema` / `OverviewDto`; `MetaDtoSchema` / `MetaDto`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/shared/overview-dto.test.ts`:

```ts
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
```

`tests/unit/shared/meta-dto.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { WEBMCP_MODES } from "@/src/shared/env";
import { MetaDtoSchema } from "@/src/shared/schemas";

const meta = {
  lastResetAt: "2026-09-12T03:00:00.000Z",
  resetIntervalDays: 10,
  webmcp: { configuredMode: "polyfill", originTrial: false },
};
const valid = (dto: unknown) => MetaDtoSchema.safeParse(dto).success;

describe("MetaDto (SPEC-app-shell §5)", () => {
  it("accepts the spec's shape", () => {
    expect(MetaDtoSchema.parse(meta)).toEqual(meta);
  });

  it.each(WEBMCP_MODES)("accepts the configured mode %s", (configuredMode) => {
    expect(valid({ ...meta, webmcp: { ...meta.webmcp, configuredMode } })).toBe(true);
  });

  it('refuses "unavailable", which is an indicator state, not a configured mode', () => {
    expect(valid({ ...meta, webmcp: { ...meta.webmcp, configuredMode: "unavailable" } })).toBe(
      false,
    );
  });

  it("requires lastResetAt — always present, the first seed writes a ResetLog row — in UTC", () => {
    expect(valid({ ...meta, lastResetAt: undefined })).toBe(false);
    expect(valid({ ...meta, lastResetAt: "2026-09-12T07:00:00+04:00" })).toBe(false);
  });

  it("requires a whole, positive reset interval", () => {
    for (const resetIntervalDays of [0, -10, 2.5]) {
      expect(valid({ ...meta, resetIntervalDays })).toBe(false);
    }
  });

  it("refuses fields the spec does not list", () => {
    expect(valid({ ...meta, reason: "scheduled" })).toBe(false);
    expect(valid({ ...meta, webmcp: { ...meta.webmcp, tools: 2 } })).toBe(false);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/unit/shared/overview-dto.test.ts tests/unit/shared/meta-dto.test.ts`
Expected (*measured*, E15): FAIL — **17 failed (17)**, "Cannot read properties of undefined
(reading 'parse')" (the file exists; the exports do not).

- [ ] **Step 3: Extend `src/shared/schemas.ts`**

(a) Replace the two import lines at the top with:

```ts
import { z } from "zod";
import { COPY } from "./copy";
import { CATEGORIES, THEMES } from "./enums";
import { WEBMCP_MODES } from "./env";
```

(b) Insert, between the header comment and the `// Auth` separator:

```ts
// ---------------------------------------------------------------------------------------
// Enums

export const CategorySchema = z.enum(CATEGORIES);
export const ThemeSchema = z.enum(THEMES);
export const WebMcpModeSchema = z.enum(WEBMCP_MODES);
```

(c) Append at the end of the file:

```ts

// ---------------------------------------------------------------------------------------
// Overview — SPEC-overview §6 ("cents; dates ISO-8601 UTC")

/** Money: integer cents, within `Number.MAX_SAFE_INTEGER` (`BigInt` is converted by then). */
const Cents = z.int();
const NonNegativeCents = z.int().nonnegative();
/** "ISO-8601 UTC": `Date#toISOString()`; an offset or a time without a zone is refused. */
const UtcDateTime = z.iso.datetime();
/** SPEC-reset-and-test-support §2.1: "avatar path → basename key". */
export const AVATAR_KEY = /^[a-z0-9-]+$/;

/** SPEC-overview §2.3, §2.5: the first four pots and budgets; §2.4: the latest five transactions. */
export const OVERVIEW_LIST_MAX = { pots: 4, budgets: 4, transactions: 5 } as const;

export const OverviewDtoSchema = z.strictObject({
  balance: z.strictObject({ current: Cents, income: Cents, expenses: Cents }),
  pots: z.strictObject({
    total: NonNegativeCents,
    items: z
      .array(
        z.strictObject({
          id: z.uuid(),
          name: z.string().min(1).max(30),
          total: NonNegativeCents,
          theme: ThemeSchema,
        }),
      )
      .max(OVERVIEW_LIST_MAX.pots),
  }),
  transactions: z
    .array(
      z.strictObject({
        id: z.uuid(),
        name: z.string().min(1).max(60),
        avatar: z.string().regex(AVATAR_KEY),
        amount: Cents,
        date: UtcDateTime,
      }),
    )
    .max(OVERVIEW_LIST_MAX.transactions),
  budgets: z.strictObject({
    spent: NonNegativeCents,
    limit: NonNegativeCents,
    items: z
      .array(
        z.strictObject({
          id: z.uuid(),
          category: CategorySchema,
          maximum: z.int().positive(),
          spent: NonNegativeCents,
          theme: ThemeSchema,
        }),
      )
      .max(OVERVIEW_LIST_MAX.budgets),
  }),
  bills: z.strictObject({
    paid: NonNegativeCents,
    upcoming: NonNegativeCents,
    dueSoon: NonNegativeCents,
  }),
});
export type OverviewDto = z.infer<typeof OverviewDtoSchema>;

// ---------------------------------------------------------------------------------------
// Meta — SPEC-app-shell §5

export const MetaDtoSchema = z.strictObject({
  lastResetAt: UtcDateTime,
  resetIntervalDays: z.int().positive(),
  webmcp: z.strictObject({ configuredMode: WebMcpModeSchema, originTrial: z.boolean() }),
});
export type MetaDto = z.infer<typeof MetaDtoSchema>;
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `npx vitest run tests/unit/shared/overview-dto.test.ts tests/unit/shared/meta-dto.test.ts`
Expected (*measured*): **17 passed (17)** (9 + 8).

- [ ] **Step 5: All unit gates**

Run: `npx prettier --write src/shared tests/unit/shared && npm run lint && npm run format:check && npm run typecheck && npm test`
Expected (*measured*, E15): every command exits 0; Vitest **412/412**.

- [ ] **Step 6: Commit**

```bash
git add src/shared/schemas.ts tests/unit/shared/overview-dto.test.ts tests/unit/shared/meta-dto.test.ts
GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit -m "feat(shared): OverviewDtoSchema and MetaDtoSchema — strict, cents, UTC dates (T-04)"
```

---

