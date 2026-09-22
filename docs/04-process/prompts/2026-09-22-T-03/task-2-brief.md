### Task 2: Calendar and money helpers in the domain

**Files:**
- Create: `src/domain/calendar.ts`, `src/domain/money.ts`, `tests/unit/domain/calendar.test.ts`,
  `tests/unit/domain/money.test.ts`
- Modify: `src/server/seed.ts` (imports; the moved block removed), `tests/unit/seed.test.ts`
  (imports)

**Interfaces:**
- Consumes: `BUSINESS_TODAY`, `fixedClock` (Task 1).
- Produces: `SEED_YEAR_SHIFT: 2`; `shiftYears(timestamp: string, years: number): string`;
  `isInMonthOf(date: Date, today: Date): boolean`; `isInMonthUpTo(date: Date, today: Date):
  boolean`; `toCents(dollars: number): number`; `sumCents(amounts: readonly number[]): number` —
  throws `Amount <x> is not a whole number of cents` / `Total <x> is beyond the exact range of a
  number`.

- [ ] **Step 1: Write the tests** — `tests/unit/domain/calendar.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isInMonthOf, isInMonthUpTo } from "@/src/domain/calendar";
import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";

// shiftYears and SEED_YEAR_SHIFT keep their tests in tests/unit/seed.test.ts, beside the
// seed they shift.
const today = fixedClock(BUSINESS_TODAY).today();

describe("the current month, in UTC (data-model.md, SPEC-overview §4.2)", () => {
  it.each([
    ["2026-08-01T00:00:00Z", true],
    ["2026-08-31T23:59:59.999Z", true],
    ["2026-07-31T23:59:59.999Z", false],
    ["2026-09-01T00:00:00Z", false],
    ["2025-08-15T12:00:00Z", false],
    // 23:30 at UTC−02:00 is already 1 September in UTC.
    ["2026-08-31T23:30:00-02:00", false],
  ])("%s is in the month of 19 Aug 2026: %s", (date, expected) => {
    expect(isInMonthOf(new Date(date), today)).toBe(expected);
  });
});

describe("on or before today, this month (US-27 AC2: calendar dates, time of day ignored)", () => {
  it.each([
    ["2026-08-01T00:00:00Z", true],
    ["2026-08-19T23:59:59.999Z", true],
    ["2026-08-20T00:00:00Z", false],
    ["2026-07-19T12:00:00Z", false],
  ])("%s counts: %s", (date, expected) => {
    expect(isInMonthUpTo(new Date(date), today)).toBe(expected);
  });
});
```

`tests/unit/domain/money.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { sumCents } from "@/src/domain/money";

// toCents keeps its tests in tests/unit/seed.test.ts, beside the seed amounts it converts.
describe("sumCents (ADR-0005: money is integer cents)", () => {
  it("adds whole cents, signs included", () => {
    expect(sumCents([12_345, -2_000, 7])).toBe(10_352);
  });

  it("is 0 for no amounts", () => {
    expect(sumCents([])).toBe(0);
  });

  it("adds the largest amounts NFR-S3 allows without losing a cent", () => {
    expect(sumCents([99_999_999_999, 99_999_999_999, 1])).toBe(199_999_999_999);
  });

  it.each([1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53])(
    "refuses %d, which is not a whole number of cents",
    (amount) => {
      expect(() => sumCents([100, amount])).toThrow("is not a whole number of cents");
    },
  );

  it("refuses a database BigInt that was not converted to a number (T-09)", () => {
    expect(() => sumCents([100, 250n as unknown as number])).toThrow(
      "is not a whole number of cents",
    );
  });

  it("refuses a total beyond the exact range of a number", () => {
    expect(() => sumCents([Number.MAX_SAFE_INTEGER, 1])).toThrow("beyond the exact range");
  });
});
```

Run: `npx vitest run tests/unit/domain/calendar.test.ts tests/unit/domain/money.test.ts`
Expected (*prediction*): both files fail to load — the modules do not exist.

- [ ] **Step 2: Write `src/domain/calendar.ts`** (`SEED_YEAR_SHIFT`, `isLeapYear` and `shiftYears`
  are moved verbatim from `src/server/seed.ts`):

