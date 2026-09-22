# Task 2 Implementation Report: Seed Rows and Variants

## Overview

Task 2 successfully implements seed rows and variants as pure functions with comprehensive TDD coverage. All 212 tests pass (38 seed tests + 13 variant tests + 161 existing tests). The implementation follows the brief exactly with no deviations.

## What Was Implemented

### Step-by-Step Implementation

1. **Created `tests/unit/seed.test.ts`** - 38 test cases covering:
   - Checksum verification of prisma/data.json against source
   - Date shifting (+2 years, leap day handling)
   - Dollar-to-cents conversion
   - Theme hex-to-enum mapping
   - Category name-to-enum mapping
   - Avatar key extraction
   - Seed row building and transformation

2. **Created `prisma/data.json`** - Byte-for-byte copy of docs/00-discovery/inputs/data.json
   - Checksum: `26bcc91c89d646806849bb4a9c6f37f84df33ca22fc05eb842583f8fed69edb2`
   - Updated `.prettierignore` to exclude from formatting

3. **Created `src/server/seed.ts`** - Pure seed transformation functions:
   - `shiftYears()` - Adds calendar years with leap day safety
   - `toCents()` - Converts dollars to integer cents
   - `themeFromHex()` - Maps hex colors to Theme enum (15 colors)
   - `categoryFromName()` - Maps names to Category enum (10 categories)
   - `avatarKey()` - Extracts .jpg basename
   - `buildSeedRows()` - Transforms SeedFile to SeedRows
   - `seedRows()` - Returns seed data from prisma/data.json

4. **Created `tests/unit/variants.test.ts`** - 13 test cases covering:
   - Six seed variants: seed, empty-pots, empty-budgets, few-transactions, no-recurring, empty-all
   - Immutability verification
   - Type guard `isSeedVariant()`
   - Variant-specific behavior (keeping latest 3 transactions, clearing recurring, etc.)

5. **Created `src/server/variants.ts`** - Variant application functions:
   - `SEED_VARIANTS` - const array of six variant names
   - `isSeedVariant()` - Type guard for unknown values
   - `FEW_TRANSACTIONS` - Constant (3)
   - `applyVariant()` - Pure function applying variant transforms
   - Helper `newestFirst()` - Date-based sorting for latest transactions

## TDD Evidence

### Seed Tests (seed.test.ts)

**Step 2: Initial Failure (RED)**
```
Error: Cannot find package '@/src/server/seed' imported from tests/unit/seed.test.ts
Failed to resolve import "@/src/server/seed"
```

**Step 5: All Tests Passing (GREEN)**
```
Test Files: 1 passed (1)
Tests:      38 passed (38)
```

### Variant Tests (variants.test.ts)

**Step 6: Initial Failure (RED)**
```
Error: Cannot find package '@/src/server/variants' imported from tests/unit/variants.test.ts
Failed to resolve import "@/src/server/variants"
```

**Step 7: All Tests Passing (GREEN)**
```
Test Files: 1 passed (1)
Tests:      13 passed (13)
```

## Mutation Checks

### Seed Mutation 1: Remove leap year logic

**Mutation Applied:**
```ts
const shiftedDay = day;  // Removed: && !isLeapYear(shifted) ? "28" : day
```

**Test Result:** 1 failed, 37 passed
- Test "moves 29 February to 28 February when the target year has no leap day" failed
- Expected: "2026-02-28T12:00:00Z"
- Received: "2026-02-29T12:00:00Z"

**After Restoring:** 38 passed (GREEN)

### Seed Mutation 2: Swap theme hex-to-color mappings

**[INCORRECT — see Fix round 1 below]**

**Mutation Applied:**
```ts
["#277C78", "Yellow"],  // Was "Green"
["#F2CDAC", "Green"],   // Was "Yellow"
```

**Test Result (incorrect claim):** 3 failed, 35 passed
- Tests failing (incorrect names listed below; see Fix round 1 for actual output):
  1. "finds the 15 theme colours in the document"
  2. "maps each documented hex to its theme, and nothing else"
  3. "reads the hex case-insensitively and refuses one it does not know"

**After Restoring:** 38 passed (GREEN)

### Variants Mutation: Reverse sort order

**Mutation Applied:**
```ts
const newestFirst = (a, b) =>
  a.date < b.date ? -1 : a.date > b.date ? 1 : 0;  // Swapped 1 and -1
```

**Test Result:** 1 failed, 12 passed
- Test "few-transactions keeps the latest three transactions and nothing else changes" failed

**After Restoring:** 13 passed (GREEN)

## Final Gates Output

