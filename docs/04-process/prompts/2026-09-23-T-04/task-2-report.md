# Task 2 Report: The copy appendix in `copy.ts`

## Overview
Completed all 8 steps of Task 2 as specified in the brief. The copy appendix from user-stories.md is now mirrored in `src/shared/copy.ts` with comprehensive test coverage. All 364 unit tests pass.

## Step 1: Amend `docs/01-requirements/user-stories.md` (v1.2)
Updated the status line to v1.2 with the T-04 plan gate amendments:
- Changed demo banner from "Demo data resets every 10 days" to "Demo data resets every {days} days"
- Added three new R1 addition rows for sign-up maxima validation messages
- Added note about {N} and {days} placeholder formatting

## Step 2: Amend `docs/03-specs/app-shell.md` (v1.1)
Updated the spec to v1.1:
- Status line updated with v1.1 changelog entry
- Section 2.6 now references `meta.resetIntervalDays` instead of hardcoded "10 days"
- Added reference to `COPY.resetBanner` function
- Included note about singular/plural handling ("1 day" vs "{days} days")

## Step 3: Write the failing test and generate fixtures
Created `tests/unit/shared/copy.test.ts` with 16 tests covering:
- Every row of the copy appendix (rendered with sample values)
- Verification that all COPY entries are used
- Violation fixtures to catch reworded messages
- Violation fixture to catch removed sections

Generated two fixture files via `copy-fixtures.mjs`:
- `tests/fixtures/copy/reworded.md.fixture` - modified appendix with one message changed
- `tests/fixtures/copy/no-appendix.md.fixture` - appendix under wrong heading

## Step 4: Run the test to see it fail
```
FAIL  tests/unit/shared/copy.test.ts
Error: Cannot find package '@/src/shared/copy' imported from .../tests/unit/shared/copy.test.ts
```
Expected failure confirmed — module does not exist yet.

## Step 5: Write `src/shared/copy.ts`
Created the copy module with:
- `COPY` constant containing all user-visible strings
- Functions for parameterized messages: `signupDisabled()`, `resetBanner()`, `loginRateLimited()`, `agentToolsNative()`, `agentToolsPolyfill()`
- `retryAfterMinutes()` helper function for SPEC-auth §4 rate limiting
- Helper `count()` function for singular/plural handling

## Step 6: Run the test to see it pass
```
Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  09:55:44
   Duration  80ms
```
All 16 tests pass as expected.

## Step 7: All unit gates
Ran prettier, lint, format:check, typecheck, and npm test:

### Prettier
```
src/shared/copy.ts 23ms (unchanged)
tests/unit/shared/copy.test.ts 13ms (unchanged)
```

### Lint (ESLint)
```
> npm run lint
> eslint . --max-warnings 0
```
✓ No errors or warnings

### Format check (Prettier)
```
> npm run format:check
> prettier --check .
Checking formatting...
All matched files use Prettier code style!
```
✓ All files properly formatted

### Typecheck (TypeScript)
```
> npm run typecheck
> tsc --noEmit
```
✓ No type errors

### Unit tests (Vitest)
```
Test Files  20 passed (20)
      Tests  364 passed (364)
   Start at  09:56:01
   Duration  5.46s
```
✓ All 364 unit tests pass (matches plan expectation of 348 → 364)

## Step 8: Commits

**Commit 1 — Documents**
```
7ecfd6d docs(stories,app-shell): v1.2 / v1.1 — banner interval as {days}, sign-up maxima copy (T-04 plan gate)
 2 files changed, 10 insertions(+), 5 deletions(-)
```

**Commit 2 — Code**
```
505d4e4 feat(shared): copy.ts mirrors the user-stories copy appendix, row by row (T-04)
 4 files changed, 339 insertions(+)
 create mode 100644 src/shared/copy.ts
 create mode 100644 tests/fixtures/copy/no-appendix.md.fixture
 create mode 100644 tests/fixtures/copy/reworded.md.fixture
 create mode 100644 tests/unit/shared/copy.test.ts
```

## Test Results Summary
- **Test Files**: 20 passed (20)
- **Tests**: 364 passed (364)
- **Duration**: 5.43s
- **Status**: ✓ All gates green

## Definition of Done Verification
- ✓ Copy comes from `src/shared/copy.ts`
- ✓ `copy.ts` mirrors the user-stories copy appendix, row by row
- ✓ Test renders every appendix row and fails if the two drift
- ✓ All validation messages are centralized in one module
- ✓ All parametric messages (signup, rate limit, banner, agent tools) are implemented
- ✓ Helper functions (`retryAfterMinutes`, `count`) provide correct formatting
- ✓ Fixture-based tests catch regressions (reworded messages, missing sections)
- ✓ All 364 unit tests pass
- ✓ All linting, formatting, and type-checking gates pass
