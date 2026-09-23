# Task 3 Report: Auth Schemas and Error Envelope

**Status:** DONE

## Summary

Task 3 successfully implements auth schemas (LoginSchema, SignupSchema with response types) and the error envelope (ErrorEnvelope, ErrorCode, toErrorIssues helper) in `src/shared/schemas.ts`, updates `src/server/http.ts` to use ErrorEnvelope["error"] as the ApiErrorCode type, and amends SPEC-auth to v1.0.1 reflecting finding F2 (error bodies carry the `message` field).

## Execution Summary

### Step 1: Amended SPEC-auth to v1.0.1 (finding F2)
Updated `docs/03-specs/auth.md`:
- Added v1.0.1 status notation and changelog entry documenting the change
- Updated API route matrix (§6) to show message field in 401 and 429 responses

### Step 2: Created Failing Test Files
- `tests/unit/shared/auth-schemas.test.ts` — 25 test cases for LoginSchema, SignupSchema, and response schemas
- `tests/unit/shared/error-envelope.test.ts` — 6 test cases for ErrorEnvelope, ERROR_CODES, and toErrorIssues helper

### Step 3: Confirmed Tests Fail
```
Test Files  2 failed (2)
      Tests  no tests
Expected:   "Cannot find package '@/src/shared/schemas'"
```

### Step 4: Wrote src/shared/schemas.ts
Implemented complete file with:
- Auth constants: EMAIL_PATTERN, EMAIL_MAX (254), NAME_MAX (60), PASSWORD_MIN (8), PASSWORD_MAX (128)
- LoginSchema and LoginInput type
- SignupSchema and SignupInput type
- LoginResponseSchema, SignupResponseSchema, SessionResponseSchema (strict objects)
- ERROR_CODES array and ErrorCode type
- ErrorIssueSchema and ErrorIssue type
- ErrorEnvelopeSchema and ErrorEnvelope type
- toErrorIssues helper function

### Step 5: Auth Tests Pass
```
Test Files  1 passed (1)
      Tests  25 passed (25)
```

### Step 6: Updated src/server/http.ts
Replaced entire file with new version:
- Import ErrorEnvelope type from src/shared/schemas
- ApiErrorCode now derives from ErrorEnvelope["error"]
- errorResponse function signature unchanged (still writes { error, message })

### Step 7: Error Envelope and Support Tests Pass
```
Test Files  2 passed (2)
      Tests  21 passed (21)
```
Verified all seven ERROR_CODES can be written by errorResponse and parsed by ErrorEnvelopeSchema.

### Step 8: All Unit Gates Pass

**Prettier:**
```
src/shared/schemas.ts 6ms (unchanged)
src/server/http.ts 1ms (unchanged)
tests/unit/shared/auth-schemas.test.ts 8ms (unchanged)
tests/unit/shared/error-envelope.test.ts 3ms (unchanged)
```
Status: ✓ All files conform

**Lint (ESLint):**
```
eslint . --max-warnings 0
```
Status: ✓ No errors or warnings

**Format Check (Prettier):**
```
Checking formatting...
All matched files use Prettier code style!
```
Status: ✓ Pass

**TypeCheck (TypeScript):**
```
tsc --noEmit
```
Status: ✓ No type errors

**Full Test Suite (Vitest):**
```
Test Files  22 passed (22)
      Tests  395 passed (395)
Duration    5.49s
```
Status: ✓ All 395 tests pass (matches plan prediction: 364 → 395)

### Step 9: Commits Made

**Commit 1 (Document):**
```
commit fca80a8
Author: Ruslan
Date:   [timestamp]

    docs(auth): v1.0.1 — §6 error bodies carry the message §2.10 requires (T-04 plan gate, F2)
    
    1 file changed, 3 insertions(+), 3 deletions(-)
    - docs/03-specs/auth.md
```

**Commit 2 (Code):**
```
commit 2b95b95
Author: Ruslan
Date:   [timestamp]

    feat(shared): LoginSchema, SignupSchema and ErrorEnvelope; ApiErrorCode is the envelope's type (T-04)
    
    4 files changed, 335 insertions(+), 12 deletions(-)
    + src/shared/schemas.ts (110 lines)
    + tests/unit/shared/auth-schemas.test.ts (146 lines)
    + tests/unit/shared/error-envelope.test.ts (76 lines)
    - src/server/http.ts (updated type definition)
```

## Final Status

✅ All steps completed successfully
✅ All 395 tests pass (22 files)
✅ No linting, formatting, or type errors
✅ Both commits created with document first, code second
✅ ErrorEnvelope schema fully integrated
✅ ApiErrorCode type sourced from schema (no duplicate definitions)

**Test Summary:** 22 Test Files, 395 Tests Passed

**Commit SHAs:**
- Document: fca80a8
- Code: 2b95b95
