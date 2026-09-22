### Spec Compliance

✅ Spec compliant, with the findings below. Verified against the brief's 7 steps and the global constraints, file by file.

**Files (brief's list vs diff):** `src/domain/calendar.ts` (new), `src/domain/money.ts` (new), `tests/unit/domain/calendar.test.ts` (new), `tests/unit/domain/money.test.ts` (new), `src/server/seed.ts` (modified), `tests/unit/seed.test.ts` (modified) — all six present, no extra files touched (`review-e2da2d3..c5e7d45.diff` stat: 6 files changed).

**Verbatim-move check (owner's plan-gate answer 2), a named risk — checked by diffing the removed `seed.ts` hunk against the added domain files:**
- `shiftYears`/`SEED_YEAR_SHIFT`/`UTC_TIMESTAMP`/`isLeapYear`, diff.md:126-145 (removed) vs diff.md:22-45 (`calendar.ts`, added) — identical, including comments.
- `toCents`, diff.md:147-157 (removed) vs `money.ts:7-17` (diff.md:66-77, added) — identical, including the `(ADR-0005, NFR-D2)` parenthetical in the docstring.
- The brief's own Step 3 printed code (task-2-brief.md:137-140) drops `(ADR-0005, NFR-D2)` from that comment. The implementer correctly followed the owner's plan-gate condition ("dəyişdirilmədən köçsün" / unchanged) over the brief's literal printed text, and flagged the discrepancy in the report. Ruling: correct resolution — `money.ts:7-10` and the original `seed.ts` comment are byte-identical, which is what "verbatim move" requires. Minor process note below.

**ADR-0002 (`domain` imports only `shared`)**, a named risk — checked: `src/domain/calendar.ts` and `src/domain/money.ts` have zero imports (diff.md:16-96). Compliant.

**ADR-0005 (no `new Date()` in domain/server business code)**, a named risk — checked: no `Date(` construction anywhere in the diff's added/modified lines.

**Step 4 (seed.ts imports / re-export)** — diff.md:102-105 matches the brief's Step 4 import block exactly; `SEED_YEAR_SHIFT`, `shiftYears`, `toCents` are no longer defined or exported from `seed.ts` (diff.md:126-158, deleted). No re-export, matching the plan-gate answer ("re-export lazım deyil").

**`tests/unit/seed.test.ts`** (diff.md:251-270) — only the import block changed (three names moved to `@/src/domain/calendar` and `@/src/domain/money`); no other lines touched, matching "Testlərin import yolları yenilənsin, test məzmunu dəyişməsin."

**New functions (`isInMonthOf`, `isInMonthUpTo`, `sumCents`)** match the brief's Step 2/Step 3 code blocks verbatim, and the new test files (`calendar.test.ts`, `money.test.ts`) match the brief's Step 1 code blocks verbatim, including the docblock traceability comments (SPEC-overview §4.2, US-27 AC2, ADR-0005).

**Test counts**: brief predicts calendar 10, money 9 — `calendar.test.ts` has 6 + 4 `it.each` cases = 10; `money.test.ts` has 3 individual `it`s + 4 `it.each` cases + 2 individual `it`s = 9. Both match the report's claimed and the brief's expected counts.

⚠️ Cannot verify from diff: DoD v1.1 requires "`domain` coverage stays ≥ 90%." The implementer's Step 6 gates (lint, format:check, typecheck, `npm test`) don't include a coverage run. `shiftYears`/`toCents` are now domain code but are tested only from `tests/unit/seed.test.ts`, not from a `tests/unit/domain/*` file — this can still satisfy line coverage, but the controller should run `npx vitest run --coverage` (or confirm whether `npm test`'s config already enforces the threshold) rather than take the 263/263 pass count as proof of the coverage gate.

### Strengths

- The implementer independently caught the brief's own drift (dropped `(ADR-0005, NFR-D2)` in Step 3's printed `toCents` comment) before committing, and correctly prioritized the owner's plan-gate ruling over the brief's literal text — this is exactly the diff discipline the "verbatim move" requirement calls for.
- `calendar.test.ts:15` (`2025-08-15T12:00:00Z`, false) tests the same month/day but a different year, and `calendar.test.ts:17` (`2026-08-31T23:30:00-02:00`, false) tests a UTC-offset input that crosses a UTC calendar-month boundary — both are exactly the kind of edge case `isInMonthOf`'s UTC semantics need covering, and both are correct: `getUTCMonth`/`getUTCFullYear` on a `-02:00`-offset timestamp normalizes to UTC before comparison, so 23:30 at UTC-2 on 31 Aug is 01:30 UTC on 1 Sept, correctly falling outside August.
- `money.test.ts` (diff.md:237-241) explicitly tests a `BigInt` passed where a `number` is expected (`250n as unknown as number`), documented as guarding a future T-09 repository-boundary mistake — `Number.isSafeInteger` returns `false` (not a type error) for non-number types, so this correctly throws rather than silently coercing.
- Clean separation: `calendar.ts` and `money.ts` each have one clear responsibility, no imports, small (33 and 36 lines), matching ADR-0002's leaf-module contract for `domain`.

### Issues

#### Critical (Must Fix)
None.

#### Important (Should Fix)

**Plan-mandated correctness defect in `sumCents` — intermediate-sum overflow is not checked, only the final total.**
`src/domain/money.ts:29-36` (loop body) checks `Number.isSafeInteger(amount)` per element and `Number.isSafeInteger(total)` once after the loop, but never checks the running `total` on each iteration. Because floating-point addition rounds at magnitudes above `2^53`, a sequence whose *intermediate* partial sum exceeds `Number.MAX_SAFE_INTEGER` can round silently and then come back down into the safe range by the time the last element is added — producing a wrong total with no thrown error. Concretely: `sumCents([Number.MAX_SAFE_INTEGER, 2, -2])` — first element passes (it is exactly `MAX_SAFE_INTEGER`), `total` becomes `9007199254740991 + 2`, which rounds (round-half-to-even) to `9007199254740992`; subtracting `2` gives a final `total` of `9007199254740990`, one cent less than the mathematically correct `9007199254740991`. `Number.isSafeInteger(9007199254740990)` is `true`, so the function returns the wrong answer instead of throwing.
This directly contradicts the function's own docstring at `money.ts:19-23` ("Anything else is refused, so a dollar amount or a database `BigInt` … fails here instead of summing to a wrong figure") — the guarantee the code claims is not the guarantee the code provides. The brief prints this exact implementation verbatim (task-2-brief.md:161-173) and the test at `money.test.ts` (diff.md:243-245, "refuses a total beyond the exact range of a number") only exercises overflow of the *final* total (`[Number.MAX_SAFE_INTEGER, 1]`), not an intermediate one, so it does not catch this. Per the calibration rule, a defect the brief mandates verbatim is still reported as Important, labeled plan-mandated.
Reachability in this codebase is low: NFR-S3 bounds any single amount at ~99,999,999,999 cents, and realistic transaction counts are far short of the ~90,000 additions needed to push a partial sum past `2^53`; this is very unlikely to fire on real seed or user data today, but it is a live latent bug and the docstring's claim is currently false.
Fix: check `Number.isSafeInteger(total)` inside the loop, after each addition, not just once at the end. Add a regression test such as `expect(() => sumCents([Number.MAX_SAFE_INTEGER, 2, -2])).toThrow("beyond the exact range")`.

#### Minor (Nice to Have)

- **`task-2-brief.md:137-140` (Step 3's printed `toCents` comment) has drifted from the actual moved source** — it omits `(ADR-0005, NFR-D2)` that is present in `src/server/seed.ts`'s original `toCents` comment and in the committed `src/domain/money.ts:7-10`. The implementer resolved this correctly in code, but the plan document itself should be corrected so a future reader diffing against the brief doesn't get a false mismatch signal.
- **Owner-mandated, no action for this task:** the verbatim-moved error messages still carry seed-specific wording once relocated to general domain modules — `"Seed date \"${timestamp}\" is not a UTC ISO-8601 timestamp"` (`calendar.ts:20`, diff.md:41), `"Seed amount ${dollars} is not a whole number of cents"` (`money.ts:14`, diff.md:75), and the docstring "Dollars as data.json writes them to integer cents" (`money.ts:8`, diff.md:68). These read naturally today because `seed.ts` is still the only caller, but once T-09 or another consumer calls `toCents`/`shiftYears` outside the seed path, the wording will mislead. This is required by the plan-gate's "unchanged" condition, not an implementer error — flagging for the final whole-branch review, not for a fix in this task.

### Assessment

**Task quality:** Approved (with the one plan-mandated Important finding to track).

**Reasoning:** The move of `shiftYears`/`toCents` is verifiably byte-identical to the pre-existing code, scope is exactly the six brief-listed files, ADR-0002/ADR-0005 constraints hold, and the new calendar tests cover the real UTC edge cases (year boundary, UTC-offset crossing a month boundary). The one Important finding — `sumCents` only guards the final total, not intermediate partial sums, contradicting its own docstring's guarantee — is inherited verbatim from the brief's Step 3 code and is unlikely to be hit with current NFR-S3-bounded data, but it is a genuine, currently-false correctness claim that should be fixed (move the safe-integer check inside the loop) before other tasks build on `sumCents` for `budgetSpent`/`overviewSummary`.
