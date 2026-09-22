### Task 4: The §4.2 formatters

Written for question 3 answered "T-03" and question 4 answered "three letters".

**Files:**
- Create: `src/shared/money.ts`, `src/shared/dates.ts`, `tests/unit/shared/money.test.ts`,
  `tests/unit/shared/dates.test.ts`
- Modify: `src/shared/README.md`

**Interfaces:**
- Consumes: nothing (`src/shared` imports nothing from the rest).
- Produces: `formatMoney(cents: number): string`; `formatSignedMoney(cents: number): string`;
  `formatDate(value: Date | string): string` — throws `Amount <x> is not a whole number of cents`
  / `Date <x> is not a valid ISO-8601 date`.

- [ ] **Step 1: Write the tests** — `tests/unit/shared/money.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatMoney, formatSignedMoney } from "@/src/shared/money";

describe("formatMoney (SPEC-overview §4.2: `$`, thousands separators, two decimals)", () => {
  it.each([
    [123_456, "$1,234.56"],
    [1, "$0.01"],
    [-1, "-$0.01"],
    [5, "$0.05"],
    [100_000_000, "$1,000,000.00"],
    [-4_210, "-$42.10"],
    [-123_456_789, "-$1,234,567.89"],
    [0, "$0.00"],
    [-0, "$0.00"],
    [99_999_999_999, "$999,999,999.99"],
  ])("writes %d cents as %s", (cents, text) => {
    expect(formatMoney(cents)).toBe(text);
  });

  it.each([1.5, Number.NaN, 2 ** 53])(
    "refuses %d, which is not a whole number of cents",
    (cents) => {
      expect(() => formatMoney(cents)).toThrow("is not a whole number of cents");
    },
  );
});

describe("formatSignedMoney (SPEC-overview §2.4: transaction rows)", () => {
  it.each([
    [1_234, "+$12.34"],
    [-1_234, "-$12.34"],
    [1, "+$0.01"],
    [0, "$0.00"],
  ])("writes %d cents as %s", (cents, text) => {
    expect(formatSignedMoney(cents)).toBe(text);
  });
});
```

`tests/unit/shared/dates.test.ts`:

```ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { formatDate } from "@/src/shared/dates";

// SPEC-overview §4.2 writes dates in UTC. Run in a zone where 20:23Z is already the next
// local day (UTC+14), so a formatter that used local time would fail here and not only on
// a machine east of Greenwich.
const zone = process.env.TZ;
beforeAll(() => {
  process.env.TZ = "Pacific/Kiritimati";
});
afterAll(() => {
  // Assigning `undefined` would store the text "undefined".
  if (zone === undefined) delete process.env.TZ;
  else process.env.TZ = zone;
});

describe("formatDate (SPEC-overview §4.2: `d MMM yyyy`, UTC)", () => {
  it("writes 20:23Z on the UTC day, though it is the next day locally", () => {
    expect(new Date("2026-08-19T20:23:11Z").getDate()).toBe(20);
    expect(formatDate("2026-08-19T20:23:11Z")).toBe("19 Aug 2026");
  });

  it("converts an offset to UTC first", () => {
    expect(formatDate("2026-08-19T23:30:00-02:00")).toBe("20 Aug 2026");
  });

  it("accepts a Date as well as ISO text", () => {
    expect(formatDate(new Date(Date.UTC(2026, 6, 2, 9, 25, 51)))).toBe("2 Jul 2026");
  });

  it.each([
    [1, "Jan"],
    [2, "Feb"],
    [3, "Mar"],
    [4, "Apr"],
    [5, "May"],
    [6, "Jun"],
    [7, "Jul"],
    [8, "Aug"],
    [9, "Sep"],
    [10, "Oct"],
    [11, "Nov"],
    [12, "Dec"],
  ])("writes month %d with three letters: %s", (month, name) => {
    const iso = `2026-${String(month).padStart(2, "0")}-01T00:00:00Z`;
    expect(formatDate(iso)).toBe(`1 ${name} 2026`);
  });

  it("writes September with three letters, not Intl en-GB's 'Sept' (owner decision, T-03 plan gate)", () => {
    expect(formatDate("2026-09-30T23:59:59Z")).toBe("30 Sep 2026");
  });

  it("keeps the last moment of December in December and in its year", () => {
    expect(formatDate("2026-12-31T23:59:59.999Z")).toBe("31 Dec 2026");
  });

  it("accepts a date without a time", () => {
    expect(formatDate("2026-08-19")).toBe("19 Aug 2026");
  });

  it.each([
    // JavaScript's own parser reads this as a day in 2001.
    "19 August, maybe",
    // …rolls this into 2 March…
    "2026-02-30T00:00:00Z",
    // …and reads a time without a zone as local time.
    "2026-08-19T20:23:11",
    "2026-08-19T25:00:00Z",
    "",
  ])("refuses %j, which is not an ISO-8601 date with its zone", (text) => {
    expect(() => formatDate(text)).toThrow("is not a valid ISO-8601 date");
  });

  it("refuses an invalid Date", () => {
    expect(() => formatDate(new Date(Number.NaN))).toThrow("is not a valid ISO-8601 date");
  });
});
```

