# T-03 — fix Copilot's four review comments on PR #8 (owner decision, 2026-09-23 00:08 +04)

The owner chose "Dördünü bu PR-da düzəlt" ("fix all four in this PR"). Each comment matches a
minor the T-03 task reviews had deferred. One commit, four small edits, test count unchanged
(Vitest stays 341/341, 18 files). Touch only the four files below.

## 1. `src/domain/bills.ts` (Copilot, Medium) — no list copying when grouping by vendor

Copilot: "Building `byName` copies the vendor's transaction list on every iteration
(`[...existing, transaction]`), which is O(k²) per vendor. Mutating the array in-place avoids
repeated allocations while preserving the same order of appearance."

In `recurringBills`, replace

```ts
    byName.set(transaction.name, [...(byName.get(transaction.name) ?? []), transaction]);
```

with

```ts
    const list = byName.get(transaction.name);
    if (list) list.push(transaction);
    else byName.set(transaction.name, [transaction]);
```

The arrays are local to the function; the caller's input is not mutated. Order of appearance
and every result stay the same (`tests/unit/domain/bills.test.ts`, `overview.test.ts`,
`seed-figures.test.ts` cover it).

## 2. `src/shared/dates.ts` (Copilot, Low) — quote string inputs in the error

Copilot: "The thrown error uses `String(value)`, so an empty-string input becomes `Date  is not
a valid ISO-8601 date`, which is hard to read in logs. Quoting string inputs keeps messages
unambiguous while still handling invalid `Date` values safely."

In `formatDate`, the message becomes

```ts
    throw new Error(
      `Date ${typeof value === "string" ? JSON.stringify(value) : String(value)} is not a valid ISO-8601 date`,
    );
```

(let Prettier wrap it as it wants). An invalid `Date` still reads `Date Invalid Date is not …`.
In `tests/unit/shared/dates.test.ts`, the `it.each` "refuses %j, which is not an ISO-8601 date
with its zone" asserts the full quoted message instead of the substring:

```ts
    expect(() => formatDate(text)).toThrow(`Date ${JSON.stringify(text)} is not a valid ISO-8601 date`);
```

(no other test changes in that file).

## 3. `tests/unit/domain/transactions.test.ts` (Copilot, Low) — the sort test's title

Copilot: "This test description says sorting is "ignoring case", but the behavior being asserted
is simply locale-aware ordering (and `Intl.Collator("en")` is not necessarily case-insensitive by
default). Rewording avoids over-claiming what the test verifies."

Title `"orders names as a reader would, ignoring case"` →
`"orders names A to Z as a reader would, not by code unit"`. Assertions unchanged.

## 4. `tests/unit/shared/money.test.ts` (Copilot, Low) — `-0` as its own test

Copilot: "The parameterized `it.each` includes both `0` and `-0`, but Vitest formats `%d` so both
cases appear as the same test name in output ("writes 0 cents..."). Splitting `-0` into its own
`it` makes failures distinguishable."

Remove the row `[-0, "$0.00"],` from `formatMoney`'s `it.each`, and add after that `it.each`
(before the "refuses" block):

```ts
  it("writes negative zero as $0.00, not -$0.00", () => {
    expect(formatMoney(-0)).toBe("$0.00");
  });
```

Net test count: −1 row, +1 test → unchanged.

## Gates and commit

- RED/GREEN for item 2: after editing the test first, `npx vitest run tests/unit/shared/dates.test.ts`
  fails (the old message has no quotes); after the source edit it passes. Report both.
- `npx prettier --write` on the four files, then `npm run format:check && npm run lint && npm run typecheck && npm test`
  → Vitest 341/341 (18 files).
- Commit (scoped `git add` of the four files), subject:
  `fix(domain,shared): Copilot review on #8 — no list copying in recurringBills, quoted date errors, two test titles (T-03)`
  with your attribution trailer. Do not push.
