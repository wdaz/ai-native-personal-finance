### Spec Compliance

✅ Spec compliant. All five files listed in the brief (`src/shared/money.ts`, `src/shared/dates.ts`, `tests/unit/shared/money.test.ts`, `tests/unit/shared/dates.test.ts`, `src/shared/README.md`) are present in the diff and match the brief's fenced code blocks byte-for-byte (verified by direct comparison, task-4-brief.md:145–244 vs review diff lines 15–241). No files outside the brief's list are touched.

- `formatMoney` (money.ts) correctly guards with `Number.isSafeInteger`, builds digits from the integer (no float division of the final result), and handles `-0` correctly (`-0 < 0` is `false` in JS, so `"$0.00"` not `"-$0.00"`) — satisfies §4.2 and NFR-S3's floating-point concern.
- `formatSignedMoney` correctly reuses `formatMoney` and only prefixes `+` for `cents > 0`, leaving `0` unprefixed and negative values already correctly signed by `formatMoney` — matches §2.4/§4.2.
- `formatDate` (dates.ts) uses a fixed `MONTHS` table, not `Intl` — correctly implements the owner's plan-gate override of §4.2's `Intl` example (answer 4). Traced the ISO-8601 regex and `parseIso` calendar round-trip check against every brief test case, including the `20:23Z`/UTC-day case, the `-02:00` offset case, `2026-02-30` (invalid calendar day), the no-zone-time case, `T25:00:00Z` (passes regex, produces an Invalid Date, caught by `MONTHS[NaN] === undefined`), and both December/September boundary tests (owner's plan-gate answer 3 boundary cases: 0, negative, 1 cent, December, September — all present).
- Error messages match the brief's interface spec verbatim: `` Amount <x> is not a whole number of cents `` and `` Date <x> is not a valid ISO-8601 date ``.
- ADR-0002 (`shared` imports nothing from the rest): confirmed — neither `money.ts` nor `dates.ts` has any `import` statement.
- §7 unit-test requirement ("formatMoney positive/negative/zero/large; formatDate UTC incl. 20:23Z case") is met.
- Test counts verified by hand-count against the diff: money.test.ts = 10 + 3 + 4 = 17 tests, dates.test.ts = 1+1+1+12+1+1+1+5+1 = 24 tests — matches the brief's and report's 17/24.

⚠️ Cannot verify from diff alone: §4.2's own text still shows the `Intl` example; the task prompt states Task 5 (not this task) amends it, so this is not a finding here, only a note for the controller to confirm Task 5 lands before the PR is considered spec-consistent end-to-end.

**Named-risk check performed:** `tests/unit/shared/dates.test.ts` mutates `process.env.TZ` in `beforeAll`/restores it in `afterAll`. Read `vitest.config.ts` (project root): no `pool` option is set, so Vitest 5's default (`'forks'`, confirmed via vitest.dev/config/pool) applies — each worker is a separate OS process with its own `process.env`, so a `TZ` mutation in one test file's process cannot leak into another file running in a different process. Within the same forked process, files run sequentially and the file's own `afterAll` restores `TZ` before the process moves to the next file. No cross-file leak risk found.

### Strengths

- Implementation is byte-for-byte identical to the brief's specified code, with correct TDD evidence (RED at task-4-report.md:44–62, GREEN at :64–84).
- `formatDate`'s regex-plus-calendar-round-trip validation (dates.ts) correctly rejects `2026-02-30` and other JS-Date-parser leniencies the docstring calls out, and the design was traced end-to-end for every brief test case without a discrepancy.
- `formatMoney`'s digit-building approach avoids floating-point division on the money value, consistent with NFR-S3 and DoD's "integer cents … formatted only at the edge."
- README update matches the brief exactly and correctly documents the T-03/T-04 split.
- No unrelated files touched; `git add src/shared tests/unit/shared` scope matches the brief's Files list exactly.

### Issues

#### Critical (Must Fix)
None.

#### Important (Should Fix)
None.

#### Minor (Nice to Have)

- **task-4-report.md:100–101** — The report explicitly omits a Node `NO_COLOR`-vs-`FORCE_COLOR` warning from Step 6's "relevant lines" output, with a stated rationale ("not part of any command's own output"). Per the reviewer template, warnings/noise in reported test output are findings regardless of rationale, and both the RED (task-4-report.md:43–60) and Step 6 (task-4-report.md:100–132) outputs are trimmed to "relevant lines" rather than shown in full — the controller has no complete, unfiltered run of the brief's own Step 6 command to inspect. Recommend the controller ask for the untrimmed output at least once, or accept the trimming as adequately disclosed.
- **tests/unit/shared/money.test.ts:13–14** (brief lines 31–32, copied verbatim) — The `it.each` rows `[0, "$0.00"]` and `[-0, "$0.00"]` share the auto-generated title template `"writes %d cents as %s"`. Vitest's `%d` formatting converts `-0` to the string `"0"` (JS's `Number::toString` never emits `"-0"`), so both tests render as the identical title "writes 0 cents as $0.00" in reporter output. Both assertions still run and are independently correct, so this is a diagnostics/clarity issue, not a functional bug: a failure in the `-0` row would be hard to distinguish from the `0` row in a reporter summary. Fix (optional): give the `-0` case its own named `it` (e.g., "treats negative zero as $0.00, not -$0.00"). Check to confirm: `npx vitest run tests/unit/shared/money.test.ts --reporter=verbose`.
- **tests/unit/shared/money.test.ts:28–36** — `formatSignedMoney` is tested for `1_234`, `-1_234`, `1`, `0` but not for its own throw path (non-integer/NaN cents, which it inherits from `formatMoney`) or for `-0` (the case where a stray sign could most plausibly leak through the `cents > 0` prefix logic). Coverage is adequate for the stated spec example values but slightly narrower than `formatMoney`'s own suite.
- **src/shared/dates.ts** (throw line, "Date ${String(value)} is not a valid ISO-8601 date") — For the empty-string input case (tested at dates.test.ts:129/191), `String(value)` is `""`, producing the message `Date  is not a valid ISO-8601 date` (double space, empty operand). Purely cosmetic; the test only checks a substring so it isn't caught, but the message is a little rough for a thrown error that could reach a log or UI.

### Assessment

**Task quality:** Approved

**Reasoning:** The diff is an exact, verified implementation of the brief with correct edge-case handling (traced by hand against every listed test case) and full compliance with ADR-0002, §4.2, and the owner's plan-gate overrides; the only findings are minor test-clarity and report-completeness nitpicks that do not affect correctness or spec compliance.
