# Task 2 review (sonnet)

## Spec Compliance

All checked items match. Details:

- **Two new appendix rows + one reuse.** `docs/01-requirements/user-stories.md:302-306` adds "Sign-up name | > 60 characters | Maximum 60 characters" and "Password (sign-up) | > 128 characters | Maximum 128 characters" (no full stop, matching the pot-name row's style), plus "Email | > 254 characters | Enter a valid email address" reusing the existing message text. Verified against primary sources: the plan's recommended option (`docs/04-process/plans/2026-09-23-T-04.md:261-264`) and the owner's verbatim answer (line 322, Azerbaijani) both call for exactly this: two rows with new wording, one row reusing existing wording. The amended status line's "three R1 additions" (`user-stories.md:3`) is consistent.
- **`retryAfterMinutes`** (`src/shared/copy.ts:11-12`) is `Math.max(1, Math.ceil(retryAfter / 60))`, unchanged from SPEC-auth §4. Tested at retryAfter=30→"1 minute" and 90→"2 minutes" exactly (`tests/unit/shared/copy.test.ts:150,154`), plus 0/60/61/900 boundary cases.
- **`COPY.resetBanner`** (`copy.ts:33-34`) takes `days` as a parameter; no hardcoded `10` anywhere in `copy.ts` (grepped the whole file).
- **Mirror test** (`copy.test.ts`) renders every `COPY` entry against the amended appendix, in the appendix's own order — diffed the live appendix table against the test's `RENDERED` array row-by-row; order and content align exactly. It fails if a key goes unused (line 122-125) and if the appendix section is renamed/missing (`appendixRows` throws, line 134-136).
- **Fixtures.** `reworded.md.fixture` and `no-appendix.md.fixture` exercise distinct violations, each asserted by its own test. Regenerated both from the live appendix with the brief's exact generator logic (throwaway `node -e`, no git) and confirmed byte-for-byte equality with the committed fixtures.
- **Commits.** Two separate commits confirmed via `git show --stat`: `7ecfd6d` touches only `user-stories.md` + `app-shell.md`; `505d4e4` touches only `src/shared/copy.ts`, the test, and the two fixtures.
- **Scratch script.** `copy-fixtures.mjs` sits in `.superpowers/sdd/2026-09-23-T-04/` per the controller's redirect, gitignored — confirmed not committed.
- **US-31** (`user-stories.md:193`) is the story the mirror test's describe block cites — correct.
- **Test run.** Report pastes verbatim `Test Files 20 passed (20)` / `Tests 364 passed (364)`.

## Strengths

- The `state()` helper strips "Agent tools: " before joining the indicator's four states, correctly mirroring the appendix row's one-prefix-many-states shape.
- `appendixRows()` throwing (rather than returning empty) on a missing heading is a deliberate, well-reasoned choice the no-appendix fixture test explicitly exploits.
- Clear historical separation in `copy.ts` between the original appendix, the 2026-09-20 R1 additions, and the T-04-plan-gate R1 additions, with SPEC citations in comments.

## Issues

### Critical (Must Fix)
None.

### Important (Should Fix)
None.

### Minor (Nice to Have)
- `reworded.md.fixture` is a full snapshot of the appendix, compared index-by-index against `expected`. A future appendix row added without regenerating the fixture would report spurious extra "differing" rows; the generator that produces it is gitignored scratch, not committed. Consider committing the generator script or documenting the regeneration command.
- `"holds nothing the appendix lacks"` (`copy.test.ts:122-125`) has no violation fixture of its own — a key listed in `RENDERED` but never actually rendered would still pass. Low risk given the file is hand-verified and small.

## Assessment

**Task quality:** Approved
**Reasoning:** Implementation matches the brief and, on independent verification against the plan document and the owner's verbatim answer, matches the actual owner ruling too. Tests are substantive, commits correctly scoped, DoD's fixture requirement met.