```ts
/**
 * Calendar arithmetic in UTC (SPEC-overview §4.2: dates are UTC). Business rules compare
 * calendar dates, not instants: US-27 AC2 says "calendar dates; time of day ignored".
 */

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

/** True when `date` falls in the same UTC calendar month as `today`. */
export const isInMonthOf = (date: Date, today: Date): boolean =>
  date.getUTCFullYear() === today.getUTCFullYear() && date.getUTCMonth() === today.getUTCMonth();

/** True when `date` falls in `today`'s UTC month, on or before `today`'s day (US-27 AC2). */
export const isInMonthUpTo = (date: Date, today: Date): boolean =>
  isInMonthOf(date, today) && date.getUTCDate() <= today.getUTCDate();
```

- [ ] **Step 3: Write `src/domain/money.ts`** (`toCents` moved verbatim):

```ts
/**
 * Money is integer cents (ADR-0005, NFR-D2): every amount in the domain is a whole number
 * of cents in a JavaScript number, exact up to 9 × 10¹⁵ — far above NFR-S3's
 * 99,999,999,999. It becomes text only at the edge (`src/shared/money.ts`).
 */

/**
 * Dollars as data.json writes them to integer cents. A value finer than a cent is refused
 * rather than rounded away.
 */
export function toCents(dollars: number): number {
  const cents = Math.round(dollars * 100);
  if (!Number.isFinite(dollars) || Math.abs(cents - dollars * 100) > 1e-6) {
    throw new Error(`Seed amount ${dollars} is not a whole number of cents`);
  }
  return cents;
}

/**
 * The sum of whole-cent amounts. Anything else is refused, so a dollar amount or a database
 * `BigInt` that was not converted at the repository edge fails here instead of summing to a
 * wrong figure.
 */
export function sumCents(amounts: readonly number[]): number {
  let total = 0;
  for (const amount of amounts) {
    if (!Number.isSafeInteger(amount)) {
      throw new Error(`Amount ${String(amount)} is not a whole number of cents`);
    }
    total += amount;
  }
  if (!Number.isSafeInteger(total)) {
    throw new Error(`Total ${total} is beyond the exact range of a number`);
  }
  return total;
}
```

- [ ] **Step 4: Point the seed at the moved helpers**

In `src/server/seed.ts`, the imports become:

```ts
import seedFile from "@/prisma/data.json" with { type: "json" };
import { SEED_YEAR_SHIFT, shiftYears } from "@/src/domain/calendar";
import { toCents } from "@/src/domain/money";
import type { Category, Theme } from "./generated/prisma/enums";
```

and the block from `/** NFR-D3: "all dates shifted +2 years (2024 → 2026) at seed time". */`
through the end of `toCents` (the constant, `UTC_TIMESTAMP`, `isLeapYear`, `shiftYears`, `toCents`
and their comments) is deleted. `SEED_YEAR_SHIFT`, `shiftYears` and `toCents` are no longer exported
from `src/server/seed.ts`; nothing else imports them from there (`grep -rn` over `src`, `tests`,
`prisma`, `app` found only `tests/unit/seed.test.ts`).

In `tests/unit/seed.test.ts`, the import block becomes:

```ts
import { describe, expect, it } from "vitest";
import { SEED_YEAR_SHIFT, shiftYears } from "@/src/domain/calendar";
import { toCents } from "@/src/domain/money";
import {
  CATEGORY_BY_NAME,
  THEME_BY_HEX,
  avatarKey,
  buildSeedRows,
  categoryFromName,
  seedRows,
  themeFromHex,
  type SeedFile,
} from "@/src/server/seed";
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/unit/seed.test.ts tests/unit/domain`
Expected (*measured per file*): seed **38/38**, clock 11, calendar 10, money 9 — all pass.

- [ ] **Step 6: All unit gates**

Run: `npm run lint && npm run format:check && npm run typecheck && npm test`
Expected: every command exits 0; Vitest **263/263**.

- [ ] **Step 7: Commit**

```bash
git add src/domain/calendar.ts src/domain/money.ts src/server/seed.ts tests/unit/seed.test.ts tests/unit/domain/calendar.test.ts tests/unit/domain/money.test.ts
GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit -m "refactor(domain): move toCents and shiftYears into src/domain; add sumCents and the UTC month (T-03)"
```

---

