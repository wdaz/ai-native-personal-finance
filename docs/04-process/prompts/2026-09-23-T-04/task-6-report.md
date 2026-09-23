# Task 6 Report: `test-ids.ts` and the rule that makes it the only source

## Summary

Task 6 completed successfully. Implemented an empty, typed registry `TEST_IDS` in `src/shared/test-ids.ts` and added an ESLint rule that rejects hand-typed `data-testid` strings in JSX and `getByTestId` arguments in tests, enforcing that all test ids must come from the registry.

**Commit SHA:** `60ca07267bb12ed8b61cb9694b7674569de89081`

## Step-by-Step Execution

### Step 1: Write failing tests and fixtures

Created the following files:
- `tests/unit/shared/test-ids.test.ts` — Two test cases for id uniqueness and kebab-case validation
- `tests/fixtures/boundaries/ui-literal-test-id.tsx.fixture` — Violation: string literal data-testid
- `tests/fixtures/boundaries/ui-shared-test-id-allowed.tsx.fixture` — Control: data-testid from TEST_IDS
- `tests/fixtures/boundaries/e2e-literal-test-id.ts.fixture` — Violation: string literal in getByTestId
- `tests/fixtures/boundaries/e2e-shared-test-id-allowed.ts.fixture` — Control: getByTestId from TEST_IDS

Applied diff to `tests/unit/boundaries.test.ts`:
- Added 2 violation entries to the `violations` array
- Added 2 control entries to the `allowed` array
- Added `"src/shared/test-ids.ts"` to `importTargets` array
- Updated describe text to mention ADR-0003

### Step 2: Run tests (expect 3 failed, 41 passed out of 44)

```
Command: npx vitest run tests/unit/shared/test-ids.test.ts tests/unit/boundaries.test.ts

Result:
 Test Files  2 failed (2)
      Tests  3 failed | 41 passed (44)
   Start at  10:26:35
   Duration  1.02s
```

**Expected:** 3 failed | 41 passed (44) ✓
- 1 fail: import target `src/shared/test-ids.ts` does not exist
- 2 fails: lint violations not reported (rule not yet created)

### Step 3: Create `src/shared/test-ids.ts`

Created empty, typed registry with comment explaining ADR-0003 and NFR-T6:

```typescript
export const TEST_IDS = {} as const satisfies Readonly<Record<string, string>>;
export type TestId = (typeof TEST_IDS)[keyof typeof TEST_IDS];
```

### Step 4: Run tests again (expect 2 failed, 44 passed out of 46)

```
Command: npx vitest run tests/unit/shared/test-ids.test.ts tests/unit/boundaries.test.ts

Result:
 Test Files  1 failed | 1 passed (2)
      Tests  2 failed | 44 passed (46)
   Start at  10:26:47
   Duration  739ms
```

**Expected:** 2 failed | 44 passed (46) ✓
- Import target now exists
- 2 violations still not reported (eslint rule still missing)

### Step 5: Apply diff to `eslint.config.mjs`

Inserted new rule block before the final `prettier,` line with:
- Files scope: `["app/**/*.tsx", "src/ui/**/*.tsx", "tests/e2e/**/*.ts"]`
- Selector for JSX `data-testid` string literals
- Selector for `getByTestId` string literal arguments
- Error messages referencing TEST_IDS in src/shared/test-ids.ts

### Step 6: Run tests (expect 46 passed)

```
Command: npx vitest run tests/unit/shared/test-ids.test.ts tests/unit/boundaries.test.ts

Result:
 Test Files  2 passed (2)
      Tests  46 passed (46)
   Start at  10:27:02
   Duration  1.07s
```

**Expected:** 46 passed ✓
- All tests now pass, violations properly detected by the rule

### Step 7: All unit gates

```
Command 1: npx prettier --write src/shared tests/unit eslint.config.mjs
Result: All files unchanged (already formatted)

Command 2: npm run lint
Result: Exit 0 (no eslint violations in entire repository)

Command 3: npm run format:check
Result: All matched files use Prettier code style!

Command 4: npm run typecheck
Result: Exit 0 (no TypeScript errors)

Command 5: npm test
Result:
 Test Files  26 passed (26)
      Tests  429 passed (429)
   Start at  10:27:22
   Duration  5.93s
```

**Expected:** All commands exit 0, 427 tests pass
**Actual:** All commands exit 0, **429 tests pass** ✓ (plan predicted 422 → 427, actual is +2 more)

### Step 8: Commit

```bash
git add src/shared/test-ids.ts tests/unit/shared/test-ids.test.ts eslint.config.mjs tests/unit/boundaries.test.ts tests/fixtures/boundaries
GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit -m "feat(shared): test-ids.ts, and a lint rule that keeps every data-testid in it (T-04, ADR-0003)"
```

**Result:**
```
[task/T-04-shared 60ca072] feat(shared): test-ids.ts, and a lint rule that keeps every data-testid in it (T-04, ADR-0003)
 8 files changed, 88 insertions(+)
 create mode 100644 src/shared/test-ids.ts
 create mode 100644 tests/fixtures/boundaries/e2e-literal-test-id.ts.fixture
 create mode 100644 tests/fixtures/boundaries/e2e-shared-test-id-allowed.ts.fixture
 create mode 100644 tests/fixtures/boundaries/ui-literal-test-id.tsx.fixture
 create mode 100644 tests/fixtures/boundaries/ui-shared-test-id-allowed.tsx.fixture
 create mode 100644 tests/unit/shared/test-ids.test.ts
```

**Commit SHA:** `60ca07267bb12ed8b61cb9694b7674569de89081`

## Verification

✓ All 8 steps completed in order
✓ Step 2 output: exactly 3 failed | 41 passed (44)
✓ Step 4 output: exactly 2 failed | 44 passed (46)  
✓ Step 6 output: exactly 46 passed
✓ Step 7: all unit gates pass (429 total tests passing, exceeds plan prediction of 427)
✓ Step 8: single commit with correct message
✓ `npm run lint` exits 0 across entire repository (verified no violations in app/, src/ui/, tests/e2e/)
✓ No pre-commit hook failures (gitleaks cache handled correctly)

## Files Changed

### Created:
- `src/shared/test-ids.ts` — Empty typed registry and TestId type
- `tests/unit/shared/test-ids.test.ts` — Two tests for registry properties
- `tests/fixtures/boundaries/ui-literal-test-id.tsx.fixture` — JSX violation
- `tests/fixtures/boundaries/ui-shared-test-id-allowed.tsx.fixture` — JSX control
- `tests/fixtures/boundaries/e2e-literal-test-id.ts.fixture` — E2E violation
- `tests/fixtures/boundaries/e2e-shared-test-id-allowed.ts.fixture` — E2E control

### Modified:
- `eslint.config.mjs` — Added new rule block (21 lines)
- `tests/unit/boundaries.test.ts` — Added fixture refs and updated describe text (18 lines)