Run: `npx vitest run tests/unit/shared`
Expected (*prediction*): both files fail to load.

- [ ] **Step 2: Write `src/shared/money.ts`**

```ts
/**
 * SPEC-overview §4.2, "All money": `$` + thousands separators + two decimals; negative as
 * `-$55.50`; transaction rows prefix positives with `+`. Money is integer cents everywhere
 * else and becomes text only here, at the edge (Definition of Done). The digits are built
 * from the integer, so no amount NFR-S3 allows loses a cent to floating point, and every
 * engine prints the same text.
 */

const THOUSANDS = /\B(?=(\d{3})+(?!\d))/g;

export function formatMoney(cents: number): string {
  if (!Number.isSafeInteger(cents)) {
    throw new Error(`Amount ${String(cents)} is not a whole number of cents`);
  }
  const abs = Math.abs(cents);
  const dollars = String(Math.floor(abs / 100)).replace(THOUSANDS, ",");
  const rest = String(abs % 100).padStart(2, "0");
  return `${cents < 0 ? "-" : ""}$${dollars}.${rest}`;
}

/** SPEC-overview §2.4: a transaction row shows `+$75.50` for money in, `-$55.50` for money out. */
export const formatSignedMoney = (cents: number): string =>
  cents > 0 ? `+${formatMoney(cents)}` : formatMoney(cents);
```

- [ ] **Step 3: Write `src/shared/dates.ts`**

```ts
/**
 * SPEC-overview §4.2, "Dates": `d MMM yyyy` in **UTC** — `2026-08-19T20:23:11Z` is
 * `19 Aug 2026` in every time zone. The month names are spelled out here rather than taken
 * from `Intl`: its en-GB data writes September as "Sept" (CLDR 48), while the format and
 * SPEC-app-shell §2.6 ("12 Sep 2026") use three letters, and Node and the three browser
 * engines need not ship the same data.
 */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const ISO_8601 =
  /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2}))?$/;

/**
 * ISO-8601 text as the API sends it: a date, or a date and a time with its zone. The
 * built-in parser is lenient — it reads "19 August, maybe" as a day in 2001, rolls
 * 30 February into March and reads a time without a zone as local time — so anything else
 * is refused rather than written as a wrong day.
 */
function parseIso(text: string): Date | undefined {
  const [, year, month, day] = ISO_8601.exec(text) ?? [];
  if (!year || !month || !day) return undefined;
  const calendarDay = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return calendarDay.toISOString().slice(0, 10) === `${year}-${month}-${day}`
    ? new Date(text)
    : undefined;
}

/** ISO-8601 text or a `Date`, written `d MMM yyyy` in UTC. */
export function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? parseIso(value) : value;
  const month = date && MONTHS[date.getUTCMonth()];
  if (!date || month === undefined) {
    throw new Error(`Date ${String(value)} is not a valid ISO-8601 date`);
  }
  return `${date.getUTCDate()} ${month} ${date.getUTCFullYear()}`;
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/unit/shared`
Expected (*measured per file*, E16): money 17, dates 24 — all pass.

- [ ] **Step 5: Replace `src/shared/README.md`**

```md
# src/shared

Zod schemas, DTO types, enums (categories, themes), test ids, copy (ADR-0002).

- **Imports allowed:** nothing from the rest of the codebase.
- Used by forms, route handlers and WebMCP tools alike (NFR-Q2).

T-03 wrote the SPEC-overview §4.2 formatters: `money.ts` (`formatMoney`,
`formatSignedMoney`) and `dates.ts` (`formatDate`). T-04 adds `copy.ts`, `test-ids.ts`, the
schemas and the enums.
```

- [ ] **Step 6: All unit gates**

Run: `npx prettier --write src/shared tests/unit/shared && npm run lint && npm run format:check && npm run typecheck && npm test`
Expected: every command exits 0; Vitest **332/332**.

- [ ] **Step 7: Commit**

```bash
git add src/shared tests/unit/shared
GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit -m "feat(shared): formatMoney, formatSignedMoney and formatDate per SPEC-overview §4.2 (T-03)"
```

---

