### Task 1: The Clock, and an ADR-0005 rule it can be written under

**Files:**
- Create: `src/domain/clock.ts`, `tests/unit/domain/clock.test.ts`,
  `tests/fixtures/boundaries/domain-calls-date.ts.fixture`,
  `tests/fixtures/boundaries/server-calls-date.ts.fixture`,
  `tests/fixtures/boundaries/domain-parses-date-allowed.ts.fixture`,
  `tests/fixtures/boundaries/scripts-imports-domain-allowed.ts.fixture`
- Modify: `eslint.config.mjs` (the ADR-0005 block at the end),
  `tests/fixtures/boundaries/server-imports-domain-allowed.ts.fixture`,
  `tests/fixtures/boundaries/shared-imports-domain.ts.fixture`, `tests/unit/boundaries.test.ts`,
  `tests/fixtures/boundaries/README.md`

**Interfaces:**
- Consumes: nothing.
- Produces: `type Clock = { today(): Date }`; `BUSINESS_TODAY: "2026-08-19"` (a `string`);
  `fixedClock(isoDate: string): Clock` — throws `Clock date "<x>" is not a calendar date
  (YYYY-MM-DD)`.

- [ ] **Step 1: Repoint the two fixtures and add four**

`tests/fixtures/boundaries/server-imports-domain-allowed.ts.fixture` (whole file):

```ts
// Linted as src/server/imports-domain-allowed.ts.
// Control: repositories call the pure functions, so server → domain is legal. This is the
// direction that makes the domain layer worth having, and it must stay unreported.
import "@/src/domain/clock";
```

`tests/fixtures/boundaries/shared-imports-domain.ts.fixture` (whole file):

```ts
// Linted as src/shared/imports-domain.ts.
// ADR-0002: shared imports nothing from the rest.
import "@/src/domain/clock";
```

`tests/fixtures/boundaries/domain-calls-date.ts.fixture`:

```ts
// Linted as src/domain/calls-date.ts.
// ADR-0005, the third form: `Date()` without `new` returns the current time as text. The
// rule missed it until T-03 (plan finding F1).
export const stamp = (): string => Date();
```

`tests/fixtures/boundaries/server-calls-date.ts.fixture`:

```ts
// Linted as src/server/calls-date.ts.
// ADR-0005: `Date()` reads the wall clock in src/server as much as in src/domain.
export const stamp = (): string => Date();
```

`tests/fixtures/boundaries/domain-parses-date-allowed.ts.fixture`:

```ts
// Linted as src/domain/parses-date-allowed.ts.
// Control: ADR-0005 forbids reading the wall clock, not building a fixed date. `fixedClock`
// turns "2026-08-19" into a `Date` this way (T-03); a rule that caught these would leave the
// Clock itself impossible to write.
export const businessDay = (): Date => new Date(Date.UTC(2026, 7, 19));
export const parsed = (): Date => new Date("2026-08-19T20:23:11Z");
```

`tests/fixtures/boundaries/scripts-imports-domain-allowed.ts.fixture`:

```ts
// Linted as scripts/imports-domain-allowed.ts.
// Control: ADR-0002's 2026-09-20 clarification lets scripts import domain as well as
// shared. scripts/seed-figures.ts computes the seed's figures with the domain's functions.
import { BUSINESS_TODAY } from "@/src/domain/clock";
export const today = BUSINESS_TODAY;
```

- [ ] **Step 2: Add the cases to `tests/unit/boundaries.test.ts`**

At the end of the `violations` array, after the `server-uses-date-now` entry:

```ts
  {
    // `Date()` without `new` returns the current time as text; the rule missed it until T-03.
    fixture: "domain-calls-date.ts.fixture",
    lintAs: "src/domain/calls-date.ts",
    ruleId: "no-restricted-syntax",
    message: "ADR-0005: inject a Clock instead of calling Date()",
  },
  {
    fixture: "server-calls-date.ts.fixture",
    lintAs: "src/server/calls-date.ts",
    ruleId: "no-restricted-syntax",
    message: "ADR-0005: inject a Clock instead of calling Date()",
  },
```