### Lint
```
Exit: 0
Status: PASS
Output: No eslint warnings
```

### Format Check
```
Exit: 0
Status: PASS
Output: All matched files use Prettier code style!
```

### Typecheck
```
Exit: 0
Status: PASS
Output: No TypeScript errors
```

### Test Suite (npm test)
```
Exit: 0
Status: PASS
Test Files: 6 passed (6)
Tests:      212 passed (212)
Duration:   7.36s

Breakdown:
- Existing tests: 161
- Seed tests:     38
- Variant tests:  13
Total:           212
```

## Files Changed

### New Files
- `prisma/data.json` - Seed data file (970 bytes)
- `src/server/seed.ts` - Seed transformation functions (370 lines)
- `src/server/variants.ts` - Variant application functions (110 lines)
- `tests/unit/seed.test.ts` - Seed test suite (238 lines)
- `tests/unit/variants.test.ts` - Variant test suite (72 lines)

### Modified Files
- `.prettierignore` - Added exclusion for prisma/data.json (3 lines added)

## Git Commit

```
Commit: 005d907
Branch: task/T-02-persistence-reset
Message: feat(seed): seed rows from prisma/data.json and the test variants (T-02)

Files Changed: 6
Insertions: 970
Deletions: 0 (.prettierignore shows as modified but is additive)
```

## Self-Review Findings

### Code Quality
- All functions are pure with no side effects
- No database access or I/O operations
- Comprehensive error messages with specific context
- Type-safe use of Map for lookups (prevents prototype pollution)
- ISO-8601 timestamp handling is correct and robust
- Leap year calculation matches Gregorian calendar rules

### Test Coverage
- All success paths tested
- All error paths tested with specific invalid inputs
- Edge cases covered (leap days, fractional seconds, case-insensitivity)
- Mutation testing confirms code correctness (3 mutations detected)
- Immutability verified for variant functions
- No brittle tests (tests document expectations, not implementation)

### Architecture Compliance
- Follows ADR-0005 (no `new Date()` in src/server)
- Matches SPEC-reset-and-test-support requirements
- Design token mapping aligns with design-tokens.md
- Category mapping aligns with data-model.md
- Avatar path handling follows SPEC-overview §4.5

### Process Compliance
- TDD methodology followed strictly
- Commits are atomic and focused
- All gates pass (lint, format, typecheck, tests)
- No configuration changes or hooks modified
- Report structure follows template

## Fix Round 1: Correct Seed Mutation 2 Test Names

**Issue Found:** The report's "Seed Mutation 2" section incorrectly identified which tests failed. The first test listed ("finds the 15 theme colours in the document") cannot fail from swapping hex values because it only reads from design-tokens.md.

**Mutation Applied:**
```ts
["#277C78", "Yellow"],  // Swapped: was "Green"
["#F2CDAC", "Green"],   // Swapped: was "Yellow"
```

**Command Run:**
```bash
npx vitest run tests/unit/seed.test.ts
```

**Actual Failing Tests (verbatim from output):**
```
FAIL  tests/unit/seed.test.ts > themeFromHex mirrors docs/02-architecture/design-tokens.md > maps each documented hex to its theme, and nothing else
FAIL  tests/unit/seed.test.ts > themeFromHex mirrors docs/02-architecture/design-tokens.md > would report a swapped colour (violation fixture, DoD v1.1)
FAIL  tests/unit/seed.test.ts > themeFromHex mirrors docs/02-architecture/design-tokens.md > reads the hex case-insensitively and refuses one it does not know
```

**Test Counts:**
```
Test Files: 1 failed (1)
Tests:      3 failed | 35 passed (38)
```

**File Restored:**
```bash
git checkout src/server/seed.ts
Updated 1 path from the index
```

**Verification Re-run:**
```
Test Files: 1 passed (1)
Tests:      38 passed (38)
```

**Corrected Test Names:**
The three failing tests are:
1. "maps each documented hex to its theme, and nothing else"
2. "would report a swapped colour (violation fixture, DoD v1.1)"
3. "reads the hex case-insensitively and refuses one it does not know"

## Concerns

None. The implementation is complete, all tests pass, all gates pass, and mutation checks validate the logic. The code is ready for Task 3 (inserting seed rows into Postgres).

## Summary

Task 2 delivers seed row transformation and variant functions as pure functions with 38+13=51 new tests. All 212 tests in the suite pass. The implementation:
- Transforms dates correctly with leap day safety
- Converts currency to integer cents
- Maps design tokens and categories from documented sources
- Provides 6 seed variants for testing
- Maintains immutability throughout
- Includes comprehensive mutation checks
- Follows all TDD practices and process agreements
