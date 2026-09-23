# Final-review fix wave — scoped re-review (sonnet)

Range: `9ac2df8..211188c` (one commit).

## Finding Verdict

**`z.uuid()` exemption contradicted D17** — ADDRESSED. Confirmed the plan cell
(`docs/04-process/plans/2026-09-23-T-04.md:231`, D17 row) lists `z.uuid()` exempt from
`maxLength` in the last ("Alternative rejected") column — the finding's reading is correct.
- Code: `src/shared/tool-schema.ts:43-48` — `bounded` no longer checks `format === "uuid"`; only
  `maxLength`, `enum`, `const` count. Header comment reverted to match. `grep -n "uuid\|format"`
  on the file now returns nothing.
- Tests: `tests/unit/shared/tool-schema.test.ts:64-67` — bare `z.uuid()` now asserted to throw
  `"Tool input strings need a maxLength: id"`; `:69-72` — new test asserts `z.uuid().max(36)`
  does not throw (matches T-15 hand-off's documented pattern).
- Ran `npx vitest run tests/unit/shared/tool-schema.test.ts` independently: **11/11 passed**,
  matching the report verbatim.

## New Breakage in the Fix Diff

None. Diff is exactly 2 files, 8 insertions/7 deletions, scoped to the exemption removal and its
tests — no other logic touched.

## Test-count math check

Diff confirms the mechanism the report describes: one `it()` (line 64, "accepts z.uuid() —
exempt...") was replaced in place (flipped assertion, net 0) and one new `it()` was appended
immediately after (net +1). File went 10→11 tests, matching an independent count of `it(`
occurrences (11) and the 11/11 vitest run. Full-suite 429→430 claim is consistent with this file
being the only one touched. Report shows real pasted vitest/lint/typecheck/prettier output, not
paraphrase.

## Out-of-Scope Observations

None (`process-log.md`'s unrelated, concurrent controller edit, noted by the implementer, is
outside this diff and not part of the fix).

## Verdict

**Fix wave: Addressed, no new Critical/Important breakage.**