In the `allowed` array, after the `scripts-imports-shared-allowed` entry:

```ts
  {
    fixture: "scripts-imports-domain-allowed.ts.fixture",
    lintAs: "scripts/imports-domain-allowed.ts",
  },
  {
    // ADR-0005 forbids reading the wall clock, not building a fixed date: `fixedClock`
    // needs `new Date(<ms>)`, and a rule that caught it would make the Clock unwritable.
    fixture: "domain-parses-date-allowed.ts.fixture",
    lintAs: "src/domain/parses-date-allowed.ts",
  },
```

In `importTargets`, replace `"src/domain/README.md",` with `"src/domain/clock.ts",`.

- [ ] **Step 3: Run the boundary tests**

Run: `npx vitest run tests/unit/boundaries.test.ts`
Expected (*measured*, E12): **5 failed | 34 passed (39)** — `the fixtures' import target
src/domain/clock.ts exists`, `src/shared/imports-domain.ts reports boundaries/dependencies`,
`src/domain/calls-date.ts reports no-restricted-syntax`, `src/server/calls-date.ts reports
no-restricted-syntax`, `src/domain/parses-date-allowed.ts reports nothing`. The two controls that
import `src/domain/clock` pass *vacuously* while the file is missing (an unresolved import counts
as external) — which is why `importTargets` checks the file exists.

- [ ] **Step 4: Write the Clock's tests** — `tests/unit/domain/clock.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";

describe("Clock (ADR-0005, NFR-D1)", () => {
  it("fixes business time at 19 Aug 2026 (NFR-D1)", () => {
    expect(BUSINESS_TODAY).toBe("2026-08-19");
  });

  it("answers the calendar day it was given, at 00:00 UTC", () => {
    expect(fixedClock(BUSINESS_TODAY).today().toISOString()).toBe("2026-08-19T00:00:00.000Z");
  });

  it("cannot be moved by a caller that mutates the date it was given", () => {
    const clock = fixedClock("2026-08-19");
    clock.today().setUTCFullYear(1999);
    expect(clock.today().toISOString()).toBe("2026-08-19T00:00:00.000Z");
  });

  it("accepts 29 February in a leap year", () => {
    expect(fixedClock("2028-02-29").today().toISOString()).toBe("2028-02-29T00:00:00.000Z");
  });

  it.each([
    "2026-02-29",
    "2026-02-30",
    "2026-13-01",
    "2026-8-19",
    "19 Aug 2026",
    "2026-08-19T00:00:00Z",
    "",
  ])("refuses %j, which is not a calendar date", (isoDate) => {
    expect(() => fixedClock(isoDate)).toThrow("is not a calendar date (YYYY-MM-DD)");
  });
});
```

Run: `npx vitest run tests/unit/domain/clock.test.ts`
Expected (*prediction*): the file fails to load — `src/domain/clock` does not resolve.

- [ ] **Step 5: Write `src/domain/clock.ts`**

```ts
/**
 * ADR-0005: business time is fixed and reaches the domain only through a `Clock`. "Today" is
 * 19 Aug 2026 in production and in tests alike (NFR-D1, PRD OQ-4), so nothing in
 * `src/domain` or `src/server` reads the wall clock (lint rule, eslint.config.mjs).
 */
export type Clock = { today(): Date };

/** NFR-D1: "today" = 2026-08-19, current month = August 2026. */
export const BUSINESS_TODAY = "2026-08-19";

const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * A clock that always answers the same calendar day, at 00:00 UTC. Each call returns a new
 * `Date`, so a caller that mutates the one it was given cannot move the clock.
 */
export function fixedClock(isoDate: string): Clock {
  const [, year, month, day] = CALENDAR_DATE.exec(isoDate) ?? [];
  const ms = Date.UTC(Number(year), Number(month) - 1, Number(day));
  // Date.UTC rolls 2026-02-30 over into March; reading the date back refuses it instead.
  if (!year || !month || !day || new Date(ms).toISOString().slice(0, 10) !== isoDate) {
    throw new Error(`Clock date "${isoDate}" is not a calendar date (YYYY-MM-DD)`);
  }
  return { today: () => new Date(ms) };
}
```

- [ ] **Step 6: Run the tests and the linter on the Clock**

Run: `npx vitest run tests/unit/boundaries.test.ts tests/unit/domain/clock.test.ts`
Expected (*measured*, E12): **3 failed | 47 passed (50)** — the two `calls-date` cases and
`parses-date-allowed`.
Run: `npx eslint src/domain/clock.ts`
Expected (*measured*): 2 errors, 21:34 and 24:25, "ADR-0005: inject a Clock instead of calling
new Date() in domain/server business code" — today's rule rejects the Clock (question 1).

- [ ] **Step 7: Narrow the rule to the clock reads** — in `eslint.config.mjs`, replace

```js
        {
          selector: "NewExpression[callee.name='Date']",
          message:
            "ADR-0005: inject a Clock instead of calling new Date() in domain/server business code.",
        },
```

with

```js
        {
          // The wall clock is read by the argument-less form only. `new Date(<text or ms>)`
          // builds a fixed value — how `fixedClock` makes business time (T-03) — and is
          // allowed; the domain-parses-date-allowed fixture keeps it that way.
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message:
            "ADR-0005: inject a Clock instead of calling new Date() in domain/server business code.",
        },
        {
          // `Date()` without `new` returns the current time as text — the same clock read.
          selector: "CallExpression[callee.name='Date']",
          message:
            "ADR-0005: inject a Clock instead of calling Date(), which reads the current time.",
        },
```

The `Date.now()` entry after it stays as it is.

- [ ] **Step 8: Run again**

Run: `npx vitest run tests/unit/boundaries.test.ts tests/unit/domain/clock.test.ts`
Expected (*measured*): **50 passed (50)**.
Run: `npx eslint . --max-warnings 0`
Expected (*measured*): exit 0.

- [ ] **Step 9: Update `tests/fixtures/boundaries/README.md`**

In "What is covered", the last row of the first table becomes:

```md
| ADR-0005's clock rule                      | `new Date()`, `Date()` and `Date.now()`, in `src/domain` **and** `src/server`                                                         |
```

and the second table becomes:

```md
| Must report nothing                                           | Fixture                          |
| ------------------------------------------------------------- | -------------------------------- |
| `domain` → `shared`                                           | `domain-imports-shared-allowed`  |
| `app` → `server`                                              | `app-imports-server-allowed`     |
| `server` → `domain`                                           | `server-imports-domain-allowed`  |
| `scripts` → `shared`                                          | `scripts-imports-shared-allowed` |
| `scripts` → `domain`                                          | `scripts-imports-domain-allowed` |
| `webmcp` → `shared`                                           | `webmcp-imports-shared-allowed`  |
| `new Date(<value>)` in `domain` — a fixed date, not the clock | `domain-parses-date-allowed`     |
```

In "Why some imports point at README files", replace the sentences from "`src/server` holds
modules since T-02" to "T-03 points them at real modules." with:

```md
therefore has to exist. `src/server` and `src/domain` hold modules since T-02 and T-03, and
their fixtures import `src/server/db` and `src/domain/clock`; `src/webmcp` and `app/(app)`
hold none yet, so their fixtures import the only file each contains. The layer is what is
being asserted, not the module's contents, and a side-effect import states that plainly.
```

Run: `npx prettier --write tests/fixtures/boundaries/README.md && npx prettier --check tests/fixtures/boundaries/README.md`
Expected: "All matched files use Prettier code style!"

- [ ] **Step 10: All unit gates**

Run: `npm run lint && npm run format:check && npm run typecheck && npm test`
Expected (*measured per file*): every command exits 0; Vitest **244/244**.

- [ ] **Step 11: Commit**

```bash
git add eslint.config.mjs src/domain/clock.ts tests/unit/domain/clock.test.ts tests/unit/boundaries.test.ts tests/fixtures/boundaries
GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit -m "feat(domain): fixed business Clock; ADR-0005 rule catches Date() and allows fixed dates (T-03)"
```

---

